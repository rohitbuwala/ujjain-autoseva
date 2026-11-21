import { createHash, randomUUID } from "crypto";
import type { ClientSession } from "mongoose";
import { z } from "zod";

import { compareRefundLedger, providerRefundSchema, readProviderRefunds, RefundProviderError } from "@/lib/provider-refunds";
import { fetchRazorpayRefundForReview, RazorpayReadError } from "@/lib/razorpay";
import { inspectWebhookSubmission, linkVerifiedWebhookSubmission, updateSubmissionOutcome, type VerifiedRefundCorrelation } from "@/lib/refund-submission";
import { currentRefundCapture, refundBalanceBinding, RefundError, REFUND_ID, refundTransaction } from "@/lib/refunds";
import Refund, { RefundBalance, type RefundRecord } from "@/models/Refund";
import RefundWebhookEvent, { REFUND_WEBHOOK_TYPES, type RefundWebhookRecord } from "@/models/RefundWebhookEvent";

const ACCOUNT_ID = /^acc_[A-Za-z0-9]{1,64}$/;
const EVENT_ID = /^[A-Za-z0-9_-]{1,128}$/;
const LEASE_MS = 45_000;
const MAX_ATTEMPTS = 5;
const PAGE_SIZE = 20;
const EVIDENCE_MAX_AGE_MS = 10 * 60_000;
const majority = { w: "majority" as const };
const eventType = z.enum(REFUND_WEBHOOK_TYPES);
const envelope = z.object({
  entity: z.literal("event"),
  account_id: z.string().regex(ACCOUNT_ID),
  event: eventType,
  created_at: z.number().int().positive().max(253402300799),
  payload: z.object({ refund: z.object({ entity: providerRefundSchema.extend({ entity: z.literal("refund") }) }) }),
});
const operatorAction = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("process_next") }),
  z.strictObject({ action: z.literal("recheck"), id: z.string().regex(REFUND_ID) }),
  z.strictObject({ action: z.literal("resolve"), id: z.string().regex(REFUND_ID) }),
  z.strictObject({ action: z.literal("acknowledge"), id: z.string().regex(REFUND_ID) }),
]);
export { operatorAction as refundWebhookOperatorAction };
type State = z.infer<typeof providerRefundSchema>["status"];
type Claim = RefundWebhookRecord & { leaseToken: string };
type Outcome = { state: "applied" | "review" | "retry"; issue?: string; verifiedStatus?: State };
type Snapshot = Awaited<ReturnType<typeof readProviderRefunds>>;

const terminalEvent = { "refund.processed": "processed", "refund.failed": "failed" } as const;

export function isRefundWebhookEvent(event: string) {
  return eventType.safeParse(event).success;
}

export function parseRefundWebhook(payload: unknown, eventId: string | null, rawBody: Buffer) {
  const account = process.env.RAZORPAY_REFUND_WEBHOOK_ACCOUNT_ID;
  if (!account || !ACCOUNT_ID.test(account)) throw new RefundError(503, "Refund webhook account is not configured.");
  const parsed = envelope.safeParse(payload);
  if (!parsed.success || !eventId || !EVENT_ID.test(eventId)) throw new RefundError(400, "Invalid Razorpay refund payload.");
  const value = parsed.data;
  const refund = value.payload.refund.entity;
  if (account !== value.account_id) throw new RefundError(400, "Unexpected Razorpay refund account.");
  if (value.event !== "refund.created" && terminalEvent[value.event] !== refund.status) {
    throw new RefundError(400, "Invalid Razorpay refund event status.");
  }
  return {
    _id: createHash("sha256").update(JSON.stringify([account, eventId])).digest("hex"),
    accountId: account, eventId, bodyHash: createHash("sha256").update(rawBody).digest("hex"),
    eventType: value.event, refundId: refund.id, paymentId: refund.payment_id, amountPaise: refund.amount,
    currency: refund.currency, reportedStatus: refund.status, providerCreatedAt: new Date(value.created_at * 1000),
  };
}

