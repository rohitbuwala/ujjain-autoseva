import { NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimit, rateLimitResponse, getRateLimitIdentifier } from "@/lib/rate-limit";
import { sanitizeInput, escapeHtml } from "@/lib/sanitize";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: Request) {
  try {
    const ip = getRateLimitIdentifier(req);
    const { success, reset } = rateLimit(ip, {
      maxRequests: 3,
      windowMs: 60000,
    });

    if (!success) {
      return rateLimitResponse(reset);
    }

    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhone = sanitizeInput(phone || "");
    const sanitizedMessage = sanitizeInput(message);

    const resend = getResend();

    await resend.emails.send({
      from: "Ujjain AutoSeva <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL || "ankitbuwala@gmail.com",
      subject: `New Contact Message from ${sanitizedName}`,
      html: `
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${escapeHtml(sanitizedName)}</p>
        <p><b>Email:</b> ${escapeHtml(sanitizedEmail)}</p>
        <p><b>Phone:</b> ${escapeHtml(sanitizedPhone) || "Not Provided"}</p>
        <hr />
        <p>${escapeHtml(sanitizedMessage)}</p>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Contact API Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Email sending failed";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
