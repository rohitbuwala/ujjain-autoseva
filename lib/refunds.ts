import { createHash } from "crypto";
import mongoose, { type ClientSession } from "mongoose";
import { z } from "zod";

import { bookingMinorUnits, RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID, type PaymentBooking } from "@/lib/booking-payments";
import Booking from "@/models/Booking";
import Refund, { RefundBalance, type RefundRecord } from "@/models/Refund";
import User from "@/models/User";
import { compareRefundLedger, readProviderRefunds, RefundProviderError } from "@/lib/provider-refunds";

const paise = z.number().int().positive();
export const refundRequestSchema = z.object({
  bookingId: z.string().regex(/^[a-f0-9]{24}$/i),
  operationKey: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
  requestedPaise: paise.optional(),
}).strict();
export const refundDecisionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), amountPaise: paise, reason: z.string().trim().min(3).max(500) }).strict(),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3).max(500) }).strict(),
]);
export const REFUND_ID = /^[a-f0-9]{64}$/;
const PAGE_SIZE = 20;
const PROVIDER_CHECK_TTL_MS = 15_000;
const BOOKING_FIELDS = "_id bookingId userId status cancelledAt paymentMethod paymentStatus paymentAmount paymentCurrency razorpayOrderId razorpayPaymentId paidAt";
type CapturedBooking = PaymentBooking & { paidAt?: Date; cancelledAt?: Date };
type RefundRequest = z.infer<typeof refundRequestSchema>;
type RefundDecision = z.infer<typeof refundDecisionSchema>;
export class RefundError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export function verifiedRefundCapture(booking: CapturedBooking) {
  const amount = bookingMinorUnits(booking);
  if (booking.status !== "cancelled" || booking.paymentMethod !== "online" || booking.paymentStatus !== "paid" ||
      !(booking.paidAt instanceof Date) || !Number.isFinite(+booking.paidAt) ||
      !booking.razorpayOrderId || !RAZORPAY_ORDER_ID.test(booking.razorpayOrderId) ||
      !booking.razorpayPaymentId || !RAZORPAY_PAYMENT_ID.test(booking.razorpayPaymentId) || amount === null) return null;
  return { razorpayPaymentId: booking.razorpayPaymentId, capturedPaise: amount, currency: "INR" };
}

function binding(refund: Pick<RefundRecord, "razorpayPaymentId" | "bookingId" | "customerId" | "capturedPaise" | "currency">) {
  return { _id: refund.razorpayPaymentId, bookingId: refund.bookingId, customerId: refund.customerId,
    capturedPaise: refund.capturedPaise, currency: refund.currency };
}

async function currentCapture(refund: RefundRecord, session?: ClientSession) {
  const query = Booking.findOne({ _id: refund.bookingId, userId: refund.customerId }).select(BOOKING_FIELDS);
  if (session) query.session(session);
  const booking = await query.lean();
  const capture = booking && verifiedRefundCapture(booking);
  if (!capture || capture.razorpayPaymentId !== refund.razorpayPaymentId ||
      capture.capturedPaise !== refund.capturedPaise || capture.currency !== refund.currency) return null;
  return { paymentId: capture.razorpayPaymentId, orderId: booking.razorpayOrderId, capturedPaise: capture.capturedPaise, currency: capture.currency };
}

