import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import connectDB from "@/lib/db";
import User from "@/models/User";
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

    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: true, message: "If account exists, verification email sent" }
      );
    }

    if (user.verified) {
      return NextResponse.json(
        { success: true, message: "Email already verified. You can login." }
      );
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    user.verifyToken = verifyToken;
    user.verifyTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const verifyUrl = `${APP_URL}/verify?token=${verifyToken}&email=${email}`;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "Ujjain AutoSeva <onboarding@resend.dev>",
        to: email,
        subject: "Verify Your Email - Ujjain AutoSeva",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2 style="color: #ff8c00;">Welcome to Ujjain AutoSeva!</h2>
            <p>Hello ${user.name},</p>
            <p>Thank you for registering. Please verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background: #ff8c00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Email
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link expires in 24 hours.<br/>
              If you didn't create this account, please ignore this email.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: "If account exists, verification email sent",
    });

  } catch (err) {
    console.error("Verify Resend Error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
