import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import CustomBooking from "@/models/CustomBooking";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

const customBookingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone is required"),
  altPhone: z.string().optional().default(""),
  temples: z.array(z.object({
    _id: z.string(),
    name: z.string(),
    price: z.number(),
  })),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  price: z.string().min(1, "Price is required"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    const body = await req.json();
    const validatedData = customBookingSchema.parse(body);

    await connectDB();

    const bookingId = `UA-CT-${Date.now().toString(36).toUpperCase()}`;

    const basePrice = 200;
    const templePrice = validatedData.temples.reduce((sum, t) => sum + t.price, 0);

    const booking = await CustomBooking.create({
      bookingId,
      userId: session?.user?.id || "",
      name: validatedData.name,
      phone: validatedData.phone,
      altPhone: validatedData.altPhone,
      temples: validatedData.temples,
      pickup: "Ujjain",
      date: validatedData.date,
      time: validatedData.time,
      price: validatedData.price,
      basePrice,
      templePrice,
      status: "pending",
    });

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.log("Custom Booking POST Error:", error);

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
