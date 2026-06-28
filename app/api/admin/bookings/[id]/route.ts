import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  sendCancellationEmail,
  sendConfirmationEmail,
  sendRejectionEmail,
} from "@/lib/mail";

const ALLOWED_UPDATES = ["status", "driverName", "driverPhone", "adminNote"] as const;
const PAYMENT_DUE_HOURS = 24;
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function getBookingRecipientEmail(booking: {
  email?: string;
  userId: string;
  bookingId: string;
}) {
  if (booking.email?.trim()) {
    return booking.email.trim();
  }

  if (!mongoose.Types.ObjectId.isValid(booking.userId)) {
    console.warn(`No stored booking email for ${booking.bookingId}; skipping user lookup for non-ObjectId userId.`);
    return null;
  }

  const user = await User.findById(booking.userId).select("email").lean();
  return user?.email ?? null;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {

  try {

    // ✅ FIX: Await params
    const { id } = await context.params;

    const session = await getServerSession(authOptions);

    // Only admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const updates = await req.json();

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Payload required" },
        { status: 400 }
      );
    }

    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) =>
        ALLOWED_UPDATES.includes(key as (typeof ALLOWED_UPDATES)[number])
      )
    );

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid update fields provided" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingBooking = await Booking.findById(id).select("price paymentAmount");

    if (!existingBooking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const existingPaymentAmount =
      typeof existingBooking.paymentAmount === "number" && existingBooking.paymentAmount > 0
        ? existingBooking.paymentAmount
        : Number(existingBooking.price) || 0;

    const updateData =
      safeUpdates.status === "cancelled"
        ? {
            ...safeUpdates,
            cancelledAt: new Date(),
            cancelReason: "Cancelled by admin",
            cancelledBy: "admin",
          }
        : safeUpdates.status === "confirmed"
        ? {
            ...safeUpdates,
            paymentMethod: "none",
            paymentStatus: "payment_pending",
            paymentAmount: existingPaymentAmount,
            paymentCurrency: "INR",
            paymentDueAt: new Date(Date.now() + PAYMENT_DUE_HOURS * 60 * 60 * 1000),
          }
        : safeUpdates;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (safeUpdates.status === "confirmed") {
      const recipientEmail = await getBookingRecipientEmail(booking);

      if (recipientEmail) {
        await sendConfirmationEmail({
          name: booking.name,
          bookingId: booking.bookingId,
          date: booking.date,
          time: booking.time,
          route: booking.route,
          price: booking.price,
          email: recipientEmail,
          paymentStatus: booking.paymentStatus,
          dashboardUrl: `${APP_URL}/dashboard/booking`,
        }).catch(e => console.error("Could not send confirmation email to user:", e));
      }
    } else if (safeUpdates.status === "rejected") {
      const recipientEmail = await getBookingRecipientEmail(booking);

      if (recipientEmail) {
        await sendRejectionEmail({
          name: booking.name,
          bookingId: booking.bookingId,
          date: booking.date,
          time: booking.time,
          route: booking.route,
          price: booking.price,
          email: recipientEmail,
        }).catch(e => console.error("Could not send rejection email to user:", e));
      }
    } else if (safeUpdates.status === "cancelled") {
      const recipientEmail = await getBookingRecipientEmail(booking);

      if (recipientEmail) {
        await sendCancellationEmail({
          name: booking.name,
          bookingId: booking.bookingId,
          date: booking.date,
          time: booking.time,
          route: booking.route,
          price: booking.price,
          cancelledBy: "Admin",
          reason: booking.cancelReason || "Cancelled by admin",
          email: recipientEmail,
        }).catch(e => console.error("Could not send cancellation email to user:", e));
      }
    }

    return NextResponse.json(booking);

  } catch (err) {

    console.error("PATCH ERROR:", err);

    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
