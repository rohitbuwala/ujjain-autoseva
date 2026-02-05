import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { getServerSession } from "next-auth";
import { sendWhatsApp } from "@/lib/whatsapp";


export async function POST(req: Request) {
  await connectDB();

    //   // Admin Alert
    // await sendWhatsApp(
    //   process.env.ADMIN_PHONE!,
    //   `🚖 New Booking!

    // Route: ${body.route}
    // Time: ${body.time}
    // Price: ${body.price}

    // Please check admin panel.`
    // );

    // // User Alert
    // await sendWhatsApp(
    //   `whatsapp:${session.user.phone}`,
    //   `✅ Booking Received!

    // Route: ${body.route}
    // Status: Pending

    // We will confirm soon.`
    // );


  const session = await getServerSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: "Not logged in" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const booking = await Booking.create({
    userId: session.user.email,
    name: session.user.name,
    email: session.user.email,

    route: body.route,
    time: body.time,
    price: body.price,
  });

  return NextResponse.json({ booking });
}
