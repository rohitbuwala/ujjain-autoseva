import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { z } from "zod";

import { requireSession } from "@/lib/auth-utils";
import { errorResponse, successResponse } from "@/lib/api-utils";
import {
  bookingMinorUnits,
  linkReservedOrder,
  orderMatchesBooking,
  RAZORPAY_ORDER_ID,
  RAZORPAY_RESERVATION_PREFIX,
  razorpayPaymentSchema,
  recordCapturedPayment,
  verifiedBookingResponse,
  type PaymentBooking,
} from "@/lib/booking-payments";
import connectDB from "@/lib/db";
import {
  buildRazorpayReceipt,
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayOrderPayments,
  findRazorpayOrderByReceipt,
  type RazorpayOrderSummary,
} from "@/lib/razorpay";
import Booking from "@/models/Booking";

const createOrderSchema = z.object({
  bookingId: z.string().min(1).max(128).optional(),
  id: z.string().min(1).max(128).optional(),
}).refine((data) => Boolean(data.bookingId || data.id));

function reconciliationRequired() {
  return errorResponse("Payment status could not be confirmed. Check again before trying to pay.", 409);
}

async function checkoutResponse(booking: PaymentBooking, order: RazorpayOrderSummary) {
  if (order.id !== booking.razorpayOrderId || !orderMatchesBooking(order, booking)) {
    return reconciliationRequired();
  }

  if (order.status !== "created" || order.amount_paid !== 0) {
    const parsed = z.array(razorpayPaymentSchema).safeParse(await fetchRazorpayOrderPayments(order.id));
    if (!parsed.success || parsed.data.some((attempt) => attempt.order_id !== order.id)) {
      return reconciliationRequired();
    }
    const captures = parsed.data.filter((attempt) => attempt.captured && attempt.status === "captured");
    if (captures.length === 1) {
      const result = await recordCapturedPayment(booking, captures[0]);
      return result
        ? successResponse(verifiedBookingResponse(result.booking, "Payment already recorded"))
        : reconciliationRequired();
    }
    // An authorization, an incomplete provider response, or a paid order is unsafe to reopen.
    if (order.status !== "attempted" || order.amount_paid !== 0 || !parsed.data.length
        || parsed.data.some((attempt) => attempt.status !== "failed" || attempt.captured)) {
      return reconciliationRequired();
    }
  }

  const payable = await Booking.findOne({
    _id: booking._id,
    userId: booking.userId,
    status: "confirmed",
    paymentMethod: "online",
    paymentStatus: { $in: ["online_order_created", "failed"] },
    razorpayOrderId: order.id,
    paymentAmount: booking.paymentAmount,
    paymentCurrency: booking.paymentCurrency,
    paidAt: null,
  }).lean();
  if (!payable) return errorResponse("Booking is no longer eligible for checkout", 409);

  return successResponse({
    message: "Razorpay order ready",
    bookingId: booking.bookingId,
    order: { id: order.id, amount: order.amount, currency: order.currency },
  });
}

