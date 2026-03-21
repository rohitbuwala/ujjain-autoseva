import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return errorResponse("Unauthorized", 401);
  }

  await connectDB();

  const bookings = await Booking.find({
    userId: session.user.id,
  }).sort({ createdAt: -1 });

  return successResponse(bookings);
}