export async function reconcileRefundBalance(id: string) {
  const refund = await Refund.findById(id).lean();
  if (!refund) throw new RefundError(404, "Refund request not found.");
  const account = binding(refund);
  const claim = await RefundBalance.findOneAndUpdate(account, {
    $inc: { providerCheckVersion: 1 },
    $set: { providerCheckStatus: "checking" },
    $unset: { providerCheckedAt: 1, providerAvailablePaise: 1, providerIssue: 1,
      providerProcessedPaise: 1, providerPendingPaise: 1, externalRefundCount: 1 },
  }, { returnDocument: "after" }).lean();
  if (!claim || typeof claim.providerCheckVersion !== "number" || !Number.isSafeInteger(claim.providerCheckVersion)) {
    throw new RefundError(409, "Local refund balance needs review.");
  }
  const checkVersion = claim.providerCheckVersion;
  const checkStartedAt = new Date();
  const capture = await currentCapture(refund);
  let snapshot: Awaited<ReturnType<typeof readProviderRefunds>> | undefined;
  let issue: string | null = capture ? null : "capture_mismatch";
  if (capture) {
    try { snapshot = await readProviderRefunds(capture); }
    catch (error) { issue = error instanceof RefundProviderError ? error.category : "unavailable"; }
  }

  return transact(async (session) => {
    const condition = { ...account, providerCheckVersion: checkVersion, providerCheckStatus: "checking" };
    const balance = await RefundBalance.findOne(condition).session(session).lean();
    if (!balance) throw new RefundError(409, "A newer balance check is in progress. Try again.");

    let availablePaise: number | null = null;
    let externalRefundCount = 0;
    let checkIssue = issue;
    if (snapshot) {
      const captureNow = await currentCapture(refund, session);
      const rows = await Refund.find({ razorpayPaymentId: refund.razorpayPaymentId })
        .select("status razorpayRefundId approvedPaise currency bookingId customerId").limit(501).session(session).lean();
      if (!captureNow || captureNow.orderId !== capture?.orderId) checkIssue = "capture_mismatch";
      else if (rows.length > 500 || rows.some((row) => String(row.bookingId) !== String(refund.bookingId) || row.customerId !== refund.customerId)) {
        checkIssue = "ledger_mismatch";
      } else {
        const comparison = compareRefundLedger(snapshot, rows, balance);
        checkIssue = comparison.issue;
        externalRefundCount = comparison.externalRefundCount;
        if (!checkIssue) availablePaise = comparison.availablePaise;
      }
    }
    const status = checkIssue ? "needs_review" : "verified";
    const write = await RefundBalance.updateOne(condition, { $set: {
      providerCheckStatus: status, providerCheckedAt: checkStartedAt, providerIssue: checkIssue ?? undefined,
      providerAvailablePaise: availablePaise ?? undefined,
      providerProcessedPaise: snapshot?.processedPaise, providerPendingPaise: snapshot?.pendingPaise, externalRefundCount,
    } }, { session });
    if (write.matchedCount !== 1) throw new RefundError(409, "A newer balance check is in progress. Try again.");
    return { status, checkVersion, orderId: capture?.orderId, availablePaise, issue: checkIssue, externalRefundCount,
      processedPaise: snapshot?.processedPaise ?? null, pendingPaise: snapshot?.pendingPaise ?? null };
  });
}

async function verifiedProviderCheck(id: string) {
  const result = await reconcileRefundBalance(id);
  if (result.status !== "verified") {
    throw new RefundError(result.issue === "unavailable" ? 503 : 409, "Provider balance could not be verified. Operator review is required.");
  }
  return result;
}

function providerCheckFilter(version: number) {
  return { providerCheckVersion: version, providerCheckStatus: "verified",
    providerCheckedAt: { $gte: new Date(Date.now() - PROVIDER_CHECK_TTL_MS) } };
}

async function transact<T>(action: (session: ClientSession) => Promise<T>) {
  // A concurrent first insert may race on a collection's built-in _id unique index.
  for (let attempt = 0; ; attempt++) {
    try {
      return await mongoose.connection.transaction(action, { readPreference: "primary", writeConcern: { w: "majority" } });
    } catch (error) {
      if (attempt >= 2 || (error as { code?: number } | null)?.code !== 11000) throw error;
    }
  }
}

export { binding as refundBalanceBinding, currentCapture as currentRefundCapture, transact as refundTransaction };

