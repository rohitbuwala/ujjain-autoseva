import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { sendAdminNotification } from "@/lib/sendWhatsApp";

const customBookingSchema = z.object({
  packageType: z.string().min(1, "Package type is required"),
  packageName: z.string().min(1, "Package name is required"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone is required").max(10),
  altPhone: z.string().optional().default(""),
  temples: z.array(z.object({
    _id: z.string(),
    name: z.string(),
    price: z.number(),
  })).optional().default([]),
  totalPrice: z.number().min(0, "Price is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  pickup: z.string().min(1, "Pickup is required"),
  hotel: z.boolean().optional().default(false),
  notes: z.string().optional().default(""),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    const body = await req.json();
    const validatedData = customBookingSchema.parse(body);

    await connectDB();

    const bookingId = `UA-${Math.floor(100000 + Math.random() * 900000)}`;

    const templeNames = validatedData.temples.map(t => t.name).join(", ");
    const dropText = validatedData.packageType === "five" 
      ? `5 Temple Darshan (${templeNames})`
      : validatedData.temples.length > 0 
        ? `Custom: ${templeNames}`
        : "Custom Trip";

    const booking = await Booking.create({
      bookingId,
      userId: session?.user?.id || "guest",
      name: validatedData.name,
      phone: validatedData.phone,
      altPhone: validatedData.altPhone,
      pickup: validatedData.hotel ? `${validatedData.pickup} (Hotel/Guest House)` : validatedData.pickup,
      drop: dropText,
      route: `${validatedData.pickup} -> ${validatedData.packageName}`,
      date: validatedData.date,
      time: validatedData.time,
      price: validatedData.totalPrice.toString(),
      status: "pending",
      packageType: validatedData.packageType,
      packageName: validatedData.packageName,
      temples: validatedData.temples,
      notes: validatedData.notes,
      hotel: validatedData.hotel
    });

    if (booking) {
      await sendAdminNotification({
        bookingId: booking.bookingId,
        name: booking.name,
        phone: booking.phone,
        route: booking.route,
        time: booking.time,
        date: booking.date,
        price: booking.price,
        temples: booking.temples,
        packageName: booking.packageName
      }).catch(e => console.error("WhatsApp Error:", e));
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Custom Booking POST Error:", error);

    if (error instanceof Error && "name" in error && error.name === "ZodError") {
      const zodError = error as unknown as { errors: { message: string }[] };
      return NextResponse.json(
        { error: zodError.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
