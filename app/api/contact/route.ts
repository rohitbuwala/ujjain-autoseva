import { NextResponse } from "next/server";
import { Resend } from "resend";

/* Create Resend safely */
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: Request) {
  try {
    const { name, email, phone, message } = await req.json();

    /* Validation */
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    /* Create instance at runtime */
    const resend = getResend();

    await resend.emails.send({
      from: "Ujjain AutoSeva <onboarding@resend.dev>",

      // 👇 Admin email (must be in env)
      to: process.env.ADMIN_EMAIL || "ankitbuwala@gmail.com",

      subject: `New Contact Message from ${name}`,

      html: `
        <h2>New Contact Message</h2>

        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || "Not Provided"}</p>

        <hr />

        <p>${message}</p>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {

    console.error("Contact API Error:", err);

    return NextResponse.json(
      {
        error: err.message || "Email sending failed"
      },
      { status: 500 }
    );
  }
}
