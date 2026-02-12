import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: "Ujjain AutoSeva <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL!,
      subject: `New Contact Message from ${name}`,
      html: `
        <h3>New Contact Form Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Email failed" },
      { status: 500 }
    );
  }
}
