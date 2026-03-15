import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import CustomBooking from "@/models/CustomBooking";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const bookings = await CustomBooking.find()
      .populate("temples._id", "name price")
      .sort({ createdAt: -1 });

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
