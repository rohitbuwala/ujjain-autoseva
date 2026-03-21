import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { resetSchema } from "@/lib/validators/auth";
import { rateLimit, rateLimitResponse, getRateLimitIdentifier } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getRateLimitIdentifier(req);
    const { success, reset } = rateLimit(ip, {
      maxRequests: 5,
      windowMs: 900000,
    });

    if (!success) {
      return rateLimitResponse(reset);
    }

    const body = await req.json();
    const data = resetSchema.parse(body);

    await connectDB();

    const user = await User.findOne({
      email: data.email?.toLowerCase(),
      resetToken: data.token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token. Please request a new one." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now login.",
    });

  } catch (err) {
    if (err instanceof Error && "errors" in err) {
      const zodError = err as { name: string; errors: { message: string }[] };
      if (zodError.name === "ZodError") {
        return NextResponse.json(
          { error: zodError.errors[0].message },
          { status: 400 }
        );
      }
    }

    console.error("Reset Password Error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
