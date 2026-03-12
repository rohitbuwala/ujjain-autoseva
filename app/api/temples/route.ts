import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Temple from "@/models/Temple";

export async function GET() {
  try {
    await connectDB();

    const temples = await Temple.find({ isActive: true });

    return NextResponse.json(temples);

  } catch (error) {
    console.log("Temple API Error:", error);

    return NextResponse.json(
      { message: "Server Error" },
      { status: 500 }
    );
  }
}