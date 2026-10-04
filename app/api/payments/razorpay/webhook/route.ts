import { createHmac, timingSafeEqual } from "crypto";

import { errorResponse, successResponse } from "@/lib/api-utils";
import connectDB from "@/lib/db";
import { normalizeCurrency, toRazorpayMinorUnits } from "@/lib/razorpay";
import Booking from "@/models/Booking";

interface RazorpayPaymentEntity {
  id: string;
  order_id?: string;
  amount: number;
  currency: string;
  status: string;
  captured?: boolean;
}

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
}

function getWebhookSecret() {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("Razorpay webhook is not configured");
  }

  return secret;
}

function verifyWebhookSignature(body: string, signature: string) {
  const expectedSignature = createHmac("sha256", getWebhookSecret())
    .update(body)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function paymentMatchesBooking(payment: RazorpayPaymentEntity, booking: {
  razorpayOrderId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
}) {
  const expectedAmount = typeof booking.paymentAmount === "number" ? booking.paymentAmount : 0;

  return (
    payment.order_id === booking.razorpayOrderId &&
    payment.amount === toRazorpayMinorUnits(expectedAmount) &&
    normalizeCurrency(payment.currency) === normalizeCurrency(booking.paymentCurrency || "INR")
  );
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return errorResponse("Missing Razorpay webhook signature", 400);
    }

    const rawBody = await req.text();

    if (!verifyWebhookSignature(rawBody, signature)) {
      return errorResponse("Invalid Razorpay webhook signature", 400);
    }

    const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const event = body.event;

    if (event !== "payment.captured" && event !== "payment.failed") {
      return successResponse({ message: "Webhook event ignored" });
    }

    const payment = body.payload?.payment?.entity;

    if (!payment?.id || !payment.order_id) {
      return errorResponse("Invalid Razorpay webhook payload", 400);
    }

    await connectDB();

    const booking = await Booking.findOne({
      razorpayOrderId: payment.order_id,
      paymentMethod: "online",
    }).lean();

    if (!booking) {
      return errorResponse("Booking not found for Razorpay order", 404);
    }

    if (!paymentMatchesBooking(payment, booking)) {
      return errorResponse("Razorpay payment does not match booking", 409);
    }

    if (event === "payment.captured") {
      if (payment.status !== "captured" || payment.captured !== true) {
        return errorResponse("Razorpay payment is not captured", 409);
      }

      if (
        booking.paymentStatus === "paid" &&
        booking.razorpayPaymentId === payment.id
      ) {
        return successResponse({ message: "Payment already marked paid" });
      }

      const updatedBooking = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          status: "confirmed",
          paymentMethod: "online",
          paymentStatus: "online_order_created",
          razorpayOrderId: payment.order_id,
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
            razorpayPaymentId: payment.id,
            paidAt: new Date(),
          },
        },
        { new: true }
      ).lean();

      if (!updatedBooking) {
        const latestBooking = await Booking.findById(booking._id).lean();

        if (
          latestBooking?.paymentStatus === "paid" &&
          latestBooking.razorpayPaymentId === payment.id
        ) {
          return successResponse({ message: "Payment already marked paid" });
        }

        return errorResponse("Unable to mark payment paid", 409);
      }

      return successResponse({ message: "Payment marked paid" });
    }

    if (
      booking.paymentStatus === "paid" ||
      booking.paymentStatus === "cash_collected"
    ) {
      return successResponse({ message: "Paid booking ignored" });
    }

    if (
      booking.paymentStatus === "failed" &&
      booking.razorpayPaymentId === payment.id
    ) {
      return successResponse({ message: "Payment already marked failed" });
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        status: "confirmed",
        paymentMethod: "online",
        paymentStatus: "online_order_created",
        razorpayOrderId: payment.order_id,
      },
      {
        $set: {
          paymentStatus: "failed",
          razorpayPaymentId: payment.id,
        },
      },
      { new: true }
    ).lean();

    if (!updatedBooking) {
      const latestBooking = await Booking.findById(booking._id).lean();

      if (
        latestBooking?.paymentStatus === "failed" &&
        latestBooking.razorpayPaymentId === payment.id
      ) {
        return successResponse({ message: "Payment already marked failed" });
      }

      return errorResponse("Unable to mark payment failed", 409);
    }

    return successResponse({ message: "Payment marked failed" });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return errorResponse("Server Error", 500);
  }
}
