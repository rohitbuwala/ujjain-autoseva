import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import SchemaMarkup from "@/components/SchemaMarkup";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mahakal Darshan & Ujjain Temple Tour | Trusted Auto Service",
  description: "Book your Ujjain auto service for Mahakal Darshan and city tours. Verified drivers, transparent pricing, and 24/7 support for your spiritual journey.",
  keywords: SITE_CONFIG.keywords,

  verification: {
    google: "HRcAf8U2ybq-tWuFHhb2cVtqllanR-dapDC0Cdj44Vg",
  },

  openGraph: {
    title: "Ujjain Auto Seva - Trusted Mahakal Darshan Rides",
    description: "Experience hassle-free temple tours in Ujjain with our reliable auto service. Book now for a smooth spiritual journey.",
    images: ["/maha.jpg"],
  }
};

export default function HomePage() {
  return (
    <>
      <SchemaMarkup 
        schemaType="LocalBusiness" 
        data={{
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": SITE_CONFIG.name,
          "description": "Premium auto taxi service in Ujjain for Mahakal Darshan and Temple Tours.",
          "url": SITE_CONFIG.url,
          "telephone": "+916263189202",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Mahakal Temple Road",
            "addressLocality": "Ujjain",
            "addressRegion": "MP",
            "postalCode": "456010",
            "addressCountry": "IN"
          }
        }} 
      />
      <HomeClient />
    </>
  );
}
