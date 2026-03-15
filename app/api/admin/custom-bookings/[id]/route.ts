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
    
    console.log("Updating booking:", id, "with data:", body);
    
    await connectDB();
    
    const updateData: Record<string, any> = {};
    if (body.price !== undefined) updateData.price = String(body.price);
    if (body.adminNote !== undefined) updateData.adminNote = body.adminNote;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.temples !== undefined) updateData.temples = body.temples;

    const booking = await CustomBooking.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    console.log("Updated booking:", booking);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Server Error: " + (error as Error).message }, { status: 500 });
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
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
