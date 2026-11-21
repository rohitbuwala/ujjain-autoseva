import type { ClientSession } from "mongoose";

import { readProviderRefunds, RefundProviderError, type ProviderRefund } from "@/lib/provider-refunds";
import { buildRefundSubmissionRequest, newRefundReceipt, RAZORPAY_ACCOUNT_ID, REFUND_RECEIPT } from "@/lib/razorpay-refund-submission";
import {
  currentRefundCapture, refundBalanceBinding, RefundError, refundTransaction, requireCurrentRefundAdmin, withVerifiedRefundReservation,
} from "@/lib/refunds";
import Refund, { RefundBalance, type RefundRecord } from "@/models/Refund";
import RefundSubmission, { type RefundSubmissionRecord } from "@/models/RefundSubmission";

const recoverable = ["dispatching", "review"];
const majority = { w: "majority" as const };

function currentAccount() {
  const account = process.env.RAZORPAY_REFUND_WEBHOOK_ACCOUNT_ID;
  if (!account || !RAZORPAY_ACCOUNT_ID.test(account)) throw new RefundError(503, "Razorpay refund account is not configured.");
  return account;
}

function matchesIntent(intent: RefundSubmissionRecord, refund: RefundRecord) {
  return intent._id === refund._id && intent.operationKey === refund.operationKey &&
    intent.idempotencyKey === refund.executionIdempotencyKey && intent.paymentId === refund.razorpayPaymentId &&
    intent.amountPaise === refund.approvedPaise && intent.currency === refund.currency;
}

export async function prepareRefundExecution(adminId: string, id: string) {
  await requireCurrentRefundAdmin(adminId);
  if (await RefundSubmission.findById(id).lean()) return { status: "already_prepared" as const };
  const accountId = currentAccount();
  const receipt = newRefundReceipt();
  try {
    return await withVerifiedRefundReservation(adminId, id, async (refund, session, amountPaise) => {
      if (await RefundSubmission.findById(id).session(session).lean()) return { status: "already_prepared" as const };
      if (refund.executionPreparedAt && refund.executionIdempotencyKey !== refund.operationKey) {
        throw new RefundError(409, "Existing preparation needs operator review.");
      }
      const now = new Date();
      const [intent] = await RefundSubmission.create([{
        _id: id, accountId, paymentId: refund.razorpayPaymentId, amountPaise,
        currency: refund.currency, operationKey: refund.operationKey, idempotencyKey: refund.operationKey,
        receipt, state: "prepared", attemptCount: 0, preparedBy: adminId,
      }], { session });
      buildRefundSubmissionRequest(intent.toObject());
      const result = await Refund.updateOne({ _id: id, status: "approved", razorpayRefundId: null }, {
        $set: { executionPreparedAt: now, executionPreparedBy: adminId, executionIdempotencyKey: refund.operationKey },
        $push: { audit: { status: "approved", actorId: adminId, at: now, note: "Submission intent prepared. Execution disabled." } },
      }, { session });
      if (!result.matchedCount) throw new RefundError(409, "Refund changed during preparation.");
      return { status: "prepared" as const };
    });
  } catch (error) {
    if (error instanceof RefundError && error.status === 409 && await RefundSubmission.findById(id).lean()) {
      return { status: "already_prepared" as const };
    }
    throw error;
  }
}

// Future dispatch must take this claim before transport. No route or worker calls it in Phase 4J.
export async function claimRefundSubmission(adminId: string, id: string) {
  return withVerifiedRefundReservation(adminId, id, async (refund, session) => {
    const intent = await RefundSubmission.findById(id).session(session).lean();
    if (!intent || !matchesIntent(intent, refund) || intent.accountId !== currentAccount() ||
        intent.state !== "prepared" || intent.attemptCount !== 0) {
      throw new RefundError(409, "Submission cannot be claimed. Reconcile any prior attempt.");
    }
    const request = buildRefundSubmissionRequest(intent);
    const result = await RefundSubmission.updateOne({ _id: id, state: "prepared", attemptCount: 0 }, {
      $set: { state: "dispatching", attemptedAt: new Date(), attemptedBy: adminId },
      $inc: { attemptCount: 1 },
    }, { session });
    if (!result.matchedCount) throw new RefundError(409, "Submission already claimed.");
    return request;
  });
}

export type VerifiedRefundCorrelation = {
  intent: RefundSubmissionRecord;
  refund: RefundRecord;
  snapshot: Awaited<ReturnType<typeof readProviderRefunds>>;
  provider: ProviderRefund;
  orderId: string;
  checkedAt: Date;
};

type CorrelationCheck = { issue: string; evidence?: never } | { evidence: VerifiedRefundCorrelation; issue?: never };

async function inspectCorrelation(intent: RefundSubmissionRecord, expectedProviderId?: string): Promise<CorrelationCheck> {
  if (!recoverable.includes(intent.state) || intent.attemptCount !== 1 || !intent.attemptedAt ||
      intent.accountId !== currentAccount()) return { issue: "attempt_not_verifiable" };
  const refund = await Refund.findById(intent._id).lean();
  const capture = refund && await currentRefundCapture(refund);
  if (!refund || !capture || !matchesIntent(intent, refund)) return { issue: "capture_or_intent_mismatch" };
  try {
    const snapshot = await readProviderRefunds(capture);
    const matches = snapshot.refunds.filter((item) => item.receipt === intent.receipt);
    if (matches.length === 0) return { issue: "provider_outcome_unproven" };
    const [provider] = matches;
    if (matches.length !== 1 || (expectedProviderId && provider.id !== expectedProviderId) ||
        provider.payment_id !== intent.paymentId || provider.currency !== intent.currency || provider.amount !== intent.amountPaise) {
      return { issue: "provider_correlation_conflict" };
    }
    return { evidence: { intent, refund, snapshot, provider, orderId: capture.orderId, checkedAt: new Date() } };
  } catch (error) {
    return { issue: error instanceof RefundProviderError ? error.category : "provider_unavailable" };
  }
}

