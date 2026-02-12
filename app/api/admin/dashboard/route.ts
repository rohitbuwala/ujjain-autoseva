import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import User from "@/models/User";


export async function GET() {

  try {

    await connectDB();

    const [services, bookings, users, recentBookings] = await Promise.all([
      Service.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments(),
      Booking.find().sort({ createdAt: -1 }).limit(5),
    ]);

    return NextResponse.json({
      services,
      bookings,
      users,
      recentBookings,
    });

  } catch (err) {

    console.error(err);

    return NextResponse.json(
      { error: "Dashboard load failed" },
      { status: 500 }
    );
  }
}
