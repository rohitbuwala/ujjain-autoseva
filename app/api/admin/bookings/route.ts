import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


// ✅ GET ALL BOOKINGS (ADMIN)
export async function GET() {
  try {

    const session = await getServerSession(authOptions);

    // Only admin allowed
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const bookings = await Booking.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(bookings);

  } catch (err) {
    console.error("ADMIN BOOKINGS ERROR:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