export async function enqueueRefundWebhook(event: ReturnType<typeof parseRefundWebhook>) {
  const now = new Date();
  try {
    const result = await RefundWebhookEvent.updateOne({ _id: event._id }, {
      $setOnInsert: { ...event, state: "queued", attemptCount: 0, nextAttemptAt: now, createdAt: now, updatedAt: now },
    }, { upsert: true, timestamps: false, writeConcern: majority });
    if (result.upsertedCount === 1) return;
  } catch (error) {
    if ((error as { code?: number } | null)?.code !== 11000) throw error;
  }
  const existing = await RefundWebhookEvent.findById(event._id).select("bodyHash").lean();
  if (!existing) throw new Error("Refund webhook inbox record unavailable");
  if (existing.bodyHash === event.bodyHash) return;

  await RefundWebhookEvent.updateOne({ _id: event._id, conflictAt: null }, {
    $set: { state: "review", issue: "event_id_conflict", conflictAt: now },
    $unset: { nextAttemptAt: 1, leaseToken: 1, leaseUntil: 1, verifiedStatus: 1 },
  }, { writeConcern: majority });
}

function claimFilter(claim: Claim) {
  return { _id: claim._id, leaseToken: claim.leaseToken, leaseUntil: { $gt: new Date() }, conflictAt: null };
}

async function claimEvent(id?: string, adminId?: string, requireEvidence = false) {
  const now = new Date();
  const due = { state: { $in: ["queued", "retry"] }, nextAttemptAt: { $lte: now } };
  const leaseToken = randomUUID();
  const claimed = await RefundWebhookEvent.findOneAndUpdate({
    ...(id ? { _id: id, $and: [{ $or: [due, { state: { $in: ["review", "acknowledged"] } }] }] } : due),
    ...(requireEvidence && { state: "review", issue: "verified_reconciliation_available" }),
    conflictAt: null,
    $or: [{ leaseUntil: null }, { leaseUntil: { $lte: now } }],
  }, {
    $set: { leaseToken, leaseUntil: new Date(+now + LEASE_MS), ...(adminId && { lastRecheckedBy: adminId }) },
    $inc: { attemptCount: 1 },
  }, { returnDocument: "after", sort: { nextAttemptAt: 1, _id: 1 }, writeConcern: majority }).lean();
  return claimed as Claim | null;
}

const review = (issue: string, verifiedStatus?: State): Outcome => ({ state: "review", issue, verifiedStatus });
const retry = (issue: string): Outcome => ({ state: "retry", issue });

async function finishEvent(claim: Claim, outcome: Outcome, session?: ClientSession) {
  const now = new Date();
  const state = outcome.state === "retry" && claim.attemptCount >= MAX_ATTEMPTS ? "review" : outcome.state;
  const unset: Record<string, 1> = { leaseToken: 1, leaseUntil: 1 };
  if (state !== "retry") unset.nextAttemptAt = 1;
  if (!outcome.issue) unset.issue = 1;
  if (!outcome.verifiedStatus) unset.verifiedStatus = 1;
  const result = await RefundWebhookEvent.updateOne(claimFilter(claim), {
    $set: {
      state, checkedAt: now,
      ...(outcome.issue && { issue: outcome.issue }),
      ...(outcome.verifiedStatus && { verifiedStatus: outcome.verifiedStatus }),
      ...(state === "retry" && { nextAttemptAt: new Date(+now + 30_000 * 2 ** (claim.attemptCount - 1)) }),
    },
    $unset: unset,
  }, session ? { session } : { writeConcern: majority });
  if (!result.matchedCount && session) throw new RefundError(409, "Refund webhook claim changed.");
}

function conflictingReport(claim: Claim, status: State) {
  if (claim.reportedStatus === "pending" || status === claim.reportedStatus) return null;
  return status === "pending" ? retry("provider_state_pending") : review("conflicting_terminal_state", status);
}

async function classifyUnlinked(claim: Claim): Promise<Outcome | { correlation: VerifiedRefundCorrelation }> {
  try {
    const raw = await fetchRazorpayRefundForReview(claim.paymentId, claim.refundId, AbortSignal.timeout(8_000));
    const provider = providerRefundSchema.safeParse(raw);
    if (!provider.success) return review("ambiguous_provider_status");
    if (provider.data.id !== claim.refundId || provider.data.payment_id !== claim.paymentId ||
        provider.data.amount !== claim.amountPaise || provider.data.currency !== claim.currency) {
      return review("provider_refund_mismatch");
    }
    const conflict = conflictingReport(claim, provider.data.status);
    if (conflict) return conflict;
    const correlation = await inspectWebhookSubmission(claim.accountId, provider.data);
    if (correlation?.evidence) return conflictingReport(claim, correlation.evidence.provider.status)
      ?? { correlation: correlation.evidence };
    if (correlation?.issue) return review(correlation.issue);
    return review("external_refund", provider.data.status);
  } catch (error) {
    return error instanceof RazorpayReadError && error.category === "missing_order"
      ? retry("unknown_refund_id") : retry("provider_unavailable");
  }
}

