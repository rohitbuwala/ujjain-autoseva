import { NextResponse } from "next/server";
import crypto from "crypto";

import connectDB from "@/lib/db";
import User from "@/models/User";

import { forgotSchema } from "@/lib/validators/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Zod Validation
    const data = forgotSchema.parse(body);

    await connectDB();

    const user = await User.findOne({ email: data.email });

    // Security: same message even if user not found
    if (!user) {
      return NextResponse.json({
        message: "If account exists, reset link sent",
      });
    }

    // ✅ Generate Token
    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 min

    await user.save();

    // ⚠️ Abhi email nahi bhej rahe (next step)
    // console.log("Reset Token:", token);

    return NextResponse.json({
      success: true,
      message: "Reset link sent",
      token, // dev ke liye (baad me hata dena)
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