export async function requestRefund(customerId: string, input: RefundRequest) {
  const operationKey = createHash("sha256").update(JSON.stringify([customerId, input.operationKey.toLowerCase()])).digest("hex");
  return transact(async (session) => {
    const existing = await Refund.findOne({ _id: operationKey, customerId }).session(session).lean();
    if (existing) {
      if (String(existing.bookingId) !== input.bookingId.toLowerCase() || existing.requestedPaise !== input.requestedPaise ||
          existing.reason !== input.reason) throw new RefundError(409, "This request key is already in use.");
      return { refund: existing, created: false };
    }

    const booking = await Booking.findOne({ _id: input.bookingId, userId: customerId }).select(BOOKING_FIELDS).session(session).lean();
    if (!booking) throw new RefundError(404, "Booking not found.");
    const capture = verifiedRefundCapture(booking);
    if (!capture) throw new RefundError(409, "Refund requests require a cancelled booking with a verified online capture.");

    const base = { ...capture, bookingId: booking._id, customerId };
    const account = binding(base);
    await RefundBalance.updateOne({ _id: account._id }, { $setOnInsert: { ...account, reservedPaise: 0, processedPaise: 0 } },
      { upsert: true, session });
    const locked = await RefundBalance.updateOne({
      ...account, activeRefundId: null,
      $expr: { $lte: [
        { $add: ["$reservedPaise", "$processedPaise", input.requestedPaise ?? 1] }, "$capturedPaise",
      ] },
    }, { $set: { activeRefundId: operationKey } }, { session });
    if (locked.matchedCount !== 1) throw new RefundError(409, "An active request already exists, or the refundable balance is insufficient.");

    const now = new Date();
    const [refund] = await Refund.create([{
      ...base, _id: operationKey, operationKey, bookingCode: booking.bookingId, requestedPaise: input.requestedPaise,
      reason: input.reason, status: "under_review", requestedAt: now, audit: [
        { status: "requested", actorId: customerId, at: now },
        { status: "under_review", actorId: customerId, at: now, note: "Manual admin review required." },
      ],
    }], { session });
    return { refund: refund.toObject(), created: true };
  });
}

export async function decideRefund(adminId: string, id: string, input: RefundDecision) {
  const initial = await Refund.findById(id).lean();
  if (!initial) throw new RefundError(404, "Refund request not found.");
  const check = input.action === "approve" && initial.status === "under_review" ? await verifiedProviderCheck(id) : null;
  return transact(async (session) => {
    const refund = await Refund.findById(id).session(session).lean();
    if (!refund) throw new RefundError(404, "Refund request not found.");
    const target = input.action === "approve" ? "approved" : "rejected";
    if (refund.status === target && refund.adminId === adminId && refund.adminReason === input.reason &&
        (input.action === "reject" || refund.approvedPaise === input.amountPaise)) return refund;
    if (refund.status !== "under_review") throw new RefundError(409, "This refund request is no longer awaiting a decision.");

    const account = { ...binding(refund), activeRefundId: id };
    const now = new Date();
    let change;
    if (input.action === "approve") {
      const capture = await currentCapture(refund, session);
      if (!capture || !check || capture.orderId !== check.orderId) {
        throw new RefundError(409, "The booking capture needs reconciliation before approval.");
      }
      const result = await RefundBalance.updateOne({
        ...account,
        ...providerCheckFilter(check.checkVersion),
        providerAvailablePaise: { $gte: input.amountPaise },
        $expr: { $lte: [{ $add: ["$reservedPaise", "$processedPaise", input.amountPaise] }, "$capturedPaise"] },
      }, { $inc: { reservedPaise: input.amountPaise }, $set: { providerCheckStatus: "consumed" } }, { session });
      if (result.matchedCount !== 1) throw new RefundError(409, "The approval exceeds the available refundable balance or needs reconciliation.");
      change = { approvedPaise: input.amountPaise, approvedAt: now, type: input.amountPaise === capture.capturedPaise ? "full" : "partial" };
    } else {
      const result = await RefundBalance.updateOne(account, { $unset: { activeRefundId: 1 } }, { session });
      if (result.matchedCount !== 1) throw new RefundError(409, "The refund request needs reconciliation before rejection.");
      change = { rejectedAt: now };
    }

    const result = await Refund.findOneAndUpdate({ _id: id, status: "under_review" }, {
      $set: { ...change, status: target, adminId, adminReason: input.reason },
      $push: { audit: { status: target, actorId: adminId, at: now, note: input.reason } },
    }, { session, returnDocument: "after" }).lean();
    if (!result) throw new RefundError(409, "This refund request changed during review.");
    return result;
  });
}

export async function requireCurrentRefundAdmin(adminId: string, session?: ClientSession) {
  if (!mongoose.isObjectIdOrHexString(adminId)) throw new RefundError(403, "Admin access required.");
  const query = User.exists({ _id: adminId, role: "admin" });
  if (!await (session ? query.session(session) : query)) throw new RefundError(403, "Admin access required.");
}

