import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-utils";

function withPaymentDefaults(booking: Record<string, unknown>) {
  return {
    ...booking,
    paymentMethod: booking.paymentMethod || "none",
    paymentStatus: booking.paymentStatus || "not_required",
    paymentAmount:
      typeof booking.paymentAmount === "number"
        ? booking.paymentAmount
        : Number(booking.price) || 0,
    paymentCurrency: booking.paymentCurrency || "INR",
    paymentDueAt: booking.paymentDueAt || null,
    paidAt: booking.paidAt || null,
    razorpayOrderId: booking.razorpayOrderId || "",
    razorpayPaymentId: booking.razorpayPaymentId || "",
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return errorResponse("Unauthorized", 401);
  }

  await connectDB();

  const bookings = await Booking.find({
    userId: session.user.id,
  })
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(bookings.map(withPaymentDefaults));
}
