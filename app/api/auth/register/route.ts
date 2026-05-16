import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validators/auth";
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
    const data = registerSchema.parse(body);

    await connectDB();

    const exist = await User.findOne({
      email: data.email.toLowerCase(),
    });

    if (exist) {
      return NextResponse.json(
        { error: "EMAIL_EXISTS" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(data.password, 12);

    await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      password: hash,
      role: "user",
      verified: true,
      verifyToken: null,
      verifyTokenExpiry: null,
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully. You can now login.",
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

    console.error("Register Error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
