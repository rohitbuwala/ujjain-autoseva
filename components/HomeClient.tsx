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
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomeClient() {
  const router = useRouter();
  const [routes, setRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await fetch("/api/routes");
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          setRoutes(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch routes", err);
      } finally {
        setLoadingRoutes(false);
      }
    }
    fetchRoutes();
  }, []);

  const testimonials = [
    {
      name: "Rajesh Sharma",
      comment: "Very smooth Mahakal darshan experience. Driver was polite and the auto was clean.",
      rating: 4,
    },
    {
      name: "Sneha Patel",
      comment: "Driver was polite and on time. Best way to explore Ujjain temples without any hassle.",
      rating: 3,
    },
    {
      name: "Amit Kumar",
      comment: "Best service in Ujjain. Transparent pricing and very reliable for early morning Bhasma Aarti.",
      rating: 3,
    }
  ];

  const services = [
    {
      title: "Temples Inside City",
      desc: "Mahakal, Harsiddhi & more.",
      icon: MdTempleHindu,
      link: "/custom-booking",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Outside City Temples",
      desc: "iskcon temple",
      icon: MapPin,
      link: "/custom-booking",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Custom Trip",
      desc: "Select your own temples.",
      icon: Car,
      link: "/custom-booking",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
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
    <div className="flex flex-col min-h-screen relative pb-24 md:pb-0 overflow-x-hidden">
      
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

      {/* POPULAR PACKAGES */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Popular Darshan Packages</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Affordable and comfortable auto packages for your Ujjain timeline.
            </p>
          </div>

          {loadingRoutes ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <div className="h-48 bg-muted" />
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No packages available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {routes.slice(0, 3).map((route, idx) => (
                <Card 
                  key={route._id || idx} 
                  className="border-border/50 hover:border-primary/50 transition-all flex flex-col h-full overflow-hidden group"
                >
                  <div className="h-48 relative w-full overflow-hidden bg-muted">
                    <Image 
                      src={idx === 0 ? "/logo1.webp" : idx === 1 ? "/5.jpg" : "/12.jpg"} 
                      alt={route.routeName} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">{route.routeName}</CardTitle>
                    <CardDescription className="text-lg text-primary font-bold">
                      {route.templeList?.length || 0} Temples • {route.category === 'outside' ? 'Full Day' : 'Half Day'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-2 text-muted-foreground">
                      {route.templeList?.slice(0, 3).map((t: any, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> 
                          {t.name}
                        </li>
                      ))}
                      {route.templeList?.length > 3 && (
                        <li className="text-sm text-muted-foreground">+{route.templeList.length - 3} more temples</li>
                      )}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary">₹{route.totalPrice}</span>
                      <span className="text-sm text-muted-foreground line-through">₹{Math.round(route.totalPrice * 1.3)}</span>
                    </div>
                    <Button 
                      className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90" 
                      size="lg" 
                      onClick={() => router.push(`/booking?route=${route._id}`)}
                    >
                      Book Now
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
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

      {/* TESTIMONIALS SECTION - Trusted by Devotees */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 font-serif italic">Trusted by Devotees</h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-6"></div>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We take pride in serving Mahakal devotees with devotion and care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-none shadow-lg hover:shadow-xl transition-shadow bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden group">
                <CardContent className="pt-8 relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <MessageSquare size={80} className="text-primary" />
                  </div>
                  <div className="flex mb-4 text-orange-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={18} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-lg mb-6 leading-relaxed italic">&ldquo;{t.comment}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">Devotee</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Glimpses of Ujjain</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Explore the divine beauty of Ujjain and our well-maintained auto fleet.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="relative aspect-[3/4] md:aspect-square rounded-xl md:rounded-2xl overflow-hidden group col-span-2 md:col-span-1">
              <Image 
                src="/m.jpg" 
                alt="Mahakaleshwar Temple" 
                fill 
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500" 
                loading="lazy"
              />
            </div>
            <div className="relative aspect-square md:aspect-auto md:row-span-2 rounded-xl md:rounded-2xl overflow-hidden group col-span-2 md:col-span-2">
              <Image 
                src="/a.jpg" 
                alt="Ujjain City Auto Ride" 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500" 
                loading="lazy"
              />
            </div>
            <div className="relative aspect-[3/4] md:aspect-square rounded-xl md:rounded-2xl overflow-hidden group col-span-2 md:col-span-1">
              <Image 
                src="/k.jpg" 
                alt="Kaal Bhairav Temple" 
                fill 
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500" 
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

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
