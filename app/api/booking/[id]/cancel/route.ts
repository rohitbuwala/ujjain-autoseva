import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { sendCancellationEmail } from "@/lib/mail";
import { sendCancellationWhatsApp } from "@/lib/sendWhatsApp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return errorResponse("Login Required", 401);
    }

    const body = await req.json();
    const { reason } = body;

    await connectDB();

    const booking = await Booking.findById(id);

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    if (booking.userId !== session.user.id) {
      return errorResponse("Unauthorized", 403);
    }

    if (booking.status === "cancelled") {
      return errorResponse("Booking is already cancelled", 400);
    }

    if (booking.status === "rejected") {
      return errorResponse("Cannot cancel a rejected booking", 400);
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancelReason = reason || "Cancelled by user";
    booking.cancelledBy = "user";

    await booking.save();

    sendCancellationEmail({
      name: booking.name,
      bookingId: booking.bookingId,
      date: booking.date,
      time: booking.time,
      route: booking.route,
      price: booking.price,
      reason: reason || "User requested cancellation",
      email: session.user.email || "",
    }).catch(e => console.error("Could not send cancellation email:", e));

    sendCancellationWhatsApp({
      bookingId: booking.bookingId,
      name: booking.name,
      phone: booking.phone,
      route: booking.route,
      date: booking.date,
      time: booking.time,
    }).catch(e => console.error("Could not send cancellation WhatsApp:", e));

    return successResponse({
      message: "Booking cancelled successfully",
      bookingId: booking.bookingId,
    });

  } catch (err) {
    console.error("Cancellation Error:", err);
    return errorResponse("Server Error", 500);
  }
}
