import { randomUUID } from "crypto";
import { z } from "zod";

import {
  linkReservedOrder,
  OPEN_PAYMENT_STATES,
  paymentMatchesBooking,
  RAZORPAY_ORDER_ID,
  RAZORPAY_RESERVATION_PREFIX,
  razorpayPaymentSchema,
  recordCapturedPayment,
  reservedOrderMatchesBooking,
  type PaymentBooking,
} from "@/lib/booking-payments";
import {
  buildRazorpayReceipt,
  fetchRazorpayOrder,
  fetchRazorpayOrderPayments,
  findRazorpayOrderByReceipt,
  RazorpayReadError,
} from "@/lib/razorpay";
import Booking from "@/models/Booking";

const BATCH_LIMIT = 10;
const LEASE_MS = 60_000;
const LOOKUP_MS = 6_000;
const DB_TIME_MS = 1_500;
const MAX_ATTEMPTS = 8;
const FIRST_RETRY_MS = 60_000;
const MAX_RETRY_MS = 30 * 60_000;

type ClaimedBooking = PaymentBooking & { reconciliationAttempts: number; reconciliationLeaseToken: string };
type ErrorCategory = "missing_order" | "ambiguous_order" | "association_mismatch" | "invalid_payments"
  | "unsettled_payment" | "capture_conflict" | "provider_timeout" | "provider_unavailable" | "provider_access"
  | "storage_unavailable" | "attempt_limit";
type Outcome = {
  booking: PaymentBooking;
  result: "captured" | "settled" | "retry" | "operator_review";
  error?: ErrorCategory;
};

async function claimDueBooking(): Promise<ClaimedBooking | null> {
  const now = new Date();
  const filter = {
    paymentMethod: "online",
    reconciliationNeedsReview: { $ne: true },
    $or: [{ reconciliationLeaseExpiresAt: null }, { reconciliationLeaseExpiresAt: { $lte: now } }],
    paymentStatus: { $in: [...OPEN_PAYMENT_STATES, "paid"] },
  };
  const lease = { reconciliationLeaseToken: randomUUID(), reconciliationLeaseExpiresAt: new Date(+now + LEASE_MS) };
  const projection = "_id bookingId userId status paymentMethod paymentStatus paymentAmount paymentCurrency razorpayOrderId paymentReviewRequired +reconciliationAttempts +reconciliationLeaseToken";
  const options = { returnDocument: "after" as const, maxTimeMS: DB_TIME_MS };
  const due = await Booking.findOneAndUpdate(
    { ...filter, reconciliationNextAt: { $type: "date", $lte: now } },
    { $set: lease, $inc: { reconciliationAttempts: 1 } },
    { ...options, sort: { reconciliationNextAt: 1, _id: 1 } }
  ).select(projection).lean();
  if (due) return due;

  // Older unresolved bookings may predate the schedule fields.
  return Booking.findOneAndUpdate(
    { ...filter, reconciliationNextAt: null, reconciliationLastResult: null, $and: [{
      $or: [
        { paymentStatus: { $in: OPEN_PAYMENT_STATES } },
        { paymentStatus: "paid", status: { $in: ["cancelled", "rejected"] } },
      ],
    }] },
    { $set: { ...lease, reconciliationNextAt: now }, $inc: { reconciliationAttempts: 1 } },
    options
  ).select(projection).lean();
}

