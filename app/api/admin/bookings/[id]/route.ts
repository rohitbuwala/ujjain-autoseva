import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendConfirmationEmail } from "@/lib/mail";

const ALLOWED_UPDATES = ["status", "driverName", "driverPhone", "adminNote"] as const;

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

    const booking = await Booking.findByIdAndUpdate(
      id,
      { $set: safeUpdates },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (safeUpdates.status === "confirmed") {
      const user = await User.findById(booking.userId).select("email");

      if (user?.email) {
        await sendConfirmationEmail({
          name: booking.name,
          bookingId: booking.bookingId,
          date: booking.date,
          time: booking.time,
          route: booking.route,
          price: booking.price,
          email: user.email,
        }).catch(e => console.error("Could not send confirmation email to user:", e));
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
