import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import "@/models/Temple";
import Route from "@/models/Route";

export async function GET() {
  try {
    await connectDB();

    const routes = await Route.find({ activeStatus: true })
      .populate("templeList", "name _id")
      .sort({ createdAt: 1 });

    return NextResponse.json({ data: routes });

  } catch (error) {
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
