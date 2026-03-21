import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Resend } from "resend";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validators/auth";
import { rateLimit, rateLimitResponse, getRateLimitIdentifier } from "@/lib/rate-limit";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

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
    const verifyToken = crypto.randomBytes(32).toString("hex");

    await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase(),
      password: hash,
      role: "user",
      verified: false,
      verifyToken,
      verifyTokenExpiry: Date.now() + 24 * 60 * 60 * 1000,
    });

    const verifyUrl = `${APP_URL}/verify?token=${verifyToken}&email=${data.email}`;

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Ujjain AutoSeva <onboarding@resend.dev>",
          to: data.email,
          subject: "Verify Your Email - Ujjain AutoSeva",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <h2 style="color: #ff8c00;">Welcome to Ujjain AutoSeva!</h2>
              <p>Hello ${data.name},</p>
              <p>Thank you for registering. Please verify your email address:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background: #ff8c00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Verify Email
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">
                This link expires in 24 hours.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Verification email error:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Account created! Please check your email to verify your account.",
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
