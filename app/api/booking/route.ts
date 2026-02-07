import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { bookingSchema } from "@/lib/validators/booking";

export async function POST(req: Request) {

  try {

    // ✅ Session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Login Required" },
        { status: 401 }
      );
    }

    // ✅ Body
    const body = await req.json();

    // ✅ Zod validation
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
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

    return NextResponse.json(booking);

  } catch (err) {

    console.error("Booking Error:", err);

    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