export async function withVerifiedRefundReservation<T>(
  adminId: string, id: string, action: (refund: RefundRecord, session: ClientSession, amountPaise: number) => Promise<T>,
) {
  await requireCurrentRefundAdmin(adminId);
  const initial = await Refund.findById(id).lean();
  if (!initial || initial.status !== "approved" || initial.razorpayRefundId) {
    throw new RefundError(409, "Refund is not available for execution preparation.");
  }
  const check = await verifiedProviderCheck(id);
  return transact(async (session) => {
    await requireCurrentRefundAdmin(adminId, session);
    const refund = await Refund.findById(id).session(session).lean();
    const capture = refund && await currentCapture(refund, session);
    if (!refund || refund.status !== "approved" || refund.razorpayRefundId ||
        !refund.approvedPaise || !Number.isSafeInteger(refund.approvedPaise) || refund.approvedPaise < 1 ||
        !REFUND_ID.test(refund.operationKey) || refund.operationKey !== refund._id || !capture || capture.orderId !== check.orderId) {
      throw new RefundError(409, "Refund is not available for execution preparation.");
    }
    const guarded = await RefundBalance.updateOne({
      ...binding(refund), activeRefundId: id, ...providerCheckFilter(check.checkVersion),
      reservedPaise: { $gte: refund.approvedPaise }, providerAvailablePaise: { $gte: 0 },
    }, { $set: { providerCheckStatus: "consumed" } }, { session });
    if (guarded.matchedCount !== 1) throw new RefundError(409, "Refund reservation or provider balance needs review.");

    return action(refund, session, refund.approvedPaise);
  });
}

export function customerRefund(row: RefundRecord) {
  return { id: row._id, bookingCode: row.bookingCode, status: row.status, reason: row.reason,
    currency: row.currency, requestedPaise: row.requestedPaise ?? null, approvedPaise: row.approvedPaise ?? null,
    type: row.type ?? null, requestedAt: row.requestedAt, approvedAt: row.approvedAt ?? null,
    rejectedAt: row.rejectedAt ?? null, processedAt: row.processedAt ?? null,
    rejectionReason: row.status === "rejected" ? row.adminReason ?? null : null };
}

export async function listRefunds(page: number, customerId?: string, pendingOnly = false) {
  const filter = { ...(customerId !== undefined && { customerId }), ...(pendingOnly && { status: "under_review" }) };
  const results = await Refund.find(filter).sort({ requestedAt: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE + 1).lean();
  const rows = results.slice(0, PAGE_SIZE);
  const pagination = { page, hasMore: results.length > PAGE_SIZE };
  if (customerId !== undefined) return { items: rows.map(customerRefund), ...pagination };

  const [bookings, balances] = await Promise.all([
    Booking.find({ _id: { $in: rows.map((row) => row.bookingId) } }).select(BOOKING_FIELDS).lean(),
    RefundBalance.find({ _id: { $in: rows.map((row) => row.razorpayPaymentId) } }).lean(),
  ]);
  const bookingById = new Map<string, CapturedBooking>(bookings.map((booking: CapturedBooking) => [String(booking._id), booking]));
  const balanceByPayment = new Map(balances.map((balance) => [balance._id, balance]));
  return { ...pagination, items: rows.map((row) => {
    const balance = balanceByPayment.get(row.razorpayPaymentId);
    const booking = bookingById.get(String(row.bookingId));
    const capture = booking && verifiedRefundCapture(booking);
    const balanceMatches = balance && String(balance.bookingId) === String(row.bookingId) && balance.customerId === row.customerId &&
      balance.capturedPaise === row.capturedPaise && balance.currency === row.currency;
    const availablePaise = balanceMatches ? balance.capturedPaise - balance.reservedPaise - balance.processedPaise : null;
    return {
      ...customerRefund(row), capturedPaise: row.capturedPaise, paymentId: row.razorpayPaymentId,
      bookingStatus: booking?.status ?? null, cancelledAt: booking?.cancelledAt ?? null, paidAt: booking?.paidAt ?? null,
      reservedPaise: balanceMatches ? balance.reservedPaise : null, processedPaise: balanceMatches ? balance.processedPaise : null,
      availablePaise, providerCheckStatus: balanceMatches ? balance.providerCheckStatus ?? null : null,
      providerIssue: balanceMatches ? balance.providerIssue ?? null : null,
      eligible: Boolean(row.status === "under_review" && booking?.userId === row.customerId && capture &&
        capture.razorpayPaymentId === row.razorpayPaymentId && capture.capturedPaise === row.capturedPaise &&
        balanceMatches && balance.activeRefundId === row._id && availablePaise !== null && availablePaise > 0),
      audit: row.audit.map(({ status, actorId, at, note }) => ({ status, actorId, at, note })),
    };
  }) };
}
