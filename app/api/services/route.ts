import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";


/* ================= GET ALL ================= */
export async function GET() {

  await connectDB();

  const count = await Service.countDocuments();

  console.log("TOTAL SERVICES:", count);

  const services = await Service.find();

  return NextResponse.json(services);
}

/* ================= ADD ================= */
export async function POST(req: Request) {

  await connectDB();

  const body = await req.json();

  const service = await Service.create(body);

  return NextResponse.json(service);
}


/* ================= DELETE ================= */
export async function DELETE(req: Request) {

  await connectDB();

  const { id } = await req.json();

  await Service.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
