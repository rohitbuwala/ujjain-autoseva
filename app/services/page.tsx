import { Metadata } from "next";
import ServicesClient from "@/components/ServicesClient";
import SchemaMarkup from "@/components/SchemaMarkup";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Ujjain Auto Services | Temple Darshan & City Tour Packages",
  description: "Explore our Ujjain auto taxi services. We offer Mahakal Darshan, 5 Temple Tours, and outstation trips to Omkareshwar with transparent pricing.",
  keywords: [
    "Ujjain auto services",
    "Mahakal Darshan auto",
    "Ujjain temple tour package",
    "Omkareshwar trip from Ujjain",
    "Ujjain city tour by auto"
  ]
};

export default function ServicesPage() {
  return (
    <>
      <SchemaMarkup 
        schemaType="LocalBusiness" 
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Auto Taxi Service",
          "provider": {
            "@type": "LocalBusiness",
            "name": SITE_CONFIG.name
          },
          "areaServed": {
            "@type": "City",
            "name": "Ujjain"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Ujjain Temple Tour Services",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Inside City Temple Tour"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Outside City (Omkareshwar) Tour"
                }
              }
            ]
          }
        }} 
      />
      <ServicesClient />
    </>
  );
}
