import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Temple from "@/models/Temple";

export async function GET() {
  try {
    await connectDB();

    const temples = await Temple.find({ activeStatus: true })
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: temples
    });

  } catch (error) {
    console.log("Temple API Error:", error);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const temple = await Temple.create({
      name: body.name,
      basePrice: body.price,
      category: body.category,
      activeStatus: body.active ?? true,
    });

    return NextResponse.json({
      success: true,
      data: temple
    });

  } catch (error) {
    console.log("Temple API POST Error:", error);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
