import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendUserConfirmation } from "@/lib/sendWhatsApp";
import { sendConfirmationEmail } from "@/lib/mail";

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

    await connectDB();

    const booking = await Booking.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (updates.status === "confirmed") {
      await sendUserConfirmation(booking).catch(e => console.error("Could not send confirmation to user:", e));
      
      // ✅ Send Confirmation Email
      try {
        const user = await User.findById(booking.userId);
        if (user && user.email) {
          await sendConfirmationEmail({
            name: booking.name,
            bookingId: booking.bookingId,
            date: booking.date,
            time: booking.time,
            route: booking.route,
            price: booking.price,
            email: user.email,
          });
        }
      } catch (err) {
        console.error("Confirmation Email Error:", err);
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
