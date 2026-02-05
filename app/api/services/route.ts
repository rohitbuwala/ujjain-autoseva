import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Service from "@/models/Service";

export async function GET() {
  await connectDB();

  const services = await Service.find();

  return NextResponse.json(services);
}
