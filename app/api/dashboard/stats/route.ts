import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return errorResponse("Login Required", 401);
    }

    await connectDB();

    const userId = session.user.id;

    const [totalBookings, activeBookings, completedBookings, cancelledBookings] = await Promise.all([
      Booking.countDocuments({ userId }),
      Booking.countDocuments({ userId, status: { $in: ["pending", "confirmed"] } }),
      Booking.countDocuments({ userId, status: "confirmed" }),
      Booking.countDocuments({ userId, status: "cancelled" }),
    ]);

    return successResponse({
      totalTrips: totalBookings,
      activeBookings,
      completedTrips: completedBookings,
      cancelledTrips: cancelledBookings,
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    return errorResponse("Server Error", 500);
  }
}
