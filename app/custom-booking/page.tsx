import { Metadata } from "next";
import CustomBookingClient from "@/components/CustomBookingClient";
import SchemaMarkup from "@/components/SchemaMarkup";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Custom Temple Trip Booking | Plan Your Ujjain Darshan",
  description: "Create your own Ujjain temple tour. Select your preferred temples, get instant auto taxi pricing, and book online for a personalized spiritual experience.",
  keywords: [
    "custom Ujjain tour",
    "plan Mahakal darshan",
    "Ujjain temple trip planner",
    "personalized Ujjain auto tour"
  ]
};

export default function CustomBookingPage() {
  return (
    <>
      <SchemaMarkup 
        schemaType="LocalBusiness" 
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Custom Temple Tour Planning",
          "provider": {
            "@type": "LocalBusiness",
            "name": SITE_CONFIG.name
          },
          "offers": {
            "@type": "Offer",
            "description": "Customizable auto tour based on temple selection."
          }
        }} 
      />
      <CustomBookingClient />
    </>
  );
}
