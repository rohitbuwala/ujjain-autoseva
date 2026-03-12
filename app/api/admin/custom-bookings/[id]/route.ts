import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/db";
import CustomBooking from "@/models/CustomBooking";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "rejected"]).optional(),
  adminNote: z.string().optional(),
  price: z.string().optional(),
  temples: z.array(z.object({
    _id: z.string(),
    name: z.string(),
    price: z.number(),
  })).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateBookingSchema.parse(body);

    await connectDB();
    const booking = await CustomBooking.findByIdAndUpdate(
      id,
      validatedData,
      { new: true }
    );

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.log("Admin Custom Booking PATCH Error:", error);

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    const booking = await CustomBooking.findByIdAndDelete(id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.log("Admin Custom Booking DELETE Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
