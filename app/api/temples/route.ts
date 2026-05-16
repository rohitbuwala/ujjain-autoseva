import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Temple from "@/models/Temple";
import { requireAdminSession } from "@/lib/auth-utils";

export async function GET() {
  try {
    await connectDB();

    const temples = await Temple.find({ activeStatus: true })
      .sort({ name: 1 });

    const data = temples.map((temple) => {
      const item = temple.toObject();
      return {
        ...item,
        price: item.price ?? item.basePrice ?? 0,
      };
    });

    return NextResponse.json({
      success: true,
      data
    });

  } catch {
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { response } = await requireAdminSession();
    if (response) return response;

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

  } catch {
    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}
