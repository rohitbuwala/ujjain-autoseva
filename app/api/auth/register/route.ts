import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/db";
import User from "@/models/User";

import { registerSchema } from "@/lib/validators/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Zod Validation
    const data = registerSchema.parse(body);

    await connectDB();

    const exist = await User.findOne({ email: data.email });

    if (exist) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(data.password, 10);

    await User.create({
      name: data.name,
      email: data.email,
      password: hash,
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {

    // ✅ Zod Error Handle
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
