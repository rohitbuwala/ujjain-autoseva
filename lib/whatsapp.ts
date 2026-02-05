import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);

export async function sendWhatsApp(
  to: string,
  message: string
) {
  return client.messages.create({
    from: process.env.TWILIO_WHATSAPP,
    to,
    body: message,
  });
}
