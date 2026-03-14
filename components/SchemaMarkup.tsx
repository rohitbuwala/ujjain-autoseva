"use client";

import Script from "next/script";

interface SchemaMarkupProps {
  schemaType: "LocalBusiness" | "FAQPage" | "Article" | "WebSite";
  data: any;
}

export default function SchemaMarkup({ schemaType, data }: SchemaMarkupProps) {
  const defaultLocalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Ujjain Auto Seva",
    "image": "https://ujjain-autoseva.vercel.app/logo.png",
    "@id": "https://ujjain-autoseva.vercel.app",
    "url": "https://ujjain-autoseva.vercel.app",
    "telephone": "+919876543210",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Mahakal Temple Road",
      "addressLocality": "Ujjain",
      "postalCode": "456001",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 23.1827,
      "longitude": 75.7682
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "sameAs": [
      "https://www.facebook.com/ujjainautoseva",
      "https://www.instagram.com/ujjainautoseva"
    ]
  };

  const schemaData = data || (schemaType === "LocalBusiness" ? defaultLocalBusinessSchema : {});

  return (
    <Script
      id={`schema-${schemaType}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData),
      }}
    />
  );
}
