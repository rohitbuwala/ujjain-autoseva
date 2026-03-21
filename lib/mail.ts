import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const APP_NAME = "Ujjain AutoSeva";
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
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
      <h2 style="color: #ff8c00; text-align: center;">🙏 Jay Shri Mahakal!</h2>
      <p>Hello <b>${data.name}</b>,</p>
      <p>Thank you for choosing <b>${APP_NAME}</b>. We have received your booking request.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Booking Details:</h3>
        <p><b>Booking ID:</b> ${data.bookingId}</p>
        <p><b>Route:</b> ${data.route}</p>
        <p><b>Date:</b> ${data.date}</p>
        <p><b>Time:</b> ${data.time}</p>
        <p><b>Fare:</b> ₹${data.price}</p>
      </div>

      <p style="color: #666;">Status: <span style="color: #ff8c00; font-weight: bold;">PENDING</span></p>
      <p>Our admin team is reviewing your request. You will receive a confirmation email once it's approved.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">For any help, call/WhatsApp us at: ${CONTACT_PHONE}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.MAIL_USER}>`,
      to: data.email,
      subject: `Booking Request Received - ${data.bookingId}`,
      html,
    });
    console.log("Pending Email sent ✅");
  } catch (err) {
    console.error("Mail error ❌", err);
  }
};

// 📩 2. Booking Confirmation Email (Sent when admin confirms)
export const sendConfirmationEmail = async (data: BookingEmailData) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
      <h2 style="color: #28a745; text-align: center;">✅ Booking Confirmed!</h2>
      <p>Hello <b>${data.name}</b>,</p>
      <p>Great news! Your booking with <b>${APP_NAME}</b> has been confirmed. Our driver will be ready for you.</p>
      
      <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #c6f6d5;">
        <h3 style="margin-top: 0; color: #2f855a;">Trip Details:</h3>
        <p><b>Booking ID:</b> ${data.bookingId}</p>
        <p><b>Route:</b> ${data.route}</p>
        <p><b>Date:</b> ${data.date}</p>
        <p><b>Time:</b> ${data.time}</p>
        <p><b>Fare:</b> ₹${data.price}</p>
      </div>

      <p>Have a peaceful and divine journey in Ujjain. 🙏</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">Emergency Contact: ${CONTACT_PHONE}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.MAIL_USER}>`,
      to: data.email,
      subject: `Booking CONFIRMED! - ${data.bookingId}`,
      html,
    });
    console.log("Confirmation Email sent ✅");
  } catch (err) {
    console.error("Mail error ❌", err);
  }
};

// Original generic function kept for backward compatibility if needed
export const sendMail = async (to: string, msg: string) => {
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${process.env.MAIL_USER}>`,
      to,
      subject: "Message from AutoSeva",
      html: msg,
    });
  } catch (err) {
    console.error("SendMail error", err);
  }
};
