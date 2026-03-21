import { NextResponse } from "next/server";
import { Resend } from "resend";
import crypto from "crypto";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { forgotSchema } from "@/lib/validators/auth";
import { rateLimit, rateLimitResponse, getRateLimitIdentifier } from "@/lib/rate-limit";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(req: Request) {
  try {
    const ip = getRateLimitIdentifier(req);
    const { success, reset } = rateLimit(ip, {
      maxRequests: 3,
      windowMs: 900000,
    });

    if (!success) {
      return rateLimitResponse(reset);
    }

    const body = await req.json();
    const data = forgotSchema.parse(body);

    await connectDB();

    const user = await User.findOne({ email: data.email.toLowerCase() });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If account exists, reset link sent",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `${APP_URL}/reset?token=${token}&email=${data.email}`;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "Ujjain AutoSeva <onboarding@resend.dev>",
        to: data.email,
        subject: "Reset Your Password - Ujjain AutoSeva",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2 style="color: #ff8c00;">Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>You requested to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #ff8c00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link expires in 15 minutes.<br/>
              If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: "If account exists, reset link sent",
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

    console.error("Forgot Password Error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
