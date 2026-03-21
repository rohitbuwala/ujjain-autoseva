import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Route from "@/models/Route";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    await connectDB();
    const route = await Route.findByIdAndUpdate(id, body, { new: true })
      .populate("templeList", "name _id");
    
    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    return NextResponse.json({ data: route });
  } catch (error: unknown) {
    console.error("ADMIN ROUTES PATCH ERROR:", error);
    if((error as { code?: number }).code === 11000) {
        return NextResponse.json({ error: "Route name already exists" }, { status: 400 });
    }
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
    const route = await Route.findByIdAndDelete(id);
    
    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ADMIN ROUTES DELETE ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