async function resolveOrder(booking: PaymentBooking, mayCreate: boolean) {
  if (booking.status !== "confirmed" || booking.paymentMethod !== "online") {
    return errorResponse("Booking is no longer eligible for checkout", 409);
  }
  if (booking.paymentStatus === "paid") {
    return successResponse(verifiedBookingResponse(booking, "Payment already recorded"));
  }
  if (booking.paymentStatus !== "online_order_created" && booking.paymentStatus !== "failed") {
    return errorResponse("Booking is not eligible for online payment", 409);
  }

  const storedId = booking.razorpayOrderId || "";
  if (RAZORPAY_ORDER_ID.test(storedId)) {
    return checkoutResponse(booking, await fetchRazorpayOrder(storedId));
  }
  if (!storedId.startsWith(RAZORPAY_RESERVATION_PREFIX)) return reconciliationRequired();

  if (!mayCreate) {
    await Booking.updateOne({
      _id: booking._id,
      razorpayOrderId: storedId,
      reconciliationNextAt: null,
      reconciliationNeedsReview: { $ne: true },
    }, { $set: { reconciliationNextAt: new Date() } }).catch(() => {
      console.error("Could not schedule payment reservation recovery");
    });
  }

  const receipt = buildRazorpayReceipt(booking.bookingId);
  let order = await findRazorpayOrderByReceipt(receipt);
  if (!order) {
    // An existing reservation may represent a provider request with an unknown outcome.
    if (!mayCreate) return reconciliationRequired();

    const active = await Booking.findOne({
      _id: booking._id,
      userId: booking.userId,
      status: "confirmed",
      paymentStatus: "online_order_created",
      paymentMethod: "online",
      razorpayOrderId: storedId,
      paymentAmount: booking.paymentAmount,
      paymentCurrency: booking.paymentCurrency,
    }).lean();
    if (!active) return errorResponse("Booking is no longer eligible for checkout", 409);

    order = await createRazorpayOrder({
      amount: active.paymentAmount,
      currency: active.paymentCurrency,
      receipt,
      notes: { bookingId: booking.bookingId, bookingMongoId: String(booking._id), userId: booking.userId },
    });
  }

  // Keep the order associated even if a concurrent cancellation won before this write.
  const linked = await linkReservedOrder(booking, order);
  if (!linked) return reconciliationRequired();
  if (linked.status !== "confirmed") return errorResponse("Booking is no longer eligible for checkout", 409);
  if (linked.paymentStatus === "paid") {
    return successResponse(verifiedBookingResponse(linked, "Payment already recorded"));
  }
  return checkoutResponse(linked, order);
}

export async function POST(req: Request) {
  const sessionResult = await requireSession();
  if (sessionResult.response) return sessionResult.response;

  try {
    const parsed = createOrderSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorResponse("Booking ID is required", 400);

    const id = parsed.data.bookingId || parsed.data.id;
    await connectDB();
    const selector = mongoose.isObjectIdOrHexString(id) ? { _id: id } : { bookingId: id };
    const booking = await Booking.findOne(selector).lean();
    if (!booking) return errorResponse("Booking not found", 404);
    if (booking.userId !== sessionResult.session.user.id) return errorResponse("Forbidden", 403);
    if (booking.status !== "confirmed") return errorResponse("Only confirmed bookings can be paid online", 409);
    if (bookingMinorUnits(booking) === null) return errorResponse("Invalid booking amount or currency", 409);
    if (booking.paymentMethod === "online") return await resolveOrder(booking, false);

    const filter = { _id: booking._id, userId: booking.userId };
    const reserved = await Booking.findOneAndUpdate(
      {
        ...filter,
        status: "confirmed",
        paymentStatus: "payment_pending",
        paymentMethod: "none",
        paymentAmount: booking.paymentAmount,
        paymentCurrency: booking.paymentCurrency,
        paymentDueAt: booking.paymentDueAt ?? null,
        paidAt: null,
        razorpayOrderId: { $in: ["", null] },
        razorpayPaymentId: { $in: ["", null] },
      },
      { $set: {
        paymentMethod: "online",
        paymentStatus: "online_order_created",
        razorpayOrderId: `${RAZORPAY_RESERVATION_PREFIX}${Date.now()}:${randomUUID()}`,
        reconciliationNextAt: new Date(Date.now() + 60_000),
      } },
      { returnDocument: "after" }
    ).lean();
    if (reserved) return await resolveOrder(reserved, true);

    const latest = await Booking.findOne(filter).lean();
    return latest ? await resolveOrder(latest, false) : errorResponse("Booking not found", 404);
  } catch {
    console.error("Razorpay checkout preparation failed");
    return errorResponse("Could not confirm checkout status. Please check again before paying.", 502);
  }
}
