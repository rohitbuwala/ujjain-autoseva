import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const APP_NAME = "Ujjain AutoSeva";
const FROM_EMAIL = "Ujjain AutoSeva <onboarding@resend.dev>";
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

// 📩 1. Booking Pending Email (Sent when user books)
export const sendPendingEmail = async (data: BookingEmailData) => {
  if (!resend) {
    console.error("RESEND_API_KEY is missing. Could not send email.");
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #ff8c00; text-align: center;">🙏 Jay Shri Mahakal!</h2>
      <p>Hello <b>${data.name}</b>,</p>
      <p>Thank you for choosing <b>${APP_NAME}</b>. We have received your booking request.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff8c00;">
        <h3 style="margin-top: 0; color: #333;">Booking Details:</h3>
        <p style="margin: 5px 0;"><b>Booking ID:</b> ${data.bookingId}</p>
        <p style="margin: 5px 0;"><b>Route:</b> ${data.route}</p>
        <p style="margin: 5px 0;"><b>Date:</b> ${data.date}</p>
        <p style="margin: 5px 0;"><b>Time:</b> ${data.time}</p>
        <p style="margin: 5px 0;"><b>Fare:</b> ₹${data.price}</p>
      </div>

      <p style="color: #666;">Status: <span style="color: #ff8c00; font-weight: bold;">PENDING</span></p>
      <p>Our admin team is reviewing your request. You will receive a confirmation email once it's approved.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">For any help, call/WhatsApp us at: <br/> <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Booking Request Received - ${data.bookingId}`,
      html,
    });
    console.log("Pending Email sent via Resend ✅");
  } catch (err) {
    console.error("Resend Pending Email error ❌", err);
  }
};

// 📩 2. Booking Confirmation Email (Sent when admin confirms)
export const sendConfirmationEmail = async (data: BookingEmailData) => {
  if (!resend) {
    console.error("RESEND_API_KEY is missing. Could not send email.");
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #28a745; text-align: center;">✅ Booking Confirmed!</h2>
      <p>Hello <b>${data.name}</b>,</p>
      <p>Great news! Your booking with <b>${APP_NAME}</b> has been confirmed. Our driver will be ready for you.</p>
      
      <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c6f6d5; border-left: 4px solid #28a745;">
        <h3 style="margin-top: 0; color: #2f855a;">Trip Details:</h3>
        <p style="margin: 5px 0;"><b>Booking ID:</b> ${data.bookingId}</p>
        <p style="margin: 5px 0;"><b>Route:</b> ${data.route}</p>
        <p style="margin: 5px 0;"><b>Date:</b> ${data.date}</p>
        <p style="margin: 5px 0;"><b>Time:</b> ${data.time}</p>
        <p style="margin: 5px 0;"><b>Fare:</b> ₹${data.price}</p>
      </div>

      <p>Have a peaceful and divine journey in Ujjain. 🙏</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">Emergency Contact: <br/> <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Booking CONFIRMED! - ${data.bookingId}`,
      html,
    });
    console.log("Confirmation Email sent via Resend ✅");
  } catch (err) {
    console.error("Resend Confirmation Email error ❌", err);
  }
};

// Generic function for backward compatibility
export const sendMail = async (to: string, msg: string) => {
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Message from AutoSeva",
      html: msg,
    });
  } catch (err) {
    console.error("Resend Generic Email error", err);
  }
};

// 📩 3. Booking Cancellation Email
export const sendCancellationEmail = async (data: BookingEmailData & { reason: string }) => {
  if (!resend) {
    console.error("RESEND_API_KEY is missing. Could not send email.");
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #dc3545; text-align: center;">❌ Booking Cancelled</h2>
      <p>Hello <b>${data.name}</b>,</p>
      <p>Your booking with <b>${APP_NAME}</b> has been cancelled.</p>
      
      <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #feb2b2; border-left: 4px solid #dc3545;">
        <h3 style="margin-top: 0; color: #c53030;">Cancelled Booking Details:</h3>
        <p style="margin: 5px 0;"><b>Booking ID:</b> ${data.bookingId}</p>
        <p style="margin: 5px 0;"><b>Route:</b> ${data.route}</p>
        <p style="margin: 5px 0;"><b>Date:</b> ${data.date}</p>
        <p style="margin: 5px 0;"><b>Time:</b> ${data.time}</p>
        <p style="margin: 5px 0;"><b>Reason:</b> ${data.reason}</p>
      </div>

      <p>If you did not request this cancellation or have any questions, please contact us immediately.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888; text-align: center;">For any help, call/WhatsApp us at: <br/> <b>${CONTACT_PHONE}</b></p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Booking Cancelled - ${data.bookingId}`,
      html,
    });
    console.log("Cancellation Email sent via Resend ✅");
  } catch (err) {
    console.error("Resend Cancellation Email error ❌", err);
  }
};
