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
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface Feedback {
  name: string;
  comment: string;
  rating: number;
}

export default function HomePage() {
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
      name: "Rajesh Sharma, Indore",
      comment: "Bahut acchi service thi. Driver polite tha aur Mahakal darshan smoothly ho gaya. Highly recommended for families.",
      rating: 5,
    },
    {
      name: "Sneha Patel, Ahmedabad",
      comment: "Safe and reliable. Raat ko train late thi par unka auto driver station par wait kar raha tha. Truly appreciate the support.",
      rating: 5,
    },
    {
      name: "Amit Kumar, Delhi",
      comment: "Pricing bilkul transparent hai. 5 temples darshan ka package liya tha, sab kuch time par aur aaram se cover ho gaya.",
      rating: 5,
    },
    {
      name: "Priya Desai, Mumbai",
      comment: "Excellent experience! Ujjain ke narrow streets me bhi driver bhaiya ne bahut safely drive kiya. Bhasma aarti timing ke liye perfect pickup.",
      rating: 5,
    },
    {
      name: "Vikram Singh, Jaipur",
      comment: "Pura Ujjain tour book kiya tha, driver ne local spots ke baare me bhi acchi history batai. Ekdum paisa vasool service.",
      rating: 5,
    },
    {
      name: "Rahul Verma, Bhopal",
      comment: "Quick booking on WhatsApp and immediate confirmation. No hassle of bargaining. Best auto service in Mahakal area.",
      rating: 5,
    }
  ];

  const services = [
    {
      title: "Temples Inside City",
      desc: "Mahakal, Harsiddhi & more.",
      icon: MdTempleHindu,
      link: "/booking",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Outside City Temples",
      desc: "Omkareshwar, Indore trips.",
      icon: MapPin,
      link: "/booking",
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
                  className={`border-border/50 hover:border-primary/50 transition-all flex flex-col h-full overflow-hidden group ${idx === 1 ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
                >
                  {idx === 1 && (
                    <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full z-10">BEST SELLER</div>
                  )}
                  <div className="h-48 relative w-full overflow-hidden bg-muted">
                    <Image 
                      src={idx === 0 ? "/logo1.webp" : idx === 1 ? "/5.jpg" : "/12.jpg"} 
                      alt={route.routeName} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
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

      {/* GALLERY SECTION */}
      <section className="py-16 md:py-24 bg-muted/30">
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

      {/* TESTIMONIALS (WhatsApp Chat Style) */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-border/50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Riders Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real feedback from customers who trust us for their spiritual journeys.
            </p>
          </div>
          
          {/* Scrollable Slider on Mobile, Grid on Desktop */}
          <div className="flex overflow-x-auto md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8 snap-x snap-mandatory scrollbar-hide">
            {testimonials.map((feedback, idx) => {
              const nameParts = feedback.name.split(",");
              const personName = nameParts[0]?.trim();
              const city = nameParts[1]?.trim() || "Local Rider";

              return (
                <div key={idx} className="w-[85vw] sm:w-[350px] md:w-auto shrink-0 snap-center flex flex-col items-start">
                  
                  {/* WhatsApp Chat Bubble Style */}
                  <div className="bg-[#E6F4EA] dark:bg-[#005C4B] rounded-2xl rounded-tl-none p-5 shadow-sm relative w-full border border-[#D1E8D5] dark:border-[#004d3e]">
                    
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-emerald-50 text-sm">~ {personName}</span>
                        <div className="flex text-yellow-500 gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill={i < feedback.rating ? "currentColor" : "none"} stroke={i < feedback.rating ? "none" : "currentColor"} />
                          ))}
                        </div>
                      </div>
                      <span className="bg-white/50 dark:bg-black/20 text-slate-600 dark:text-emerald-200/80 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {city}
                      </span>
                    </div>

                    {/* Message Body */}
                    <p className="text-slate-700 dark:text-emerald-100/90 text-[15px] leading-relaxed mt-3">
                      {feedback.comment}
                    </p>

                    {/* Footer Row (Time + Read Ticks) */}
                    <div className="flex justify-end items-center gap-1 mt-3">
                      <span className="text-[10px] text-slate-500 dark:text-emerald-200/50">
                        {10 + (idx % 2)}:{10 + (idx * 7)} AM
                      </span>
                      <CheckCircle size={14} className="text-[#53BDEB]" fill="currentColor" stroke="white" />
                    </div>
                    
                    {/* Tail Decorator (simulated via absolute positioning if needed, skipped for simplicity as rounded-tl-none does the job) */}
                  </div>

                </div>
              );
            })}
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
              onClick={() => router.push("/custom-booking")}
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
