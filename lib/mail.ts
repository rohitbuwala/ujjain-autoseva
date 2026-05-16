import nodemailer from "nodemailer";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/sanitize";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

let nodemailerTransporter: nodemailer.Transporter | null = null;

function getNodemailerTransporter() {
  if (nodemailerTransporter) return nodemailerTransporter;
  if (process.env.MAIL_USER && process.env.MAIL_PASS) {
    nodemailerTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }
  return nodemailerTransporter;
}

const APP_NAME = "Ujjain AutoSeva";
const FROM_RESEND = "Ujjain AutoSeva <onboarding@resend.dev>";
const FROM_NODEMAILER = process.env.MAIL_USER
  ? `${APP_NAME} <${process.env.MAIL_USER}>`
  : "ankitbuwala@gmail.com";
const CONTACT_PHONE = "+91 62631 89202";

interface BookingEmailData {
  name: string;
  bookingId: string;
  date: string;
  time: string;
  route: string;
  price: string;
  email: string;
}

export async function sendEmailViaFallback(to: string, subject: string, html: string) {
  let lastError: unknown = null;

  // Try 1: Resend
  if (resend) {
    try {
      await resend.emails.send({ from: FROM_RESEND, to, subject, html });
      console.log(`Email sent via Resend ✅ → ${to}`);
      return;
    } catch (err) {
      lastError = err;
      console.error("Resend failed, trying nodemailer fallback...", err);
    }
  }

  // Try 2: Nodemailer (Gmail SMTP)
  const transporter = getNodemailerTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: FROM_NODEMAILER,
        to,
        subject,
        html,
      });
      console.log(`Email sent via Nodemailer ✅ → ${to}`);
      return;
    } catch (err) {
      lastError = err;
      console.error("Nodemailer also failed ❌", err);
    }
  }

  console.error("Email could not be sent via any provider ❌", lastError);
}

async function sendEmail(to: string, subject: string, html: string) {
  let lastError: unknown = null;
  const transporter = getNodemailerTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: FROM_NODEMAILER,
        to,
        subject,
        html,
      });
      console.log(`Email sent via Gmail SMTP to ${to}`);
      return;
    } catch (err) {
      lastError = err;
      console.error("Gmail SMTP failed, trying Resend fallback...", err);
    }
  }

  if (resend) {
    try {
      await resend.emails.send({ from: FROM_RESEND, to, subject, html });
      console.log(`Email sent via Resend to ${to}`);
      return;
    } catch (err) {
      lastError = err;
      console.error("Resend also failed", err);
    }
  }

  console.error("Email could not be sent via any provider", lastError);
}

export const sendPendingEmail = async (data: BookingEmailData) => {
  const safe = {
    name: escapeHtml(data.name),
    bookingId: escapeHtml(data.bookingId),
    date: escapeHtml(data.date),
    time: escapeHtml(data.time),
    route: escapeHtml(data.route),
    price: escapeHtml(data.price),
  };

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #ff8c00; text-align: center;">🙏 Jay Shri Mahakal!</h2>
      <p>Hello <b>${safe.name}</b>,</p>
      <p>Thank you for choosing <b>${APP_NAME}</b>. We have received your booking request.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff8c00;">
        <h3 style="margin-top: 0; color: #333;">Booking Details:</h3>
        <p style="margin: 5px 0;"><b>Booking ID:</b> ${safe.bookingId}</p>
        <p style="margin: 5px 0;"><b>Route:</b> ${safe.route}</p>
        <p style="margin: 5px 0;"><b>Date:</b> ${safe.date}</p>
        <p style="margin: 5px 0;"><b>Time:</b> ${safe.time}</p>
        <p style="margin: 5px 0;"><b>Fare:</b> ₹${safe.price}</p>
      </div>

      <p style="color: #666;">Status: <span style="color: #ff8c00; font-weight: bold;">PENDING</span></p>
      <p>Our admin team is reviewing your request. You will receive a confirmation email once it's approved.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">For any help, call/WhatsApp us at: <br/> <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  await sendEmail(
    data.email,
    `Booking Request Received - ${data.bookingId}`,
    html
  );
};

export const sendConfirmationEmail = async (data: BookingEmailData) => {
  const safe = {
    name: escapeHtml(data.name),
    bookingId: escapeHtml(data.bookingId),
    date: escapeHtml(data.date),
    time: escapeHtml(data.time),
    route: escapeHtml(data.route),
    price: escapeHtml(data.price),
  };

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #28a745; text-align: center;">✅ Booking Confirmed!</h2>
      <p>Hello <b>${safe.name}</b>,</p>
      <p>Great news! Your booking with <b>${APP_NAME}</b> has been confirmed. Our driver will be ready for you.</p>
      
      <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c6f6d5; border-left: 4px solid #28a745;">
        <h3 style="margin-top: 0; color: #2f855a;">Trip Details:</h3>
        <p style="margin: 5px 0;"><b>Booking ID:</b> ${safe.bookingId}</p>
        <p style="margin: 5px 0;"><b>Route:</b> ${safe.route}</p>
        <p style="margin: 5px 0;"><b>Date:</b> ${safe.date}</p>
        <p style="margin: 5px 0;"><b>Time:</b> ${safe.time}</p>
        <p style="margin: 5px 0;"><b>Fare:</b> ₹${safe.price}</p>
      </div>

      <p>Have a peaceful and divine journey in Ujjain. 🙏</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">Emergency Contact: <br/> <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  await sendEmail(
    data.email,
    `Booking CONFIRMED! - ${data.bookingId}`,
    html
  );
};

export const sendCancellationEmail = async (data: BookingEmailData & { reason: string }) => {
  const safe = {
    name: escapeHtml(data.name),
    bookingId: escapeHtml(data.bookingId),
    date: escapeHtml(data.date),
    time: escapeHtml(data.time),
    route: escapeHtml(data.route),
    reason: escapeHtml(data.reason),
  };

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #dc3545; text-align: center;">❌ Booking Cancelled</h2>
      <p>Hello <b>${safe.name}</b>,</p>
      <p>Your booking with <b>${APP_NAME}</b> has been cancelled.</p>
      
      <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #feb2b2; border-left: 4px solid #dc3545;">
        <h3 style="margin-top: 0; color: #c53030;">Cancelled Booking Details:</h3>
        <p style="margin: 5px 0;"><b>Booking ID:</b> ${safe.bookingId}</p>
        <p style="margin: 5px 0;"><b>Route:</b> ${safe.route}</p>
        <p style="margin: 5px 0;"><b>Date:</b> ${safe.date}</p>
        <p style="margin: 5px 0;"><b>Time:</b> ${safe.time}</p>
        <p style="margin: 5px 0;"><b>Reason:</b> ${safe.reason}</p>
      </div>

      <p>If you did not request this cancellation or have any questions, please contact us immediately.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">For any help, call/WhatsApp us at: <br/> <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  await sendEmail(
    data.email,
    `Booking Cancelled - ${data.bookingId}`,
    html
  );
};

export const sendMail = async (to: string, msg: string) => {
  await sendEmail(to, "Message from AutoSeva", msg);
};
