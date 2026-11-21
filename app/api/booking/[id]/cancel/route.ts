import { appendBookingEvent, bookingEvent } from "@/lib/booking-notification-events";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { inactiveBookingUpdate } from "@/lib/booking-payments";
import { sendCancellationEmail } from "@/lib/mail";
import { sanitizeInput } from "@/lib/sanitize";

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
    const reason = sanitizeInput(body?.reason || "");

    await connectDB();

    const owner = await Booking.findOne({ _id: id, userId: session.user.id, status: { $in: ["pending", "confirmed"] } }).lean();
    const events = owner ? await bookingEvent(owner, "customer_cancelled") : [];
    const booking = owner ? await Booking.findOneAndUpdate(
      { _id: id, userId: session.user.id, status: { $in: ["pending", "confirmed"] } },
      appendBookingEvent(inactiveBookingUpdate({
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: reason || "Cancelled by user",
        cancelledBy: "user",
      }), events),
      { returnDocument: "after", updatePipeline: true }
    ) : null;

    if (!booking) {
      const current = await Booking.findById(id).select("status userId").lean();
      if (!current) return errorResponse("Booking not found", 404);
      if (current.userId !== session.user.id) return errorResponse("Unauthorized", 403);
      if (current.status === "cancelled") return errorResponse("Booking is already cancelled", 400);
      if (current.status === "rejected") return errorResponse("Cannot cancel a rejected booking", 400);
      return errorResponse("Booking is no longer eligible for cancellation", 409);
    }

    await sendCancellationEmail({
      name: booking.name,
      bookingId: booking.bookingId,
      date: booking.date,
      time: booking.time,
      route: booking.route,
      price: booking.price,
      cancelledBy: "Customer",
      reason: reason || "User requested cancellation",
      email: session.user.email || "",
    }).catch(e => console.error("Could not send cancellation email:", e));

    return successResponse({
      message: "Booking cancelled successfully",
      bookingId: booking.bookingId,
      paymentReviewRequired: booking.paymentReviewRequired === true,
    });

  } catch (err) {
    console.error("Cancellation Error:", err);
    return errorResponse("Server Error", 500);
  }
}
