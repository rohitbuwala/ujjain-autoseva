import { appendBookingEvent, bookingEvent, publicBooking } from "@/lib/booking-notification-events";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { inactiveBookingUpdate, RAZORPAY_ORDER_ID } from "@/lib/booking-payments";
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

function bookingNotFound() {
  return NextResponse.json({ error: "Booking not found" }, { status: 404 });
}

function bookingResponse(booking: mongoose.Document | Record<string, unknown>) {
  const data = booking instanceof mongoose.Document ? booking.toObject() : booking;
  const orderId = data.razorpayOrderId;
  if (typeof orderId === "string" && !RAZORPAY_ORDER_ID.test(orderId)) data.razorpayOrderId = "";
  return NextResponse.json(publicBooking(data));
}

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

async function approveBooking(id: string, details: Record<string, unknown>) {
  let current = await Booking.findById(id).lean();

  if (current?.status === "pending") {
    const paymentAmount =
      typeof current.paymentAmount === "number" && current.paymentAmount > 0
        ? current.paymentAmount
        : Number(current.price) || 0;

    const events = await bookingEvent(current, "confirmed");
    const approved = await Booking.findOneAndUpdate(
      {
        _id: id,
        userId: current.userId,
        status: "pending",
        // Null also matches missing fields on legacy bookings.
        paymentMethod: { $in: ["none", null] },
        paymentStatus: { $in: ["not_required", null] },
        paymentDueAt: null,
        paidAt: null,
        razorpayOrderId: { $in: ["", null] },
        razorpayPaymentId: { $in: ["", null] },
        price: current.price ?? null,
        paymentAmount: current.paymentAmount ?? null,
      },
      {
        $push: { notificationOutbox: { $each: events } },
        $set: {
          ...details,
          status: "confirmed",
          paymentMethod: "none",
          paymentStatus: "payment_pending",
          paymentAmount,
          paymentCurrency: "INR",
          paymentDueAt: new Date(Date.now() + PAYMENT_DUE_HOURS * 60 * 60 * 1000),
        },
      },
      { returnDocument: "after" }
    );

    if (approved) {
      try {
        const recipientEmail = await getBookingRecipientEmail(approved);
        if (recipientEmail) {
          await sendConfirmationEmail({
            name: approved.name,
            bookingId: approved.bookingId,
            date: approved.date,
            time: approved.time,
            route: approved.route,
            price: approved.price,
            email: recipientEmail,
            paymentStatus: approved.paymentStatus,
            dashboardUrl: `${APP_URL}/dashboard/booking`,
          });
        }
      } catch (error) {
        console.error("Could not send confirmation email to user:", error);
      }

      return bookingResponse(approved);
    }

    // A competing request may have confirmed or removed the booking.
    current = await Booking.findById(id).lean();
  }

  if (current?.status === "confirmed") {
    if (Object.keys(details).length === 0) return bookingResponse(current);

    // A combined request can edit details without running approval again.
    const updated = await Booking.findOneAndUpdate(
      { _id: id, status: "confirmed" },
      { $set: details },
      { returnDocument: "after" }
    );
    if (updated) return bookingResponse(updated);
    current = await Booking.findById(id).lean();
  }

  return current
    ? NextResponse.json({ error: "Booking is not eligible for approval" }, { status: 409 })
    : bookingNotFound();
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

    const { status, ...details } = safeUpdates;
    if (status !== undefined && status !== "pending" && status !== "confirmed"
        && status !== "rejected" && status !== "cancelled") {
      return NextResponse.json({ error: "Invalid booking status" }, { status: 400 });
    }
    if (Object.values(details).some((value) => typeof value !== "string" && value !== null)) {
      return NextResponse.json({ error: "Invalid booking details" }, { status: 400 });
    }

    await connectDB();
    if (status === "confirmed") {
      return await approveBooking(id, details);
    }

    const inactive = status === "cancelled" || status === "rejected";
    const filter = status === undefined ? { _id: id } : {
      _id: id,
      status: status === "cancelled" ? { $in: ["pending", "confirmed"] } : "pending",
    };
    const update = status === "cancelled" ? {
      ...safeUpdates,
      cancelledAt: new Date(),
      cancelReason: "Cancelled by admin",
      cancelledBy: "admin",
    } : safeUpdates;
    const owner = inactive ? await Booking.findById(id).lean() : null;
    if (inactive && !owner) return bookingNotFound();
    const events = owner ? await bookingEvent(owner, status === "rejected" ? "rejected" : "admin_cancelled") : [];
    const transitionFilter = owner ? { ...filter, userId: owner.userId } : filter;
    const booking = inactive
      ? await Booking.findOneAndUpdate(transitionFilter, appendBookingEvent(inactiveBookingUpdate(update), events), { returnDocument: "after", updatePipeline: true })
      : await Booking.findOneAndUpdate(filter, { $set: update }, { returnDocument: "after" });

    if (!booking) {
      const current = await Booking.findById(id).lean();
      if (!current) return bookingNotFound();
      if (inactive && current.status === status && Object.keys(details).length === 0) return bookingResponse(current);
      return NextResponse.json({ error: "Booking is not eligible for this update" }, { status: 409 });
    }

    if (status === "rejected") {
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
    } else if (status === "cancelled") {
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

    return bookingResponse(booking);

  } catch (err) {

    console.error("PATCH ERROR:", err);

    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
