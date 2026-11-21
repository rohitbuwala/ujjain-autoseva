import mongoose from "mongoose";
import { z } from "zod";

import { requireSession } from "@/lib/auth-utils";
import { errorResponse, successResponse } from "@/lib/api-utils";
import {
  matchesRazorpaySignature,
  RAZORPAY_ORDER_ID,
  RAZORPAY_PAYMENT_ID,
  RAZORPAY_SIGNATURE,
  razorpayPaymentSchema,
  recordCapturedPayment,
  verifiedBookingResponse,
} from "@/lib/booking-payments";
import connectDB from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { getRazorpayClient } from "@/lib/razorpay";
import { escapeHtml } from "@/lib/sanitize";
import Booking from "@/models/Booking";

const verifyPaymentSchema = z.object({
  bookingId: z.string().min(1).max(128),
  razorpay_payment_id: z.string().regex(RAZORPAY_PAYMENT_ID),
  razorpay_order_id: z.string().regex(RAZORPAY_ORDER_ID),
  razorpay_signature: z.string().regex(RAZORPAY_SIGNATURE),
});

function sendPaymentConfirmationEmail(booking: {
  email?: string;
  name?: string;
  bookingId?: string;
  date?: string;
  time?: string;
  route?: string;
  price?: string;
  razorpayPaymentId?: string;
}) {
  if (!booking.email) {
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #28a745; text-align: center;">Payment Confirmed</h2>
      <p>Hello <b>${escapeHtml(booking.name || "Customer")}</b>,</p>
      <p>Your online payment for <b>Ujjain AutoSeva</b> has been verified successfully.</p>
      <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c6f6d5; border-left: 4px solid #28a745;">
        <p style="margin: 6px 0;"><b>Booking ID:</b> ${escapeHtml(booking.bookingId || "")}</p>
        <p style="margin: 6px 0;"><b>Payment ID:</b> ${escapeHtml(booking.razorpayPaymentId || "")}</p>
        <p style="margin: 6px 0;"><b>Booking Date:</b> ${escapeHtml(booking.date || "")}</p>
        <p style="margin: 6px 0;"><b>Booking Time:</b> ${escapeHtml(booking.time || "")}</p>
        <p style="margin: 6px 0;"><b>Route:</b> ${escapeHtml(booking.route || "")}</p>
        <p style="margin: 6px 0;"><b>Fare:</b> Rs. ${escapeHtml(booking.price || "")}</p>
        <p style="margin: 6px 0;"><b>Payment Status:</b> Paid</p>
      </div>
      <p>Thank you for choosing Ujjain AutoSeva.</p>
    </div>
  `;

  sendMail(booking.email, html).catch((error) => {
    console.error("Could not send payment confirmation email:", error);
  });
}

export async function POST(req: Request) {
  const sessionResult = await requireSession();
  if (sessionResult.response) return sessionResult.response;

  try {
    const parsed = verifyPaymentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return errorResponse("Invalid payment verification request", 400);

    const { bookingId, razorpay_payment_id: paymentId, razorpay_order_id: orderId, razorpay_signature: signature } = parsed.data;

    await connectDB();
    const selector = mongoose.isObjectIdOrHexString(bookingId) ? { _id: bookingId } : { bookingId };
    const booking = await Booking.findOne(selector).lean();
    if (!booking) return errorResponse("Booking not found", 404);
    if (booking.userId !== sessionResult.session.user.id) return errorResponse("Forbidden", 403);
    if (booking.paymentMethod !== "online" || booking.razorpayOrderId !== orderId) {
      return errorResponse("Payment order does not match booking", 409);
    }
    if (!matchesRazorpaySignature(`${booking.razorpayOrderId}|${paymentId}`, signature, process.env.RAZORPAY_KEY_SECRET)) {
      return errorResponse("Invalid payment signature", 400);
    }

    if (booking.paymentStatus === "paid" && booking.razorpayPaymentId === paymentId
        && (booking.status === "confirmed" || booking.paymentReviewRequired)) {
      return successResponse(verifiedBookingResponse(booking, "Payment already verified"));
    }

    let response: unknown;
    try {
      response = await getRazorpayClient().payments.fetch(paymentId);
    } catch {
      return errorResponse("Payment could not be verified with Razorpay", 502);
    }

    const payment = razorpayPaymentSchema.safeParse(response);
    if (!payment.success || payment.data.id !== paymentId) {
      return errorResponse("Payment does not match booking", 409);
    }

    const result = await recordCapturedPayment(booking, payment.data);
    if (!result) return errorResponse("Payment could not be recorded for this booking", 409);
    const updated = result.booking;

    if (result.recorded && !updated.paymentReviewRequired) sendPaymentConfirmationEmail(updated);
    return successResponse(verifiedBookingResponse(updated, "Payment verified successfully"));
  } catch {
    console.error("Payment verification failed");
    return errorResponse("Server Error", 500);
  }
}
