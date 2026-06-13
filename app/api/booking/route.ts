import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";

import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import Service from "@/models/Service";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { successResponse, errorResponse } from "@/lib/api-utils";
import { bookingSchema } from "@/lib/validators/booking";
import { sendBookingCreatedEmails } from "@/lib/mail";
import { rateLimit, rateLimitResponse, getRateLimitIdentifier } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";

export async function POST(req: Request) {
  try {
    const ip = getRateLimitIdentifier(req);
    const { success, reset } = rateLimit(ip, {
      maxRequests: 5,
      windowMs: 60000,
    });

    if (!success) {
      return rateLimitResponse(reset);
    }

    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return errorResponse("Login Required", 401);
    }

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    await connectDB();

    const bookingId = `UA-${randomBytes(3).toString("hex").toUpperCase()}`;

    const service = await Service.findOne({
      _id: body.serviceId,
      isActive: true,
    });

    if (!service) {
      return errorResponse("Please select a valid service", 400);
    }

    const { name, phone, altPhone, date, time } = parsed.data;
    const { packageName, selectedTemples, temples, paymentMethod } = body;
    const pickup = service.from || parsed.data.pickup;
    const drop = service.to || service.route || parsed.data.drop;
    const price = String(service.price);
    const route = `${sanitizeInput(pickup)} -> ${sanitizeInput(drop)}`;

    const booking = await Booking.create({
      bookingId,
      userId: session.user.id,
      name: sanitizeInput(name),
      phone: sanitizeInput(phone),
      altPhone: sanitizeInput(altPhone || ""),
      pickup: sanitizeInput(pickup),
      drop: sanitizeInput(drop),
      route,
      date,
      time,
      price,
      status: "pending",
      packageName: packageName ? sanitizeInput(packageName) : sanitizeInput(drop),
      selectedTemples: Array.isArray(selectedTemples)
        ? selectedTemples.map(t => sanitizeInput(t))
        : [],
      temples: Array.isArray(temples) ? temples : [],
    });

    await sendBookingCreatedEmails({
      name: booking.name,
      bookingId: booking.bookingId,
      date: booking.date,
      time: booking.time,
      route: booking.route,
      price: booking.price,
      email: session.user.email,
      customerEmail: session.user.email,
      phone: booking.phone,
      packageName: booking.packageName,
      paymentMethod: typeof paymentMethod === "string" ? paymentMethod : undefined,
    }).catch(e => console.error("Could not send booking emails:", e));

    return successResponse(booking, 201);
  } catch (err) {
    console.error("Booking Error:", err);
    return errorResponse("Server Error", 500);
  }
}
