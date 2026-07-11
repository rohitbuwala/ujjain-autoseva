import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Temple from "@/models/Temple";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const temples = await Temple.find().sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: temples });
  } catch (error) {
    console.error("ADMIN TEMPLES GET ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.name || (body.basePrice === undefined && body.price === undefined) || !body.category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    
    const temple = await Temple.create({
      name: body.name,
      category: body.category,
      basePrice: body.basePrice ?? body.price ?? 0,
      displayOrder: body.displayOrder ?? 0,
      activeStatus: body.activeStatus ?? true,
      routeGroup: body.routeGroup || "",
      description: body.description || ""
    });

    return NextResponse.json({ data: temple }, { status: 201 });
  } catch (error) {
    console.error("ADMIN TEMPLES POST ERROR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
