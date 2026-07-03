import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { successResponse, errorResponse } from "@/lib/api-utils";

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeBooking(booking: Record<string, unknown>) {
  const temples = Array.isArray(booking.temples) ? booking.temples : [];
  const selectedTemples = Array.isArray(booking.selectedTemples) ? booking.selectedTemples : [];
  const assignedDriver = getRecord(booking.assignedDriver);
  const driverName = getString(booking.driverName) || getString(assignedDriver?.name);
  const driverPhone = getString(booking.driverPhone) || getString(assignedDriver?.phone);
  const normalizedAssignedDriver = assignedDriver
    ? {
        ...assignedDriver,
        name: driverName || assignedDriver.name || "",
        phone: driverPhone || assignedDriver.phone || "",
      }
    : booking.assignedDriver != null
      ? booking.assignedDriver
      : driverName || driverPhone
        ? {
            name: driverName,
            phone: driverPhone,
          }
        : null;

  return {
    ...booking,
    bookingId: booking.bookingId ?? booking._id ?? null,
    status: booking.status ?? null,
    paymentMethod: booking.paymentMethod ?? "none",
    paymentStatus: booking.paymentStatus ?? "not_required",
    paymentAmount:
      typeof booking.paymentAmount === "number"
        ? booking.paymentAmount
        : Number(booking.price) || 0,
    paymentCurrency: booking.paymentCurrency ?? "INR",
    paymentDueAt: booking.paymentDueAt ?? null,
    paidAt: booking.paidAt ?? null,
    razorpayOrderId: booking.razorpayOrderId ?? "",
    razorpayPaymentId: booking.razorpayPaymentId ?? "",
    packageType: booking.packageType ?? null,
    packageName: booking.packageName ?? null,
    temples,
    selectedTemples,
    assignedDriver: normalizedAssignedDriver,
    driverName,
    driverPhone,
    notes: booking.notes ?? null,
    hotel: booking.hotel ?? null,
    createdAt: booking.createdAt ?? null,
    updatedAt: booking.updatedAt ?? null,
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

  return successResponse(bookings.map(normalizeBooking));
}
