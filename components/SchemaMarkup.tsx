"use client";

import Script from "next/script";

interface SchemaMarkupProps {
  schemaType: "LocalBusiness" | "FAQPage" | "Article" | "WebSite";
  data?: Record<string, unknown>;
}

export default function SchemaMarkup({ schemaType, data }: SchemaMarkupProps) {
  const defaultLocalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Ujjain Auto Seva",
    "image": "https://ujjain-autoseva.in/logo.png",
    "@id": "https://ujjain-autoseva.in",
    "url": "https://ujjain-autoseva.in",
    "telephone": "+916263189202",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Mahakal Temple Road",
      "addressLocality": "Ujjain",
      "postalCode": "456010",
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
