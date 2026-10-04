import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { z } from "zod";

import { requireSession } from "@/lib/auth-utils";
import { errorResponse, successResponse } from "@/lib/api-utils";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import {
  buildRazorpayReceipt,
  createRazorpayOrder,
  fetchRazorpayOrder,
  RazorpayOrderSummary,
} from "@/lib/razorpay";

const PENDING_ORDER_PREFIX = "__razorpay_pending__";
const FINALIZE_RETRY_COUNT = 3;
const RECOVERY_RETRY_COUNT = 3;

const createOrderSchema = z
  .object({
    bookingId: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.bookingId || data.id), {
    message: "Booking ID is required",
  });

function isPendingMarker(value?: string) {
  return Boolean(value && value.startsWith(PENDING_ORDER_PREFIX));
}

function buildPendingMarker() {
  return `${PENDING_ORDER_PREFIX}:${Date.now()}:${randomUUID()}`;
}

async function retryBookingUpdate<T>(
  attempt: () => Promise<T>,
  retries: number
) {
  let lastError: unknown;

  for (let index = 0; index < retries; index += 1) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function finalizeRazorpayBooking(params: {
  bookingId: mongoose.Types.ObjectId;
  userId: string;
  pendingMarker: string;
  orderId: string;
}) {
  return retryBookingUpdate(
    () =>
      Booking.findOneAndUpdate(
        {
          _id: params.bookingId,
          userId: params.userId,
          paymentMethod: "online",
          paymentStatus: "online_order_created",
          razorpayOrderId: params.pendingMarker,
        },
        {
          $set: {
            razorpayOrderId: params.orderId,
          },
        },
        { new: true }
      ).lean(),
    FINALIZE_RETRY_COUNT
  );
}

async function recoverRazorpayReservation(params: {
  bookingId: mongoose.Types.ObjectId;
  userId: string;
  pendingMarker: string;
}) {
  return retryBookingUpdate(
    () =>
      Booking.findOneAndUpdate(
        {
          _id: params.bookingId,
          userId: params.userId,
          paymentMethod: "online",
          paymentStatus: "online_order_created",
          razorpayOrderId: params.pendingMarker,
        },
        {
          $set: {
            paymentMethod: "none",
            paymentStatus: "payment_pending",
            razorpayOrderId: "",
          },
        }
      ),
    RECOVERY_RETRY_COUNT
  );
}

function asOrderResponse(order: RazorpayOrderSummary) {
  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt || null,
    status: order.status || null,
    attempts: order.attempts || 0,
    notes: order.notes || {},
    createdAt: order.created_at || null,
  };
}

