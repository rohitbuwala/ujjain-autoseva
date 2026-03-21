import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Route from "@/models/Route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const routes = await Route.find()
      .populate("templeList", "name _id")
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ data: routes });
  } catch (error) {
    console.error("ADMIN ROUTES GET ERROR:", error);
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
    
    if (!body.routeName || body.totalPrice === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectDB();
    
    const route = await Route.create({
      routeName: body.routeName,
      templeList: body.templeList || [],
      totalPrice: body.totalPrice,
      category: body.category || "inside",
      activeStatus: body.activeStatus ?? true
    });

    const populatedRoute = await Route.findById(route._id).populate("templeList", "name _id");

    return NextResponse.json({ data: populatedRoute }, { status: 201 });
  } catch (error: unknown) {
    console.error("ADMIN ROUTES POST ERROR:", error);
    if((error as { code?: number }).code === 11000) {
        return NextResponse.json({ error: "Route name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
