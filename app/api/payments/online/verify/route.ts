import { createHmac, timingSafeEqual } from "crypto";
import mongoose from "mongoose";
import { z } from "zod";

import { requireSession } from "@/lib/auth-utils";
import { errorResponse, successResponse } from "@/lib/api-utils";
import connectDB from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { getRazorpayClient, normalizeCurrency, toRazorpayMinorUnits } from "@/lib/razorpay";
import { escapeHtml } from "@/lib/sanitize";
import Booking from "@/models/Booking";

interface RazorpayPaymentSummary {
  id: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
  notes?: Record<string, string>;
}

const verifyPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay payment ID is required"),
  razorpay_order_id: z.string().min(1, "Razorpay order ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay signature is required"),
});

function getRazorpayKeySecret() {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error("Razorpay is not configured");
  }

  return keySecret;
}

function verifyRazorpaySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expectedSignature = createHmac("sha256", getRazorpayKeySecret())
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(params.signature, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

async function fetchRazorpayPayment(paymentId: string) {
  const client = getRazorpayClient();

  return client.payments.fetch(paymentId) as Promise<RazorpayPaymentSummary>;
}

function paymentMatchesBooking(params: {
  payment: RazorpayPaymentSummary;
  expectedOrderId: string;
  expectedAmount: number;
  expectedCurrency: string;
}) {
  return (
    params.payment.order_id === params.expectedOrderId &&
    params.payment.amount === toRazorpayMinorUnits(params.expectedAmount) &&
    normalizeCurrency(params.payment.currency) === normalizeCurrency(params.expectedCurrency) &&
    params.payment.status === "captured" &&
    params.payment.captured === true
  );
}

function paymentNotesMatchBooking(params: {
  payment: RazorpayPaymentSummary;
  booking: {
    _id: unknown;
    bookingId?: string;
    userId?: string;
  };
}) {
  const notes = params.payment.notes || {};

  return (
    notes.bookingMongoId === String(params.booking._id) &&
    notes.bookingId === String(params.booking.bookingId || "") &&
    notes.userId === String(params.booking.userId || "")
  );
}

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

  if (sessionResult.response) {
    return sessionResult.response;
  }

  const session = sessionResult.session;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || "Invalid request", 400);
    }

    const {
      bookingId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_order_id: razorpayOrderId,
      razorpay_signature: razorpaySignature,
    } = parsed.data;

    if (
      !verifyRazorpaySignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      })
    ) {
      return errorResponse("Invalid payment signature", 400);
    }

    await connectDB();

    const bookingFilter = mongoose.isValidObjectId(bookingId)
      ? { _id: bookingId }
      : { bookingId };

    const booking = await Booking.findOne(bookingFilter).lean();

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    if (booking.userId !== session.user.id) {
      return errorResponse("Forbidden", 403);
    }

    if (
      booking.paymentStatus === "paid" &&
      booking.paymentMethod === "online" &&
      booking.razorpayOrderId === razorpayOrderId &&
      booking.razorpayPaymentId === razorpayPaymentId
    ) {
      return successResponse({
        message: "Payment already verified",
        bookingId: booking.bookingId,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        razorpayOrderId: booking.razorpayOrderId,
        razorpayPaymentId: booking.razorpayPaymentId,
        paidAt: booking.paidAt ?? null,
      });
    }

    if (booking.paymentStatus === "paid") {
      return errorResponse("Booking payment is already completed", 409);
    }

    if (
      booking.status !== "confirmed" ||
      booking.paymentMethod !== "online" ||
      booking.paymentStatus !== "online_order_created"
    ) {
      return errorResponse("Booking is not eligible for payment verification", 409);
    }

    if (booking.razorpayOrderId !== razorpayOrderId) {
      return errorResponse("Payment order does not match booking", 409);
    }

    const paymentAmount = typeof booking.paymentAmount === "number" ? booking.paymentAmount : 0;

    if (paymentAmount <= 0) {
      return errorResponse("Invalid payment amount", 409);
    }

    let payment: RazorpayPaymentSummary;

    try {
      payment = await fetchRazorpayPayment(razorpayPaymentId);
    } catch (error) {
      console.error("Razorpay payment fetch error:", error);
      return errorResponse("Payment could not be verified with Razorpay", 502);
    }

    if (
      payment.id !== razorpayPaymentId ||
      !paymentMatchesBooking({
        payment,
        expectedOrderId: razorpayOrderId,
        expectedAmount: paymentAmount,
        expectedCurrency: booking.paymentCurrency || "INR",
      }) ||
      !paymentNotesMatchBooking({ payment, booking })
    ) {
      return errorResponse("Payment does not match booking", 409);
    }

    const paidAt = new Date();
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        userId: session.user.id,
        status: "confirmed",
        paymentMethod: "online",
        paymentStatus: "online_order_created",
        razorpayOrderId,
        $or: [
          { razorpayPaymentId: { $exists: false } },
          { razorpayPaymentId: "" },
          { razorpayPaymentId: null },
        ],
      },
      {
        $set: {
          paymentStatus: "paid",
          paymentMethod: "online",
          razorpayPaymentId,
          paidAt,
        },
      },
      { new: true }
    ).lean();

    if (!updatedBooking) {
      const latestBooking = await Booking.findById(booking._id).lean();

      if (
        latestBooking?.paymentStatus === "paid" &&
        latestBooking.paymentMethod === "online" &&
        latestBooking.razorpayOrderId === razorpayOrderId &&
        latestBooking.razorpayPaymentId === razorpayPaymentId
      ) {
        return successResponse({
          message: "Payment already verified",
          bookingId: latestBooking.bookingId,
          paymentStatus: latestBooking.paymentStatus,
          paymentMethod: latestBooking.paymentMethod,
          razorpayOrderId: latestBooking.razorpayOrderId,
          razorpayPaymentId: latestBooking.razorpayPaymentId,
          paidAt: latestBooking.paidAt ?? null,
        });
      }

      return errorResponse("Unable to complete payment verification", 409);
    }

    sendPaymentConfirmationEmail({
      email: updatedBooking.email,
      name: updatedBooking.name,
      bookingId: updatedBooking.bookingId,
      date: updatedBooking.date,
      time: updatedBooking.time,
      route: updatedBooking.route,
      price: updatedBooking.price,
      razorpayPaymentId: updatedBooking.razorpayPaymentId,
    });

    return successResponse({
      message: "Payment verified successfully",
      bookingId: updatedBooking.bookingId,
      paymentStatus: updatedBooking.paymentStatus,
      paymentMethod: updatedBooking.paymentMethod,
      razorpayOrderId: updatedBooking.razorpayOrderId,
      razorpayPaymentId: updatedBooking.razorpayPaymentId,
      paidAt: updatedBooking.paidAt ?? null,
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return errorResponse("Server Error", 500);
  }
}
