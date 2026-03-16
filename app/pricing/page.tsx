import { Metadata } from "next";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import SchemaMarkup from "@/components/SchemaMarkup";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Transparent Pricing | Ujjain Auto Taxi & Temple Tour Rates",
  description: "Check our affordable and transparent pricing for Ujjain auto services. No hidden charges for Mahakal Darshan, city tours, or station pickups.",
  keywords: ["Ujjain auto fare", "Mahakal darshan cost", "Ujjain taxi rates", "temple tour pricing Ujjain"],
  openGraph: {
    title: "Affordable Ujjain Auto & Temple Tour Pricing",
    description: "Get the best rates for auto services in Ujjain. Simple, honest, and transparent pricing for all devotees.",
  }
};

const FIVE_TEMPLE_DARSHAN_TEMPLES = [
  "Sandipani ashram",
  "Mangalnath mandir",
  "Kaal Bhairav",
  "Gadkalika mandir",
  "Ishthirman ganesh mandir"
];

const packages = [
  {
    name: "Mahakal + City Tour",
    tag: "Best for Families",
    price: "₹850",
    description: "Perfect for a quick spiritual visit",
    features: [
      "Rinmukteshwar mahadev",
      "Chintaman ganesh",
      "ashtavinayak mandir",
      "navgrah shani mandir",
      "Iskcon mandir",
      "Pickup & drop",
    ],
    popular: false,
    link: "/custom-booking",
  },
  {
    name: "5 Temple Darshan",
    tag: "Recommended",
    price: "₹650",
    description: "Comfortable Half-Day Tour",
    features: FIVE_TEMPLE_DARSHAN_TEMPLES,
    popular: true,
    link: "/custom-booking?package=five",
  },
  {
    name: "Custom Selection",
    tag: "Most Flexible",
    price: "Custom",
    description: "Select temples & get instant price",
    features: [
      "Temple-based pricing",
      "Flexible itinerary",
      "Experienced driver",
      "Hotel pickup & drop",
    ],
    link: "/custom-booking?package=custom",
  },
];

export default function PricingPage() {
  return (
    <>
      <SchemaMarkup 
        schemaType="LocalBusiness" 
        data={{
          "@context": "https://schema.org",
          "@type": "PriceSpecification",
          "name": "Ujjain Auto Tour Pricing",
          "priceCurrency": "INR",
          "minPrice": "400",
          "description": "Starting from ₹400 for city tours."
        }} 
      />
      <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the best plan for your spiritual journey in Ujjain. No hidden fees.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {packages.map((pkg, idx) => (
            <Card
              key={idx}
              className={`relative flex flex-col transition-all duration-300 hover:shadow-2xl h-full border-2 ${
                pkg.popular ? "border-primary shadow-xl scale-[1.02]" : "border-border/60"
              }`}
            >
              {/* Tag */}
              {pkg.tag && (
                <div
                  className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest whitespace-nowrap z-10 ${
                    pkg.popular
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {pkg.tag.toUpperCase()}
                </div>
              )}

              {/* Header */}
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                <CardDescription className="mt-2 text-sm">{pkg.description}</CardDescription>
              </CardHeader>

              {/* Body */}
              <CardContent className="flex flex-col flex-grow text-center pt-2">
                {/* Price */}
                <div className="mb-8">
                  <span className="text-5xl font-black text-foreground">
                    {pkg.price}
                  </span>
                  {pkg.price.startsWith("₹") && (
                    <span className="text-muted-foreground text-sm font-medium ml-1">/trip</span>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-10 flex-grow space-y-4 text-left px-4">
                  {pkg.features.map((feature: string, fIdx: number) => (
                    <li key={fIdx} className="flex items-center gap-3">
                      <div className="shrink-0 w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <div className="mt-auto">
                  <Button
                    asChild
                    size="lg"
                    className={`w-full h-14 font-bold text-lg rounded-xl transition-all ${
                      pkg.popular ? "shadow-lg shadow-primary/25 hover:scale-[1.02]" : ""
                    }`}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    <Link href={pkg.link}>Book Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
