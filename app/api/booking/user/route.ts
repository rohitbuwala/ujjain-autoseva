import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { getServerSession } from "next-auth";

export async function GET() {
  await connectDB();

  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json([], { status: 401 });
  }

  const bookings = await Booking.find({
    userId: session.user.email,
  });

  return NextResponse.json({ bookings });
}
