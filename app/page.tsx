"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Hero from "@/components/Hero";
import { MdTempleHindu } from "react-icons/md";
import {
  Car,
  MapPin,
  ShieldCheck,
  Clock,
  IndianRupee,
  PhoneCall,
  ArrowRight,
  Star,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  const services = [
    {
      title: "City Taxi",
      desc: "Fast & affordable city rides.",
      icon: Car,
      link: "/booking",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Temple Darshan",
      desc: "Mahakal & Omkareshwar trips.",
      icon: MdTempleHindu,
      link: "/packages",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Outstation",
      desc: "Round trips to nearby cities.",
      icon: MapPin,
      link: "/booking?type=outstation",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  const features = [
    {
      title: "Verified Drivers",
      desc: "Background checked and trained professionals.",
      icon: ShieldCheck,
    },
    {
      title: "Transparent Pricing",
      desc: "No hidden charges. Pay what you see.",
      icon: IndianRupee,
    },
    {
      title: "24/7 Support",
      desc: "Always here to help you during your journey.",
      icon: Clock,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">

      {/* HERO SECTION */}
      <Hero />

      {/* QUICK ACTIONS / SERVICES */}
      <section className="py-16 bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from our wide range of transport services tailored for your needs in Ujjain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.title}
                className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 cursor-pointer"
                onClick={() => router.push(service.link)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${service.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <CardTitle>{service.title}</CardTitle>
                  <CardDescription>{service.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Book Now <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Ride with <br />
                <span className="text-primary">Ujjain AutoSeva?</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                We are committed to providing the safest and most reliable transport service in the city of Mahakal.
              </p>

              <div className="space-y-6">
                {features.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats / Trust Box */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-6 rounded-2xl text-center">
                <h3 className="text-4xl font-bold text-primary mb-2">5k+</h3>
                <p className="text-sm font-medium text-muted-foreground">Happy Riders</p>
              </div>
              <div className="bg-muted p-6 rounded-2xl text-center">
                <h3 className="text-4xl font-bold text-primary mb-2">500+</h3>
                <p className="text-sm font-medium text-muted-foreground">Drivers</p>
              </div>
              <div className="bg-muted p-6 rounded-2xl text-center">
                <h3 className="text-4xl font-bold text-primary mb-2">4.8</h3>
                <div className="flex justify-center text-orange-500 mb-1">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Rating</p>
              </div>
              <div className="bg-primary p-6 rounded-2xl text-center text-primary-foreground flex flex-col justify-center items-center">
                <PhoneCall className="h-8 w-8 mb-2" />
                <p className="text-sm font-bold">24/7 Support</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start your journey?</h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-lg">
            Book your taxi now and experience the best travel service in Ujjain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="font-semibold h-12 px-8"
              onClick={() => router.push("/booking")}
            >
              Book Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary h-12 px-8"
              onClick={() => router.push("/contact")}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