async function linkCorrelation(evidence: VerifiedRefundCorrelation, session: ClientSession) {
  const { intent, provider, orderId, checkedAt } = evidence;
  if (Date.now() - +checkedAt > 15_000) throw new RefundError(409, "Provider evidence expired.");
  const current = await RefundSubmission.findById(intent._id).session(session).lean();
  const refund = await Refund.findById(intent._id).session(session).lean();
  const capture = refund && await currentRefundCapture(refund, session);
  if (!current || !refund || !capture || capture.orderId !== orderId || !matchesIntent(current, refund) ||
      current.receipt !== intent.receipt || current.accountId !== intent.accountId || current.accountId !== currentAccount() ||
      current.attemptCount !== 1 || current.paymentId !== provider.payment_id || current.amountPaise !== provider.amount ||
      current.currency !== provider.currency) {
    throw new RefundError(409, "Submission changed during recovery.");
  }
  if (current.state === "linked" && current.providerRefundId === provider.id && refund.razorpayRefundId === provider.id) return;
  const providerLink = await Refund.findOne({ razorpayRefundId: provider.id }).session(session).lean();
  const intentLink = await RefundSubmission.findOne({ providerRefundId: provider.id }).session(session).lean();
  if (providerLink || intentLink || current.providerRefundId || refund.razorpayRefundId || refund.status !== "approved" ||
      !recoverable.includes(current.state)) throw new RefundError(409, "Provider refund ID conflicts with the local ledger.");

  const balance = await RefundBalance.updateOne({
    ...refundBalanceBinding(refund), activeRefundId: refund._id, reservedPaise: { $gte: intent.amountPaise },
  }, {
    $inc: { providerCheckVersion: 1 }, $set: { providerCheckStatus: "consumed" }, $unset: { providerAvailablePaise: 1 },
  }, { session });
  if (!balance.matchedCount) throw new RefundError(409, "Refund reservation needs operator review.");
  const linked = await Refund.updateOne({ _id: refund._id, status: "approved", razorpayRefundId: null }, {
    $set: { razorpayRefundId: provider.id },
    $push: { audit: { status: "approved", actorId: "razorpay_reconciliation", at: checkedAt, note: "Provider refund ID verified and linked." } },
  }, { session });
  const recorded = await RefundSubmission.updateOne({ _id: intent._id, state: { $in: recoverable }, providerRefundId: null }, {
    $set: { state: "linked", providerRefundId: provider.id, providerStatus: provider.status, checkedAt, linkedAt: new Date() },
    $unset: { issue: 1 },
  }, { session });
  if (!linked.matchedCount || !recorded.matchedCount) throw new RefundError(409, "Provider refund link changed during recovery.");
}

async function flagReview(id: string, issue: string) {
  const result = await RefundSubmission.updateOne({ _id: id, state: { $in: recoverable } }, {
    $set: { state: "review", issue, checkedAt: new Date() },
  }, { writeConcern: majority });
  if (!result.matchedCount && (await RefundSubmission.findById(id).lean())?.state === "linked") {
    return { status: "linked" as const };
  }
  return { status: "review" as const, issue };
}

export async function recoverRefundSubmission(adminId: string, id: string) {
  await requireCurrentRefundAdmin(adminId);
  const intent = await RefundSubmission.findById(id).lean();
  if (!intent || intent.state === "prepared") throw new RefundError(409, "There is no submission attempt to recover.");
  if (intent.state === "linked") return { status: "linked" };
  const result = await inspectCorrelation(intent);
  if (!result.evidence) {
    await requireCurrentRefundAdmin(adminId);
    return flagReview(id, result.issue);
  }
  try {
    await refundTransaction(async (session) => {
      await requireCurrentRefundAdmin(adminId, session);
      await linkCorrelation(result.evidence, session);
    });
    return { status: "linked" };
  } catch (error) {
    if (!(error instanceof RefundError) || error.status !== 409) throw error;
    return flagReview(id, "provider_link_conflict");
  }
}

export async function inspectWebhookSubmission(accountId: string, provider: ProviderRefund): Promise<CorrelationCheck | null> {
  if (!provider.receipt || !REFUND_RECEIPT.test(provider.receipt)) return null;
  const intent = await RefundSubmission.findOne({ accountId, receipt: provider.receipt }).lean();
  if (!intent) return null;
  if (intent.paymentId !== provider.payment_id || intent.amountPaise !== provider.amount || intent.currency !== provider.currency) {
    return { issue: "provider_correlation_conflict" } as const;
  }
  return inspectCorrelation(intent, provider.id);
}

export { linkCorrelation as linkVerifiedWebhookSubmission };

export async function updateSubmissionOutcome(refund: RefundRecord, status: ProviderRefund["status"], session: ClientSession) {
  const intent = await RefundSubmission.findById(refund._id).session(session).lean();
  if (!intent) return; // Phase 4I provider links can predate submission intents.
  if (!matchesIntent(intent, refund) || intent.state !== "linked" || intent.providerRefundId !== refund.razorpayRefundId ||
      (intent.providerStatus && intent.providerStatus !== "pending" && intent.providerStatus !== status)) {
    throw new RefundError(409, "Provider outcome conflicts with the submission intent.");
  }
  const result = await RefundSubmission.updateOne({ _id: intent._id, state: "linked", providerRefundId: intent.providerRefundId }, {
    $set: { providerStatus: status, checkedAt: new Date() },
  }, { session });
  if (!result.matchedCount) throw new RefundError(409, "Submission intent changed.");
}
