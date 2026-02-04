import { NextResponse } from "next/server";
import crypto from "crypto";

import connectDB from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  const { email } = await req.json();

  await connectDB();

  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({ error: "No user" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

  await user.save();

  // 👉 Yahan email bhejna (next step me sikhenge)

  return NextResponse.json({
    message: "Reset link sent",
    token,
  });
}
