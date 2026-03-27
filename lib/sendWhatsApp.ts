import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

interface Temple {
  _id: string;
  name: string;
  price: number;
}

interface BookingData {
  bookingId: string;
  name: string;
  phone: string;
  route: string;
  time: string;
  date: string;
  price: string;
  temples?: Temple[];
  packageName?: string;
}

export async function sendAdminNotification(booking: BookingData) {
  try {
    const templeList = booking.temples?.map(t => t.name).join(", ") || "No temples selected";
    const packageInfo = booking.packageName || "Custom Booking";
    
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: process.env.ADMIN_WHATSAPP_NUMBER!,
      body: `🚗 New Booking

🆔 Booking ID: ${booking.bookingId}

👤 Name: ${booking.name}
📞 Phone: ${booking.phone}

📦 Package: ${packageInfo}
🏛️ Temples: ${templeList}
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

export async function sendUserConfirmation(booking: BookingData) {
  try {
    const phone = booking.phone.startsWith("+") ? booking.phone : `+91${booking.phone}`;
    const templeList = booking.temples?.map(t => t.name).join(", ") || "";

    let body = `✅ Booking Confirmed!
    
Hi ${booking.name}, your auto booking is confirmed.

🆔 Booking ID: ${booking.bookingId}
📍 Route: ${booking.route}
⏰ Time: ${booking.time}
📅 Date: ${booking.date}
💰 Fare: ₹${booking.price}`;

    if (templeList) {
      body += `\n🏛️ Temples: ${templeList}`;
    }

    body += `\n\nOur driver will be there on time. For any queries, please call us. Have a divine darshan! 🙏`;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: `whatsapp:${phone}`,
      body,
    });

    console.log("User confirmation WhatsApp sent ✅");
  } catch (err) {
    console.log("User WhatsApp error ❌", err);
  }
}

export async function sendCancellationWhatsApp(booking: {
  bookingId: string;
  name: string;
  phone: string;
  route: string;
  date: string;
  time: string;
}) {
  try {
    const phone = booking.phone.startsWith("+") ? booking.phone : `+91${booking.phone}`;

    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER!,
      to: `whatsapp:${phone}`,
      body: `❌ Booking Cancelled

Hi ${booking.name}, your booking has been cancelled.

🆔 Booking ID: ${booking.bookingId}
📍 Route: ${booking.route}
⏰ Time: ${booking.time}
📅 Date: ${booking.date}

If you have any questions, please contact us. 🙏`,
    });

    console.log("Cancellation WhatsApp sent ✅");
  } catch (err) {
    console.log("Cancellation WhatsApp error ❌", err);
  }
}
