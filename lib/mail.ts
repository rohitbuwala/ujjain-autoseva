import nodemailer from "nodemailer";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/sanitize";

const APP_NAME = "Ujjain AutoSeva";
const FROM_RESEND = "Ujjain AutoSeva <booking@ujjain-autoseva.in>";
const FROM_NODEMAILER = process.env.MAIL_USER
  ? `${APP_NAME} <${process.env.MAIL_USER}>`
  : "ankitbuwala@gmail.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "ankitbuwala@gmail.com";
const CONTACT_PHONE = "+91 62631 89202";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
let nodemailerTransporter: nodemailer.Transporter | null = null;

interface BookingEmailData {
  name: string;
  bookingId: string;
  date: string;
  time: string;
  route: string;
  price: string;
  email: string;
  paymentStatus?: string;
  dashboardUrl?: string;
}

interface BookingCreatedEmailData extends BookingEmailData {
  phone: string;
  customerEmail: string;
  packageName?: string;
  paymentMethod?: string;
}

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

async function sendEmail(to: string, subject: string, html: string) {
  let lastError: unknown = null;

  if (resend) {
    try {
      await resend.emails.send({ from: FROM_RESEND, to, subject, html });
      console.log(`Email sent via Resend to ${to}`);
      return;
    } catch (err) {
      lastError = err;
      console.error("Resend failed, trying Nodemailer fallback...", err);
    }
  }

  const transporter = getNodemailerTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: FROM_NODEMAILER,
        to,
        subject,
        html,
      });
      console.log(`Email sent via Nodemailer to ${to}`);
      return;
    } catch (err) {
      lastError = err;
      console.error("Nodemailer failed", err);
    }
  }

  throw lastError || new Error("No email provider configured");
}

function detailRow(label: string, value?: string) {
  if (!value) return "";

  return `
    <p style="margin: 6px 0;">
      <b>${escapeHtml(label)}:</b> ${escapeHtml(value)}
    </p>
  `;
}

function bookingDetailsHtml(data: {
  bookingId: string;
  name: string;
  email?: string;
  phone?: string;
  date: string;
  time: string;
  route: string;
  packageName?: string;
  paymentMethod?: string;
  price?: string;
}) {
  return `
    ${detailRow("Booking ID", data.bookingId)}
    ${detailRow("Customer Name", data.name)}
    ${detailRow("Customer Email", data.email)}
    ${detailRow("Customer Mobile", data.phone)}
    ${detailRow("Booking Date", data.date)}
    ${detailRow("Booking Time", data.time)}
    ${detailRow("Selected Service/Package", data.packageName || data.route)}
    ${detailRow("Route", data.route)}
    ${detailRow("Payment Method", data.paymentMethod)}
    ${detailRow("Fare", data.price ? `Rs. ${data.price}` : undefined)}
  `;
}

export async function sendBookingCreatedEmails(data: BookingCreatedEmailData) {
  const customerHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #ff8c00; text-align: center;">Booking Request Received</h2>
      <p>Hello <b>${escapeHtml(data.name)}</b>,</p>
      <p>Thank you for choosing <b>${APP_NAME}</b>. We have received your booking request.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff8c00;">
        <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
        ${bookingDetailsHtml({
          bookingId: data.bookingId,
          name: data.name,
          email: data.customerEmail,
          phone: data.phone,
          date: data.date,
          time: data.time,
          route: data.route,
          packageName: data.packageName,
          paymentMethod: data.paymentMethod,
          price: data.price,
        })}
      </div>
      <p style="color: #666;">Status: <b>PENDING</b></p>
      <p>Your booking is currently pending and under admin review.</p>
      <p>We will send you another email once the admin confirms or rejects your booking.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">For help, call us at <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  const adminHtml = `
    <div style="font-family: sans-serif; max-width: 650px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #ff8c00;">New Booking Received</h2>
      <p>A new booking request has been created on <b>${APP_NAME}</b>.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff8c00;">
        ${bookingDetailsHtml({
          bookingId: data.bookingId,
          name: data.name,
          email: data.customerEmail,
          phone: data.phone,
          date: data.date,
          time: data.time,
          route: data.route,
          packageName: data.packageName,
          paymentMethod: data.paymentMethod,
          price: data.price,
        })}
      </div>
    </div>
  `;

  await Promise.all([
    sendEmail(data.email, `Booking Request Received - ${data.bookingId}`, customerHtml),
    sendEmail(ADMIN_EMAIL, `New Booking - ${data.bookingId}`, adminHtml),
  ]);
}

export const sendPendingEmail = async (data: BookingEmailData) => {
  await sendBookingCreatedEmails({
    ...data,
    phone: "",
    customerEmail: data.email,
  });
};

export const sendConfirmationEmail = async (data: BookingEmailData) => {
  const dashboardUrl = data.dashboardUrl || `${APP_URL}/dashboard/booking`;
  const paymentStatus = data.paymentStatus || "payment_pending";

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #28a745; text-align: center;">Booking Approved</h2>
      <p>Hello <b>${escapeHtml(data.name)}</b>,</p>
      <p>Your booking with <b>${APP_NAME}</b> has been approved by our admin team.</p>
      <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c6f6d5; border-left: 4px solid #28a745;">
        ${bookingDetailsHtml({
          bookingId: data.bookingId,
          name: data.name,
          email: data.email,
          date: data.date,
          time: data.time,
          route: data.route,
          price: data.price,
        })}
        ${detailRow("Payment Status", paymentStatus.replace(/_/g, " "))}
      </div>
      <p style="color: #333;">Please open your dashboard to choose a payment option for this booking.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${escapeHtml(dashboardUrl)}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Open Booking Dashboard
        </a>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">Emergency Contact: <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  await sendEmail(data.email, `Booking Approved - Payment Required - ${data.bookingId}`, html);
};

export const sendCancellationEmail = async (
  data: BookingEmailData & { reason: string; cancelledBy: "Customer" | "Admin" }
) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #dc3545; text-align: center;">Booking Cancelled</h2>
      <p>Hello <b>${escapeHtml(data.name)}</b>,</p>
      <p>Your booking with <b>${APP_NAME}</b> has been cancelled.</p>
      <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #feb2b2; border-left: 4px solid #dc3545;">
        ${bookingDetailsHtml({
          bookingId: data.bookingId,
          name: data.name,
          email: data.email,
          date: data.date,
          time: data.time,
          route: data.route,
        })}
        ${detailRow("Cancelled By", data.cancelledBy)}
        ${detailRow("Reason", data.reason)}
      </div>
      <p>If you did not request this cancellation or have any questions, please contact us immediately.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">For help, call us at <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  await sendEmail(data.email, `Booking Cancelled - ${data.bookingId}`, html);
};

export const sendRejectionEmail = async (data: BookingEmailData) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #dc3545; text-align: center;">Booking Rejected</h2>
      <p>Hello <b>${escapeHtml(data.name)}</b>,</p>
      <p>We regret to inform you that your booking with <b>${APP_NAME}</b> has been rejected by the admin.</p>
      <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #feb2b2; border-left: 4px solid #dc3545;">
        ${bookingDetailsHtml({
          bookingId: data.bookingId,
          name: data.name,
          email: data.email,
          date: data.date,
          time: data.time,
          route: data.route,
          price: data.price,
        })}
      </div>
      <p>If you have any questions, please contact us or book another service.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">For help, call us at <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  await sendEmail(data.email, `Booking Rejected - ${data.bookingId}`, html);
};

export const sendMail = async (to: string, msg: string) => {
  await sendEmail(to, "Message from AutoSeva", msg);
};
