import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { z } from "zod";

import connectDB from "@/lib/db";
import Booking from "@/models/Booking";
import Temple from "@/models/Temple";
import Route from "@/models/Route";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendBookingCreatedEmails } from "@/lib/mail";
import { rateLimit, rateLimitResponse, getRateLimitIdentifier } from "@/lib/rate-limit";
import { sanitizeInput } from "@/lib/sanitize";

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
  selectedTemples: z.array(z.string()).optional().default([]),
  totalPrice: z.number().min(0, "Price is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  pickup: z.string().min(1, "Pickup is required"),
  hotel: z.boolean().optional().default(false),
  notes: z.string().optional().default(""),
  paymentMethod: z.string().optional(),
});

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

    if (!session || !session.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: "Please login to book" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = customBookingSchema.parse(body);
    const customerEmail = sanitizeInput(session.user.email.toLowerCase().trim());

    await connectDB();

    const bookingId = `UA-${randomBytes(3).toString("hex").toUpperCase()}`;
    const selectedTempleIds = validatedData.temples
      .map((temple) => temple._id)
      .filter((id) => id && id !== "package_default");

    const dbTemples = selectedTempleIds.length > 0
      ? await Temple.find({ _id: { $in: selectedTempleIds }, activeStatus: true })
      : [];

    const serverTemples = dbTemples.map((temple) => ({
      _id: temple._id.toString(),
      name: temple.name,
      price: temple.price ?? temple.basePrice ?? 0,
    }));

    let serverPrice: number;
    let matchedRoute: Awaited<ReturnType<typeof Route.findOne>> = null;
    if (validatedData.packageType === "custom") {
      serverPrice = serverTemples.reduce((sum, temple) => sum + temple.price, 0);
    } else {
      matchedRoute = await Route.findOne({ slug: validatedData.packageType, activeStatus: true }).lean()
        ?? await Route.findOne({ packageType: validatedData.packageType, activeStatus: true }).lean();
      if (!matchedRoute) {
        return NextResponse.json(
          { error: "Invalid route" },
          { status: 400 }
        );
      }
      serverPrice = matchedRoute.totalPrice;
    }

    if (validatedData.packageType === "custom" && serverTemples.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one valid temple" },
        { status: 400 }
      );
    }

    const templesForBooking = validatedData.packageType === "custom"
      ? serverTemples
      : validatedData.temples;

    const templeNames = templesForBooking.map(t => t.name).join(", ");
    const dropText = validatedData.packageType === "five"
      ? `5 Temple Darshan (${templeNames})`
      : validatedData.temples.length > 0
        ? `Custom: ${templeNames}`
        : "Custom Trip";

    const booking = await Booking.create({
      bookingId,
      userId: session.user.id,
      name: sanitizeInput(validatedData.name),
      email: customerEmail,
      phone: sanitizeInput(validatedData.phone),
      altPhone: sanitizeInput(validatedData.altPhone || ""),
      pickup: sanitizeInput(validatedData.pickup),
      drop: dropText,
      route: `${sanitizeInput(validatedData.pickup)} -> ${sanitizeInput(validatedData.packageName)}`,
      routeId: matchedRoute?._id ?? null,
      date: validatedData.date,
      time: validatedData.time,
      price: serverPrice.toString(),
      status: "pending",
      paymentMethod: "none",
      paymentStatus: "not_required",
      paymentAmount: serverPrice,
      paymentCurrency: "INR",
      packageType: sanitizeInput(validatedData.packageType),
      packageName: sanitizeInput(validatedData.packageName),
      temples: templesForBooking,
      selectedTemples: validatedData.selectedTemples.length > 0
        ? validatedData.selectedTemples.map(t => sanitizeInput(t))
        : validatedData.temples.map(t => sanitizeInput(t.name)),
      notes: sanitizeInput(validatedData.notes || ""),
      hotel: validatedData.hotel,
    });

    await sendBookingCreatedEmails({
      bookingId: booking.bookingId,
      name: booking.name,
      email: customerEmail,
      customerEmail,
      phone: booking.phone,
      route: booking.route,
      time: booking.time,
      date: booking.date,
      price: booking.price,
      packageName: booking.packageName,
      paymentMethod: validatedData.paymentMethod,
    }).catch(e => console.error("Booking Email Error:", e));

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
