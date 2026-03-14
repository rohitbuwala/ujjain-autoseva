import { Metadata } from "next";
import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Ujjain Auto Seva",
  description: "Affordable and transparent pricing for Ujjain auto services, Mahakal darshan, and outstation trips.",
};

export default function PricingPage() {
  const packages = [
    {
      name: "Mahakal Drop",
      price: "₹150",
      description: "One-way drop to Mahakaleshwar",
      features: ["Instant booking", "Direct drop", "No hidden charges"],
    },
    {
      name: "5 Temples Half-Day",
      price: "₹600",
      description: "4-5 hours typical duration",
      features: ["Mahakaleshwar", "Kaal Bhairav", "Harsiddhi", "Ram Ghat", "Mangalnath", "Wait time included"],
      popular: true,
    },
    {
      name: "Full Ujjain Day Tour",
      price: "₹1200",
      description: "8-10 hours guided journey",
      features: ["All major temples", "Local sightseeing", "Knowledgeable driver", "Hotel pickup & drop"],
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the best plan for your spiritual journey in Ujjain. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg, idx) => (
            <Card key={idx} className={`relative flex flex-col ${pkg.popular ? "border-primary shadow-lg scale-105 z-10" : "border-border/50"}`}>
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider">
                  MOST POPULAR
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <CardDescription className="mt-2">{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow text-center pt-4">
                <div className="mb-6">
                  <span className="text-5xl font-extrabold text-foreground">{pkg.price}</span>
                  {idx !== 0 && <span className="text-muted-foreground">/trip</span>}
                </div>
                <ul className="mb-8 space-y-3 text-left">
                  {pkg.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button asChild size="lg" className="w-full font-bold" variant={pkg.popular ? "default" : "outline"}>
                    <Link href="/booking">Book Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
