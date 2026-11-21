import mongoose from "mongoose";
import { z } from "zod";

import { errorResponse, successResponse } from "@/lib/api-utils";
import {
  linkReservedOrder,
  matchesRazorpaySignature,
  paymentMatchesBooking,
  RAZORPAY_RESERVATION_PREFIX,
  razorpayPaymentSchema,
  recordCapturedPayment,
  recordFailedAttempt,
  reservedOrderMatchesBooking,
} from "@/lib/booking-payments";
import connectDB from "@/lib/db";
import { fetchRazorpayOrder } from "@/lib/razorpay";
import { enqueueRefundWebhook, isRefundWebhookEvent, parseRefundWebhook } from "@/lib/refund-webhook-inbox";
import { RefundError } from "@/lib/refunds";
import Booking from "@/models/Booking";

const webhookSchema = z.object({ event: z.string().min(1), payload: z.unknown() });
const paymentPayloadSchema = z.object({ payment: z.object({ entity: razorpayPaymentSchema }) });

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) return errorResponse("Missing Razorpay webhook signature", 400);

    const rawBody = Buffer.from(await req.arrayBuffer());
    if (!matchesRazorpaySignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET)) {
      return errorResponse("Invalid Razorpay webhook signature", 400);
    }

    let json: unknown;
    try {
      json = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return errorResponse("Invalid Razorpay webhook payload", 400);
    }
    const envelope = webhookSchema.safeParse(json);
    if (!envelope.success) return errorResponse("Invalid Razorpay webhook payload", 400);

    const { event, payload } = envelope.data;
    if (isRefundWebhookEvent(event)) {
      const record = parseRefundWebhook(json, req.headers.get("x-razorpay-event-id"), rawBody);
      await connectDB();
      await enqueueRefundWebhook(record);
      return successResponse({ message: "Refund webhook recorded" });
    }
    if (event !== "payment.captured" && event !== "payment.failed") {
      return successResponse({ message: "Webhook event ignored" });
    }

    const parsed = paymentPayloadSchema.safeParse(payload);
    if (!parsed.success) return errorResponse("Invalid Razorpay payment payload", 400);
    const payment = parsed.data.payment.entity;
    if (event === "payment.captured" && (payment.status !== "captured" || !payment.captured)) {
      return errorResponse("Invalid Razorpay capture payload", 400);
    }
    if (event === "payment.failed" && (payment.status !== "failed" || payment.captured || !payment.created_at)) {
      return errorResponse("Invalid Razorpay failure payload", 400);
    }

    await connectDB();
    let booking = await Booking.findOne({ razorpayOrderId: payment.order_id, paymentMethod: "online" }).lean();
    if (!booking) {
      // A webhook can arrive before the order creation request attaches the order ID.
      const order = await fetchRazorpayOrder(payment.order_id);
      const bookingId = order.notes?.bookingMongoId;
      if (order.id === payment.order_id && mongoose.isObjectIdOrHexString(bookingId)) {
        const reserved = await Booking.findById(bookingId).lean();
        if (reserved?.razorpayOrderId?.startsWith(RAZORPAY_RESERVATION_PREFIX)
            && reservedOrderMatchesBooking(order, reserved)
            && payment.amount === order.amount && payment.currency === order.currency) {
          booking = await linkReservedOrder(reserved, order);
        }
      }
    }
    if (!booking) return errorResponse("Booking not found for Razorpay order", 404);
    if (!paymentMatchesBooking(payment, booking)) return errorResponse("Payment does not match booking", 409);

    if (event === "payment.failed") {
      if (payment.created_at !== undefined) await recordFailedAttempt(booking, { ...payment, created_at: payment.created_at });
      return successResponse({ message: "Payment attempt handled" });
    }

    const result = await recordCapturedPayment(booking, payment);
    if (!result) return errorResponse("Unable to record captured payment", 409);
    return successResponse({ message: result.recorded ? "Payment recorded" : "Payment already recorded" });
  } catch (error) {
    if (error instanceof RefundError) return errorResponse(error.message, error.status);
    console.error("Razorpay webhook processing failed");
    return errorResponse("Server Error", 500);
  }
}
