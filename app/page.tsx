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
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    async function fetchFeedbacks() {
      try {
        const res = await fetch("/api/feedback?homepage=true");
        const data = await res.json();
        if (data.success) {
          setFeedbacks(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch feedbacks:", err);
      }
    }
    fetchFeedbacks();
  }, []);

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
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Choose from our wide range of transport services tailored for your needs in Ujjain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card
                key={service.title}
                className="group hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/20 cursor-pointer overflow-hidden"
                onClick={() => router.push(service.link)}
              >
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl ${service.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className={`h-7 w-7 ${service.color}`} />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-base">{service.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-semibold text-primary">
                    Book Now <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 md:py-32">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Why Ride with <br />
                <span className="text-primary">Ujjain AutoSeva?</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                We are committed to providing the safest and most reliable transport service in the city of Mahakal. Experience the difference with our premium fleet and professional service.
              </p>

              <div className="space-y-8">
                {features.map((feature) => (
                  <div key={feature.title} className="flex gap-5">
                    <div className="mt-1 bg-primary/10 p-3 rounded-xl h-fit">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-1">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <Button variant="link" className="p-0 h-auto text-primary font-bold text-lg group" onClick={() => router.push("/about")}>
                  Learn more about our mission <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Stats / Trust Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-card border border-border p-8 rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-4xl md:text-5xl font-bold text-primary mb-2">5k+</h3>
                <p className="font-medium text-muted-foreground">Happy Riders</p>
              </div>
              <div className="bg-card border border-border p-8 rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-2 text-primary">
                  <Users size={40} />
                </div>
                <h3 className="text-xl font-bold mb-1">Expert Team</h3>
                <p className="font-medium text-muted-foreground">Professional Drivers</p>
              </div>
              <div className="bg-card border border-border p-8 rounded-3xl text-center shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-4xl md:text-5xl font-bold text-primary mb-2">4.8</h3>
                <div className="flex justify-center text-orange-500 mb-2 gap-1">
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                  <Star size={18} fill="currentColor" />
                </div>
                <p className="font-medium text-muted-foreground">User Rating</p>
              </div>
              <div className="bg-primary p-8 rounded-3xl text-center text-primary-foreground flex flex-col justify-center items-center shadow-lg shadow-primary/20">
                <PhoneCall className="h-10 w-10 mb-3" />
                <p className="text-lg font-bold">24/7 Support</p>
                <p className="text-primary-foreground/80 text-sm">Always Available</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {feedbacks.length > 0 && (
        <section className="py-24 bg-muted/30 border-t border-border/50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Riders Say</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Real feedback from our customers who trust us for their journeys in Ujjain.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {feedbacks.map((feedback, idx) => (
                <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow bg-card rounded-3xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex text-orange-500 mb-4 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < feedback.rating ? "currentColor" : "none"} stroke={i < feedback.rating ? "none" : "currentColor"} />
                      ))}
                    </div>
                    <p className="text-muted-foreground italic mb-6 leading-relaxed">
                      "{feedback.comment}"
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {feedback.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{feedback.name}</p>
                        <p className="text-xs text-muted-foreground">Recent Rider</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA SECTION */}
      <section className="py-24 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-700 dark:from-blue-900 dark:to-slate-900 -z-10" />

        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-black blur-3xl" />
        </div>

        <div className="container-custom text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Ready to start your journey?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-10 text-xl leading-relaxed">
            Book your taxi now and experience the best travel service in Ujjain.
            Reliable, safe, and just a click away.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Button
              size="lg"
              className="font-bold h-14 px-10 text-lg bg-white text-primary hover:bg-white/90 shadow-xl"
              onClick={() => router.push("/booking")}
            >
              Book Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-bold h-14 px-10 text-lg border-white/30 text-white hover:bg-white/10 hover:text-white bg-transparent"
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
