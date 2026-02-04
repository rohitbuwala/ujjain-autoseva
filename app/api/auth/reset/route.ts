import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/db";
import User from "@/models/User";

import { resetSchema } from "@/lib/validators/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Zod Validation
    const data = resetSchema.parse(body);

    await connectDB();

    const user = await User.findOne({
      resetToken: data.token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // ✅ New Password Hash
    const hash = await bcrypt.hash(data.password, 10);

    user.password = hash;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successful",
    });

  } catch (err: any) {

    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