async function applyVerifiedEvent(
  claim: Claim, original: RefundRecord, orderId: string, snapshot: Snapshot, status: State, readOnly: boolean,
  correlation?: VerifiedRefundCorrelation,
) {
  await refundTransaction(async (session) => {
    const finish = (outcome: Outcome) => finishEvent(claim, outcome, session);
    if (correlation) {
      if (readOnly) return finish(review("verified_reconciliation_available", status));
      await linkVerifiedWebhookSubmission(correlation, session);
    }
    const local = await Refund.findById(original._id).session(session).lean();
    const capture = local && await currentRefundCapture(local, session);
    if (!local || !capture || capture.orderId !== orderId || local.razorpayRefundId !== claim.refundId ||
        local.razorpayPaymentId !== claim.paymentId || local.currency !== claim.currency ||
        local.approvedPaise !== claim.amountPaise || capture.capturedPaise !== original.capturedPaise ||
        String(local.bookingId) !== String(original.bookingId) || local.customerId !== original.customerId) {
      return finish(review("capture_or_refund_mismatch", status));
    }
    const desired = status === "pending" ? "processing" : status;
    const terminal = local.status === "processed" || local.status === "failed";
    if (terminal && desired !== local.status) return finish(review("conflicting_terminal_state", status));
    if (!terminal && !["approved", "processing", "needs_review"].includes(local.status)) {
      return finish(review("invalid_local_state", status));
    }
    const account = refundBalanceBinding(local);
    const balance = await RefundBalance.findOne(account).session(session).lean();
    const rows = await Refund.find({ razorpayPaymentId: claim.paymentId }).limit(501).session(session).lean();
    if (!balance || rows.length > 500 ||
        rows.some((row) => String(row.bookingId) !== String(local.bookingId) || row.customerId !== local.customerId)) {
      return finish(review("ledger_mismatch", status));
    }
    const movingToTerminal = !terminal && status !== "pending";
    if (!Number.isSafeInteger(balance.reservedPaise) || balance.reservedPaise < 0 ||
        !Number.isSafeInteger(balance.processedPaise) || balance.processedPaise < 0 ||
        (!terminal && (balance.activeRefundId !== local._id || balance.reservedPaise < claim.amountPaise))) {
      return finish(review("ledger_mismatch", status));
    }
    const reservedDelta = movingToTerminal ? -claim.amountPaise : 0;
    const processedDelta = movingToTerminal && status === "processed" ? claim.amountPaise : 0;
    const comparison = compareRefundLedger(snapshot, rows.map((row) => row._id === local._id ? { ...row, status: desired } : row),
      { reservedPaise: balance.reservedPaise + reservedDelta, processedPaise: balance.processedPaise + processedDelta });
    if (comparison.issue) return finish(review(comparison.issue, status));
    if (readOnly) return finish(review("verified_reconciliation_available", status));
    if (local.status === desired) return finish({ state: "applied", verifiedStatus: status });

    const changed = await RefundBalance.updateOne({
      ...account, activeRefundId: local._id, reservedPaise: balance.reservedPaise, processedPaise: balance.processedPaise,
    }, {
      $inc: { reservedPaise: reservedDelta, processedPaise: processedDelta, providerCheckVersion: 1 },
      $set: { providerCheckStatus: "consumed" },
      $unset: { providerAvailablePaise: 1, ...(movingToTerminal && { activeRefundId: 1 }) },
    }, { session });
    if (!changed.matchedCount) throw new RefundError(409, "Refund ledger changed.");
    const now = new Date();
    const result = await Refund.updateOne({ _id: local._id, status: local.status, razorpayRefundId: claim.refundId }, {
      $set: { status: desired, reconciledAt: now,
        ...(desired === "processing" && !local.processingAt && { processingAt: now }),
        ...(desired === "processed" && { processedAt: now }),
        ...(desired === "failed" && { failureReason: "provider_confirmed_failed" }),
      },
      $push: { audit: { status: desired, actorId: "razorpay_webhook", at: now, note: "Status verified against Razorpay." } },
    }, { session });
    if (!result.matchedCount) throw new RefundError(409, "Refund status changed.");
    await updateSubmissionOutcome(local, status, session);
    return finish({ state: "applied", verifiedStatus: status });
  });
}

