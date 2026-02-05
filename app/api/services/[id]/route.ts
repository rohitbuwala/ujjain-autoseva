import connectDB from "@/lib/db";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();

  await Service.findByIdAndDelete(params.id);

  return NextResponse.json({
    success: true,
  });
}