async function reconcile(claim: ClaimedBooking, signal: AbortSignal): Promise<Outcome> {
  let booking: PaymentBooking = claim;
  const retry = (error: ErrorCategory): Outcome => ({ booking, result: "retry", error });
  const review = (error: ErrorCategory): Outcome => ({ booking, result: "operator_review", error });

  if (booking.paymentStatus === "paid" && booking.status === "confirmed" && !booking.paymentReviewRequired) {
    return { booking, result: "settled" };
  }
  if (claim.reconciliationAttempts > MAX_ATTEMPTS) return review("attempt_limit");

  let failureCategory: ErrorCategory = "provider_unavailable";
  try {
    const orderId = booking.razorpayOrderId ?? "";
    const reserved = orderId.startsWith(RAZORPAY_RESERVATION_PREFIX);
    if (!reserved && !RAZORPAY_ORDER_ID.test(orderId)) return retry("missing_order");

    const order = reserved
      ? await findRazorpayOrderByReceipt(buildRazorpayReceipt(booking.bookingId), signal)
      : await fetchRazorpayOrder(orderId, signal);
    if (!order) return retry("missing_order");
    if ((!reserved && order.id !== orderId) || !reservedOrderMatchesBooking(order, booking)) {
      return review("association_mismatch");
    }

    signal.throwIfAborted();
    if (reserved) {
      failureCategory = "storage_unavailable";
      const linked = await linkReservedOrder(booking, order, claim.reconciliationLeaseToken);
      if (!linked) return retry("capture_conflict");
      booking = linked;
      failureCategory = "provider_unavailable";
    }

    const parsed = z.array(razorpayPaymentSchema).safeParse(await fetchRazorpayOrderPayments(order.id, signal));
    if (!parsed.success || parsed.data.some((payment) => !paymentMatchesBooking(payment, booking))) {
      return review("invalid_payments");
    }
    const captures = parsed.data.filter((payment) => payment.captured && payment.status === "captured");
    if (captures.length > 1) return review("capture_conflict");
    if (captures.length === 0) return retry("unsettled_payment");

    signal.throwIfAborted();
    failureCategory = "storage_unavailable";
    const result = await recordCapturedPayment(booking, captures[0], claim.reconciliationLeaseToken);
    if (!result) return retry("capture_conflict");
    booking = result.booking;
    return { booking, result: booking.paymentReviewRequired ? "operator_review" : "captured" };
  } catch (error) {
    if (signal.aborted) return retry("provider_timeout");
    if (error instanceof RazorpayReadError) {
      return error.category === "ambiguous_order" || error.category === "provider_access"
        ? review(error.category) : retry(error.category);
    }
    return retry(failureCategory);
  }
}

async function finishClaim(claim: ClaimedBooking, outcome: Outcome) {
  const now = new Date();
  const lease = {
    _id: claim._id,
    reconciliationLeaseToken: claim.reconciliationLeaseToken,
    reconciliationLeaseExpiresAt: { $gt: now },
  };
  const unchanged = {
    ...lease,
    status: outcome.booking.status,
    paymentStatus: outcome.booking.paymentStatus ?? null,
    paymentMethod: outcome.booking.paymentMethod ?? null,
    razorpayOrderId: outcome.booking.razorpayOrderId ?? null,
    paymentAmount: outcome.booking.paymentAmount ?? null,
    paymentCurrency: outcome.booking.paymentCurrency ?? null,
  };
  const result = outcome.result === "retry" && claim.reconciliationAttempts >= MAX_ATTEMPTS
    ? "operator_review" : outcome.result;
  const $set: Record<string, unknown> = {
    reconciliationLastResult: result,
    reconciliationNeedsReview: result === "operator_review",
  };
  const $unset: Record<string, 1> = { reconciliationLeaseToken: 1, reconciliationLeaseExpiresAt: 1 };
  if (outcome.error) $set.reconciliationLastError = outcome.error;
  else $unset.reconciliationLastError = 1;

  if (result === "retry") {
    const delay = Math.min(MAX_RETRY_MS, FIRST_RETRY_MS * 2 ** (claim.reconciliationAttempts - 1));
    $set.reconciliationNextAt = new Date(+now + delay);
  } else {
    $unset.reconciliationNextAt = 1;
  }

  const saved = await Booking.updateOne(unchanged, { $set, $unset }, { maxTimeMS: DB_TIME_MS });
  if (saved.matchedCount === 0) {
    // A callback or cancellation changed the state since the worker's observation.
    await Booking.updateOne(lease, {
      $set: { reconciliationNextAt: now },
      $unset: { reconciliationLeaseToken: 1, reconciliationLeaseExpiresAt: 1 },
    }, { maxTimeMS: DB_TIME_MS });
    return "changed" as const;
  }
  console.info("Payment reconciliation outcome", {
    bookingId: claim.bookingId,
    attempt: claim.reconciliationAttempts,
    result,
    category: outcome.error,
  });
  return result;
}

export async function runPaymentReconciliation(deadline = Date.now() + 18_000) {
  const end = Math.min(deadline, Date.now() + 18_000);
  const summary = { claimed: 0, captured: 0, settled: 0, retry: 0, operator_review: 0, changed: 0 };
  while (summary.claimed < BATCH_LIMIT && end - Date.now() > 2 * DB_TIME_MS) {
    const claim = await claimDueBooking();
    if (!claim) break;
    summary.claimed++;
    const signal = AbortSignal.timeout(Math.max(1, Math.min(LOOKUP_MS, end - Date.now() - DB_TIME_MS)));
    const outcome = await reconcile(claim, signal);
    summary[await finishClaim(claim, outcome)]++;
  }
  return summary;
}
