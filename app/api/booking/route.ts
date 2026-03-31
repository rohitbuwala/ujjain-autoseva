import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";

import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { successResponse, errorResponse } from "@/lib/api-utils";
import { bookingSchema } from "@/lib/validators/booking";
import { sendAdminNotification } from "@/lib/sendWhatsApp";
import { sendPendingEmail } from "@/lib/mail";
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

    // ✅ Session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return errorResponse("Login Required", 401);
    }

    // ✅ Body
    const body = await req.json();

    // ✅ Zod validation
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    await connectDB();

    // ✅ Generate unique Booking ID
    const bookingId = `UA-${randomBytes(3).toString("hex").toUpperCase()}`;

    // ✅ Extract and sanitize data
    const {
      name,
      phone,
      altPhone,
      pickup,
      drop,
      date,
      time,
      price,
    } = parsed.data;

    const { packageName, selectedTemples, temples } = body;

    // ✅ Build route
    const route = `${sanitizeInput(pickup)} → ${sanitizeInput(drop)}`;

    // ✅ Save booking
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
      price: sanitizeInput(price),
      status: "pending",
      packageName: packageName ? sanitizeInput(packageName) : sanitizeInput(drop),
      selectedTemples: Array.isArray(selectedTemples) ? selectedTemples.map(t => sanitizeInput(t)) : [],
      temples: Array.isArray(temples) ? temples : []
    });

    console.log("Booking Data (Standard):", {
      bookingId: booking.bookingId,
      route: booking.route,
      packageName: booking.packageName,
      selectedTemples: booking.selectedTemples
    });

    await sendAdminNotification(booking);

    // ✅ Send Pending Email to User
    await sendPendingEmail({
      name: booking.name,
      bookingId: booking.bookingId,
      date: booking.date,
      time: booking.time,
      route: booking.route,
      price: booking.price,
      email: session.user.email,
    }).catch(e => console.error("Could not send pending email to user:", e));

    return successResponse(booking, 201);

  } catch (err) {

    console.error("Booking Error:", err);

    return errorResponse("Server Error", 500);
  }
}
