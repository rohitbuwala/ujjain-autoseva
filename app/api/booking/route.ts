import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { successResponse, errorResponse } from "@/lib/api-utils";
import { bookingSchema } from "@/lib/validators/booking";

export async function POST(req: Request) {

  try {

    // ✅ Session
    const session = await getServerSession(authOptions);

    if (!session) {
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

    // ✅ Extract data
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

    // ✅ Build route
    const route = `${pickup} → ${drop}`;

    // ✅ Save booking (IMPORTANT FIX)
    const booking = await Booking.create({

      userId: session.user.id,

      name,
      phone,
      altPhone,

      pickup,
      drop,

      route,

      date,     // ⭐ FIXED
      time,     // ⭐ FIXED

      price,

      status: "pending",
    });

    return successResponse(booking);

  } catch (err) {

    console.error("Booking Error:", err);

    return errorResponse("Server Error", 500);
  }
}
