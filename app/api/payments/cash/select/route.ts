import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { errorResponse, successResponse } from "@/lib/api-utils";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";

const selectCashSchema = z
  .object({
    bookingId: z.string().min(1).optional(),
    id: z.string().min(1).optional(),
  })
  .refine((data) => Boolean(data.bookingId || data.id), {
    message: "Booking ID is required",
  });

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return errorResponse("Login Required", 401);
    }

    const body = await req.json().catch(() => ({}));
    const parsed = selectCashSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || "Invalid request", 400);
    }

    const bookingSelector = parsed.data.bookingId || parsed.data.id || "";

    await connectDB();

    const selectorQuery = mongoose.isValidObjectId(bookingSelector)
      ? { _id: bookingSelector }
      : { bookingId: bookingSelector };

    const booking = await Booking.findOneAndUpdate(
      {
        ...selectorQuery,
        userId: session.user.id,
        status: "confirmed",
        paymentStatus: "payment_pending",
        paymentMethod: "none",
      },
      {
        $set: {
          paymentMethod: "cash",
          paymentStatus: "cash_pending",
        },
      },
      {
        new: true,
      }
    );

    if (booking) {
      return successResponse({
        message: "Cash payment selected successfully",
        bookingId: booking.bookingId,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
      });
    }

    const existingBooking = await Booking.findOne({
      ...selectorQuery,
      userId: session.user.id,
    }).lean();

    if (!existingBooking) {
      return errorResponse("Booking not found", 404);
    }

    if (existingBooking.status !== "confirmed") {
      return errorResponse("Cash payment is only available after booking confirmation", 400);
    }

    if (existingBooking.paymentMethod === "cash" && existingBooking.paymentStatus === "cash_pending") {
      return successResponse({
        message: "Cash payment already selected",
        bookingId: existingBooking.bookingId,
        paymentMethod: existingBooking.paymentMethod,
        paymentStatus: existingBooking.paymentStatus,
      });
    }

    if (existingBooking.paymentStatus !== "payment_pending" || existingBooking.paymentMethod !== "none") {
      return errorResponse("Cash payment is not available for this booking", 400);
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: existingBooking._id,
        userId: session.user.id,
        status: "confirmed",
        paymentStatus: "payment_pending",
        paymentMethod: "none",
      },
      {
        $set: {
          paymentMethod: "cash",
          paymentStatus: "cash_pending",
        },
      },
      {
        new: true,
      }
    );

    if (updatedBooking) {
      return successResponse({
        message: "Cash payment selected successfully",
        bookingId: updatedBooking.bookingId,
        paymentMethod: updatedBooking.paymentMethod,
        paymentStatus: updatedBooking.paymentStatus,
      });
    }

    return errorResponse("Unable to select cash payment", 409);
  } catch (err) {
    console.error("Cash Payment Select Error:", err);
    return errorResponse("Server Error", 500);
  }
}