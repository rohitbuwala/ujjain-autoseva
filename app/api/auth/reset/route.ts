import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  await connectDB();

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid token" });
  }

  const hash = await bcrypt.hash(password, 10);

  user.password = hash;
  user.resetToken = null;
  user.resetTokenExpiry = null;

  await user.save();

  return NextResponse.json({
    message: "Password Reset Success",
  });
}
