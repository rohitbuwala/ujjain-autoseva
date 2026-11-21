import { createHmac, timingSafeEqual } from "crypto";
import type { Types } from "mongoose";
import { z } from "zod";

import Booking from "@/models/Booking";
import { buildRazorpayReceipt, toRazorpayMinorUnits, type RazorpayOrderSummary } from "@/lib/razorpay";

export const RAZORPAY_RESERVATION_PREFIX = "__razorpay_pending__:";
export const RAZORPAY_ORDER_ID = /^order_[A-Za-z0-9_]{1,64}$/;
export const RAZORPAY_PAYMENT_ID = /^pay_[A-Za-z0-9_]{1,64}$/;
export const RAZORPAY_SIGNATURE = /^[a-fA-F0-9]{64}$/;
export const OPEN_PAYMENT_STATES = ["online_order_created", "failed"];

const requiresPaymentReview = { $or: [
  { $eq: ["$paymentReviewRequired", true] },
  { $ne: ["$status", "confirmed"] },
] };

function reconciliationDueWhen(condition: object) {
  return { $cond: [
    { $and: [condition, { $ne: ["$reconciliationNeedsReview", true] }] },
    { $ifNull: ["$reconciliationNextAt", "$$NOW"] },
    { $ifNull: ["$reconciliationNextAt", "$$REMOVE"] },
  ] };
}

function leaseFilter(token?: string) {
  return token ? { reconciliationLeaseToken: token, reconciliationLeaseExpiresAt: { $gt: new Date() } } : {};
}

function leaseOptions(token?: string) {
  return token ? { maxTimeMS: 1_500 } : {};
}

export const razorpayPaymentSchema = z.object({
  id: z.string().regex(RAZORPAY_PAYMENT_ID),
  order_id: z.string().regex(RAZORPAY_ORDER_ID),
  amount: z.number().int().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.string(),
  captured: z.boolean(),
  created_at: z.number().int().positive().max(8_640_000_000_000).optional(),
});

type RazorpayPayment = z.infer<typeof razorpayPaymentSchema>;

export type PaymentBooking = {
  _id: Types.ObjectId;
  userId: string;
  bookingId: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentReviewRequired?: boolean;
};

export function matchesRazorpaySignature(body: string | Buffer, signature: string, secret: string | undefined) {
  if (!RAZORPAY_SIGNATURE.test(signature)) return false;
  if (!secret) throw new Error("Razorpay signature verification is not configured");
  return timingSafeEqual(createHmac("sha256", secret).update(body).digest(), Buffer.from(signature, "hex"));
}

