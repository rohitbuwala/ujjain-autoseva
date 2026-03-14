"use client";

import { MessageCircle, Phone } from "lucide-react";

export default function FloatingContact() {
  const phoneNumber = "+919876543210"; // Placeholder phone
  const whatsappMessage = "Hello, I am interested in booking an auto in Ujjain.";
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Phone Button */}
      <a
        href={`tel:${phoneNumber}`}
        className="bg-primary text-white p-3 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all flex items-center justify-center"
        aria-label="Call Ujjain Auto Seva"
      >
        <Phone className="w-6 h-6" />
      </a>

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${phoneNumber.replace("+", "")}?text=${encodeURIComponent(whatsappMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition-all flex items-center justify-center"
        aria-label="WhatsApp Ujjain Auto Seva"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
}
