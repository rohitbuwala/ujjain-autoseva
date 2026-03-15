import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";


/* ================= GET ALL ================= */
export async function GET() {
  try {
    await connectDB();

    const services = await Service.find({ isActive: true }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: services
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

/* ================= ADD ================= */
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const service = await Service.create(body);

    return NextResponse.json({
      success: true,
      data: service
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}


/* ================= DELETE ================= */
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { id } = await req.json();

    await Service.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
