import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";

/* =====================
   GET SINGLE SERVICE
===================== */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ IMPORTANT

    await connectDB();

    const service = await Service.findById(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(service);

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to load service" },
      { status: 500 }
    );
  }
}


/* =====================
   UPDATE SERVICE
===================== */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ✅ IMPORTANT

    await connectDB();

    const body = await req.json();

    const updated = await Service.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );

    return NextResponse.json(updated);

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}
