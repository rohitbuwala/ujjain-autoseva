import twilio from "twilio";

const hasTwilioCreds =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

const client = hasTwilioCreds
  ? twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  : null;

if (!hasTwilioCreds) {
  console.warn("⚠️ Twilio credentials missing — WhatsApp messages disabled");
}

function formatWhatsAppNumber(phone?: string) {
  if (!phone) return "";

  const trimmed = phone.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  if (trimmed.startsWith("+")) return `whatsapp:${trimmed}`;

  return `whatsapp:+91${trimmed.replace(/\D/g, "")}`;
}

const twilioWhatsAppFrom = formatWhatsAppNumber(process.env.TWILIO_WHATSAPP_NUMBER);
const adminWhatsAppTo = formatWhatsAppNumber(process.env.ADMIN_WHATSAPP_NUMBER);

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
  if (!client || !twilioWhatsAppFrom || !adminWhatsAppTo) {
    console.warn("⚠️ WhatsApp disabled: no Twilio client");
    return;
  }

  try {
    const templeList = booking.temples?.map(t => t.name).join(", ") || "No temples selected";
    const packageInfo = booking.packageName || "Custom Booking";
    
    await client.messages.create({
      from: twilioWhatsAppFrom,
      to: adminWhatsAppTo,
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

    console.log("Admin WhatsApp sent ✅");
  } catch (err) {
    console.error("Admin WhatsApp error ❌ — Check: (1) Are recipient numbers opted into Twilio Sandbox? (2) Are credentials correct?", err);
  }
}

export async function sendUserConfirmation(booking: BookingData) {
  if (!client || !twilioWhatsAppFrom) {
    console.warn("⚠️ WhatsApp disabled: no Twilio client");
    return;
  }

  try {
    const phone = formatWhatsAppNumber(booking.phone);
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
      from: twilioWhatsAppFrom,
      to: phone,
      body,
    });

    console.log("User confirmation WhatsApp sent ✅");
  } catch (err) {
    console.error("User WhatsApp error ❌ — Check: Is the user's number opted into Twilio Sandbox?", err);
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
  if (!client || !twilioWhatsAppFrom) {
    console.warn("⚠️ WhatsApp disabled: no Twilio client");
    return;
  }

  try {
    const phone = formatWhatsAppNumber(booking.phone);

    await client.messages.create({
      from: twilioWhatsAppFrom,
      to: phone,
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
    console.error("Cancellation WhatsApp error ❌", err);
  }
}