export async function processRefundWebhook(id?: string, adminId?: string, mode?: "recheck" | "resolve") {
  const claim = await claimEvent(id, adminId, mode === "resolve");
  if (!claim) return false;
  try {
    if (!id && claim.attemptCount > MAX_ATTEMPTS) await finishEvent(claim, review("attempt_limit"));
    else if (claim.accountId !== process.env.RAZORPAY_REFUND_WEBHOOK_ACCOUNT_ID) await finishEvent(claim, review("account_unavailable"));
    else {
      const local = await Refund.findOne({ razorpayRefundId: claim.refundId }).lean();
      if (!local) {
        const result = await classifyUnlinked(claim);
        if ("correlation" in result) {
          const evidence = result.correlation;
          await applyVerifiedEvent(claim, evidence.refund, evidence.orderId, evidence.snapshot,
            evidence.provider.status, mode === "recheck", evidence);
        } else await finishEvent(claim, result);
      }
      else {
        const capture = await currentRefundCapture(local);
        if (!capture || capture.paymentId !== claim.paymentId || capture.currency !== claim.currency || local.approvedPaise !== claim.amountPaise) {
          await finishEvent(claim, review("capture_or_refund_mismatch"));
        } else {
          const snapshot = await readProviderRefunds(capture);
          const provider = snapshot.refunds.find((refund) => refund.id === claim.refundId);
          if (!provider) await finishEvent(claim, retry("unknown_refund_id"));
          else if (provider.amount !== claim.amountPaise) await finishEvent(claim, review("provider_refund_mismatch"));
          else {
            const conflict = conflictingReport(claim, provider.status);
            if (conflict) await finishEvent(claim, conflict);
            else await applyVerifiedEvent(claim, local, capture.orderId, snapshot, provider.status, mode === "recheck");
          }
        }
      }
    }
  } catch (error) {
    const outcome = error instanceof RefundProviderError
      ? (error.category === "unavailable" || error.category === "incomplete_history"
        ? retry(error.category) : review(error.category))
      : retry("reconciliation_failed");
    await finishEvent(claim, outcome);
  }
  return true;
}

export async function acknowledgeExternalRefund(id: string, adminId: string) {
  const now = new Date();
  const result = await RefundWebhookEvent.updateOne({
    _id: id, state: "review", issue: "external_refund", verifiedStatus: { $in: ["processed", "failed"] },
    checkedAt: { $gte: new Date(+now - EVIDENCE_MAX_AGE_MS) }, conflictAt: null, leaseToken: null,
  }, { $set: { state: "acknowledged", acknowledgedBy: adminId, acknowledgedAt: now } }, { writeConcern: majority });
  if (!result.matchedCount) throw new RefundError(409, "Acknowledgment requires recent, verified terminal evidence.");
}

export async function listRefundWebhookEvents(page: number) {
  const rows = await RefundWebhookEvent.find().sort({ createdAt: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE + 1).lean();
  return { page, hasMore: rows.length > PAGE_SIZE, items: rows.slice(0, PAGE_SIZE).map((row) => ({
    id: row._id, eventType: row.eventType, refundId: row.refundId, paymentId: row.paymentId,
    amountPaise: row.amountPaise, currency: row.currency, reportedStatus: row.reportedStatus,
    state: row.state, issue: row.issue ?? null, verifiedStatus: row.verifiedStatus ?? null,
    receivedAt: row.createdAt, providerCreatedAt: row.providerCreatedAt, conflictAt: row.conflictAt ?? null,
    checkedAt: row.checkedAt ?? null, nextAttemptAt: row.nextAttemptAt ?? null, attemptCount: row.attemptCount,
    acknowledgedAt: row.acknowledgedAt ?? null, acknowledgedBy: row.acknowledgedBy ?? null,
    lastRecheckedBy: row.lastRecheckedBy ?? null,
  })) };
}
