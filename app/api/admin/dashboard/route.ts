import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return errorResponse("Admin Access Required", 403);
    }

    await connectDB();

    const [services, bookings, users, recentBookings] = await Promise.all([
      Service.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments(),
      Booking.find().sort({ createdAt: -1 }).limit(5),
    ]);

    return successResponse({
      services,
      bookings,
      users,
      recentBookings,
    });
  } catch (err) {
    console.error(err);
    return errorResponse("Dashboard load failed", 500);
  }
}
