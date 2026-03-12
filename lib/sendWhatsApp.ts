import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

interface BookingData {
  bookingId: string;
  name: string;
  phone: string;
  route: string;
  time: string;
  date: string;
  price: string;
}

export async function sendAdminNotification(booking: BookingData) {
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: process.env.ADMIN_WHATSAPP_NUMBER!,
      body: `🚗 New Booking

🆔 Booking ID: ${booking.bookingId}

👤 Name: ${booking.name}
📞 Phone: ${booking.phone}

📍 Route: ${booking.route}
⏰ Time: ${booking.time}
📅 Date: ${booking.date}

💰 Price: ₹${booking.price}`,
    });

    console.log("WhatsApp sent ✅");
  } catch (err) {
    console.log("WhatsApp error ❌", err);
  }
}