export async function POST(req: Request) {
  const sessionResult = await requireSession();

  if (sessionResult.response) {
    return sessionResult.response;
  }

  const session = sessionResult.session;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || "Invalid request", 400);
    }

    const selector = parsed.data.bookingId || parsed.data.id || "";

    await connectDB();

    const bookingFilter = mongoose.isValidObjectId(selector)
      ? { _id: selector }
      : { bookingId: selector };

    const booking = await Booking.findOne(bookingFilter).lean();

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    if (booking.userId !== session.user.id) {
      return errorResponse("Forbidden", 403);
    }

    if (booking.status !== "confirmed") {
      return errorResponse("Order can only be created for confirmed bookings", 409);
    }

    if (booking.paymentStatus !== "payment_pending" || booking.paymentMethod !== "none") {
      if (
        booking.paymentMethod === "online" &&
        booking.paymentStatus === "online_order_created" &&
        booking.razorpayOrderId &&
        !isPendingMarker(booking.razorpayOrderId)
      ) {
        try {
          const existingOrder = await fetchRazorpayOrder(booking.razorpayOrderId);
          return successResponse({
            message: "Existing Razorpay order returned",
            bookingId: booking.bookingId,
            order: asOrderResponse(existingOrder),
          });
        } catch (error) {
          console.error("Razorpay fetch error:", error);
          return errorResponse("Existing Razorpay order could not be loaded", 409);
        }
      }

      if (
        booking.paymentMethod === "online" &&
        booking.paymentStatus === "online_order_created" &&
        isPendingMarker(booking.razorpayOrderId)
      ) {
        return errorResponse("Razorpay order creation is already in progress", 409);
      }

      return errorResponse("Booking is not eligible for online payment", 409);
    }

    const paymentAmount = typeof booking.paymentAmount === "number" ? booking.paymentAmount : 0;

    if (paymentAmount <= 0) {
      return errorResponse("Invalid payment amount", 409);
    }

    const currency = booking.paymentCurrency || "INR";
    const pendingMarker = buildPendingMarker();

    const reservedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        userId: session.user.id,
        status: "confirmed",
        paymentStatus: "payment_pending",
        paymentMethod: "none",
        $or: [
          { razorpayOrderId: { $exists: false } },
          { razorpayOrderId: "" },
          { razorpayOrderId: null },
        ],
      },
      {
        $set: {
          paymentMethod: "online",
          paymentStatus: "online_order_created",
          razorpayOrderId: pendingMarker,
        },
      },
      { new: true }
    ).lean();

    if (!reservedBooking) {
      const latestBooking = await Booking.findById(booking._id).lean();

      if (!latestBooking) {
        return errorResponse("Booking not found", 404);
      }

      if (latestBooking.userId !== session.user.id) {
        return errorResponse("Forbidden", 403);
      }

      if (
        latestBooking.paymentMethod === "online" &&
        latestBooking.paymentStatus === "online_order_created" &&
        latestBooking.razorpayOrderId &&
        !isPendingMarker(latestBooking.razorpayOrderId)
      ) {
        try {
          const existingOrder = await fetchRazorpayOrder(latestBooking.razorpayOrderId);
          return successResponse({
            message: "Existing Razorpay order returned",
            bookingId: latestBooking.bookingId,
            order: asOrderResponse(existingOrder),
          });
        } catch (error) {
          console.error("Razorpay fetch error:", error);
          return errorResponse("Existing Razorpay order could not be loaded", 409);
        }
      }

      if (
        latestBooking.paymentMethod === "online" &&
        latestBooking.paymentStatus === "online_order_created" &&
        isPendingMarker(latestBooking.razorpayOrderId)
      ) {
        return errorResponse("Razorpay order creation is already in progress", 409);
      }

      return errorResponse("Booking is not eligible for online payment", 409);
    }

    const receipt = buildRazorpayReceipt(String(reservedBooking.bookingId || reservedBooking._id));

    try {
      const order = await createRazorpayOrder({
        amount: paymentAmount,
        currency,
        receipt,
        notes: {
          bookingId: String(reservedBooking.bookingId),
          bookingMongoId: String(reservedBooking._id),
          userId: String(session.user.id),
        },
      });

      const finalizedBooking = await finalizeRazorpayBooking({
        bookingId: reservedBooking._id,
        userId: String(session.user.id),
        pendingMarker,
        orderId: order.id,
      });

      if (!finalizedBooking) {
        console.error("Failed to persist Razorpay order id after creation", {
          bookingId: reservedBooking.bookingId,
          orderId: order.id,
        });

        try {
          await recoverRazorpayReservation({
            bookingId: reservedBooking._id,
            userId: String(session.user.id),
            pendingMarker,
          });
        } catch (recoveryError) {
          console.error("Failed to recover Razorpay reservation after finalize failure", {
            bookingId: reservedBooking.bookingId,
            orderId: order.id,
            recoveryError,
          });
        }

        return errorResponse("Razorpay order created but could not be attached to booking", 500);
      }

      return successResponse({
        message: "Razorpay order created successfully",
        bookingId: finalizedBooking.bookingId,
        order: asOrderResponse(order),
      });
    } catch (error) {
      await recoverRazorpayReservation({
        bookingId: reservedBooking._id,
        userId: String(session.user.id),
        pendingMarker,
      }).catch((revertError) => {
        console.error("Failed to revert booking after Razorpay error:", {
          bookingId: reservedBooking.bookingId,
          orderId: null,
          revertError,
        });
      });

      console.error("Razorpay create order error:", error);
      return errorResponse("Failed to create Razorpay order", 502);
    }
  } catch (error) {
    console.error("Create Order Error:", error);
    return errorResponse("Server Error", 500);
  }
}