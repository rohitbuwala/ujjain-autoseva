import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-utils";

// ✅ GET ALL BOOKINGS (ADMIN)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Only admin allowed
    if (!session || session.user.role !== "admin") {
      return errorResponse("Admin Access Required", 403);
    }

    await connectDB();

    const bookings = await Booking.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    return successResponse(bookings);

  } catch (err) {
    console.error("ADMIN BOOKINGS ERROR:", err);
    return errorResponse("Server error", 500);
  }
}