export function bookingMinorUnits(booking: PaymentBooking) {
  // This integration charges INR. Other currencies may have different minor units.
  if (booking.paymentCurrency !== "INR" || typeof booking.paymentAmount !== "number") return null;
  const amount = toRazorpayMinorUnits(booking.paymentAmount);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

export function paymentMatchesBooking(payment: RazorpayPayment, booking: PaymentBooking) {
  return payment.order_id === booking.razorpayOrderId && payment.amount === bookingMinorUnits(booking)
    && payment.currency === booking.paymentCurrency;
}

export function orderMatchesBooking(order: RazorpayOrderSummary, booking: PaymentBooking) {
  return RAZORPAY_ORDER_ID.test(order.id) && order.amount === bookingMinorUnits(booking)
    && order.currency === booking.paymentCurrency;
}

export function reservedOrderMatchesBooking(order: RazorpayOrderSummary, booking: PaymentBooking) {
  return orderMatchesBooking(order, booking) && order.receipt === buildRazorpayReceipt(booking.bookingId)
    && order.notes?.bookingMongoId === String(booking._id) && order.notes?.bookingId === booking.bookingId
    && order.notes?.userId === booking.userId;
}

export async function linkReservedOrder(booking: PaymentBooking, order: RazorpayOrderSummary, leaseToken?: string) {
  if (!booking.razorpayOrderId?.startsWith(RAZORPAY_RESERVATION_PREFIX)
      || !reservedOrderMatchesBooking(order, booking)) return null;

  const filter = {
    ...leaseFilter(leaseToken),
    _id: booking._id,
    userId: booking.userId,
    paymentMethod: "online",
    paymentAmount: booking.paymentAmount,
    paymentCurrency: booking.paymentCurrency,
  };
  // An inactive booking still needs a durable association for late capture reconciliation.
  return await Booking.findOneAndUpdate(
    { ...filter, paymentStatus: { $in: OPEN_PAYMENT_STATES }, razorpayOrderId: booking.razorpayOrderId },
    { $set: { razorpayOrderId: order.id } },
    { returnDocument: "after", ...leaseOptions(leaseToken) }
  ).lean() ?? await Booking.findOne({ ...filter, razorpayOrderId: order.id }, null, leaseOptions(leaseToken)).lean();
}

export async function recordCapturedPayment(booking: PaymentBooking, payment: RazorpayPayment, leaseToken?: string) {
  if (!paymentMatchesBooking(payment, booking) || payment.status !== "captured" || !payment.captured) return null;

  const filter = {
    ...leaseFilter(leaseToken),
    _id: booking._id,
    userId: booking.userId,
    paymentMethod: "online",
    razorpayOrderId: payment.order_id,
    paymentAmount: booking.paymentAmount,
    paymentCurrency: booking.paymentCurrency,
  };
  const updated = await Booking.findOneAndUpdate(
    {
      ...filter,
      paymentStatus: { $in: OPEN_PAYMENT_STATES },
      $or: [
        { razorpayPaymentId: payment.id },
        { paidAt: null, razorpayPaymentId: { $in: ["", null] } },
        { paidAt: null, paymentStatus: "failed" },
      ],
    },
    [{ $set: {
      paymentStatus: "paid",
      razorpayPaymentId: { $literal: payment.id },
      paidAt: { $ifNull: ["$paidAt", "$$NOW"] },
      paymentReviewRequired: requiresPaymentReview,
      reconciliationNextAt: { $cond: [
        { $ne: [{ $ifNull: ["$reconciliationLeaseToken", null] }, null] }, "$reconciliationNextAt",
        { $cond: [requiresPaymentReview, reconciliationDueWhen(requiresPaymentReview), "$$REMOVE"] },
      ] },
      reconciliationNeedsReview: { $cond: [requiresPaymentReview, { $ifNull: ["$reconciliationNeedsReview", false] }, false] },
    } }],
    { returnDocument: "after", updatePipeline: true, ...leaseOptions(leaseToken) }
  ).lean();
  if (updated) return { booking: updated, recorded: true };

  const paidFilter = { ...filter, paymentStatus: "paid", razorpayPaymentId: payment.id };
  const existing = await Booking.findOneAndUpdate(
    { ...paidFilter, status: { $ne: "confirmed" }, paymentReviewRequired: { $ne: true } },
    [{ $set: { paymentReviewRequired: true, reconciliationNextAt: reconciliationDueWhen(requiresPaymentReview) } }],
    { returnDocument: "after", updatePipeline: true, ...leaseOptions(leaseToken) }
  ).lean() ?? await Booking.findOne(paidFilter, null, leaseOptions(leaseToken)).lean();
  return existing ? { booking: existing, recorded: false } : null;
}

export async function recordFailedAttempt(booking: PaymentBooking, payment: RazorpayPayment & { created_at: number }) {
  const attemptedAt = new Date(payment.created_at * 1_000);
  await Booking.updateOne({
    _id: booking._id,
    paymentMethod: "online",
    paymentStatus: { $in: OPEN_PAYMENT_STATES },
    paymentAmount: booking.paymentAmount,
    paymentCurrency: booking.paymentCurrency,
    razorpayOrderId: payment.order_id,
    $or: [
      { lastFailedPaymentAt: null },
      { lastFailedPaymentAt: { $lt: attemptedAt } },
      { lastFailedPaymentAt: attemptedAt, lastFailedPaymentId: { $lt: payment.id } },
    ],
  }, [{ $set: {
    lastFailedPaymentId: { $literal: payment.id },
    lastFailedPaymentAt: attemptedAt,
    reconciliationNextAt: reconciliationDueWhen({ $in: ["$paymentStatus", OPEN_PAYMENT_STATES] }),
  } }], { updatePipeline: true });
}

export function inactiveBookingUpdate(details: Record<string, unknown>) {
  return [{ $set: {
    ...Object.fromEntries(Object.entries(details).map(([field, value]) => [field, { $literal: value }])),
    paymentReviewRequired: { $or: [
      { $eq: ["$paymentReviewRequired", true] },
      { $and: [{ $eq: ["$paymentMethod", "online"] }, { $eq: ["$paymentStatus", "paid"] }] },
    ] },
    reconciliationNextAt: reconciliationDueWhen({ $and: [
      { $eq: ["$paymentMethod", "online"] },
      { $in: ["$paymentStatus", [...OPEN_PAYMENT_STATES, "paid"]] },
    ] }),
  } }];
}

export function verifiedBookingResponse(booking: PaymentBooking & { paidAt?: Date }, message: string) {
  return {
    message: booking.paymentReviewRequired ? "Payment recorded and flagged for review" : message,
    bookingId: booking.bookingId,
    paymentStatus: booking.paymentStatus,
    paymentMethod: booking.paymentMethod,
    razorpayOrderId: booking.razorpayOrderId,
    razorpayPaymentId: booking.razorpayPaymentId,
    paidAt: booking.paidAt ?? null,
    paymentReviewRequired: booking.paymentReviewRequired === true,
  };
}
