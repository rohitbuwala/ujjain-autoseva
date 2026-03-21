import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Temple from "@/models/Temple";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.price !== undefined) updateData.basePrice = Number(body.price);
    if (body.active !== undefined) updateData.activeStatus = body.active;
    if (body.isActive !== undefined) updateData.activeStatus = body.isActive;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;

    await connectDB();
    const temple = await Temple.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!temple) {
      return NextResponse.json({ error: "Temple not found" }, { status: 404 });
    }

    return NextResponse.json({ data: temple });
  } catch (error) {
    console.error("ADMIN TEMPLES PATCH ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    await connectDB();
    const temple = await Temple.findByIdAndDelete(id);
    
    if (!temple) {
      return NextResponse.json({ error: "Temple not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN TEMPLES DELETE ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
