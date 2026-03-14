"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock, MapPin } from "lucide-react";
import ServiceSkeleton from "@/components/ServiceSkeleton";
import Link from "next/link";

interface Service {
  _id?: string;
  route?: string;
  from?: string;
  to?: string;
  price: number;
  category?: string;
  time?: string;
}

interface ServiceCardProps {
  id: string;
  route: string;
  time: string;
  price: string;
  originalPrice: string;
  saveAmount: string;
  router: ReturnType<typeof useRouter>;
}

function ServiceCard({
  id,
  route,
  time,
  price,
  originalPrice,
  saveAmount,
  router,
}: ServiceCardProps) {
  return (
    <Card className="flex flex-col h-full border-border/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-lg lg:text-xl leading-tight line-clamp-2">
            {route}
          </CardTitle>
          <div className="bg-green-500/10 text-green-600 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">
            {saveAmount}
          </div>
        </div>
        <CardDescription className="flex items-center gap-1 mt-1">
          <Clock size={14} />
          {time}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        <div className="flex items-end gap-2 mb-5">
          <span className="text-2xl font-bold text-primary">{price}</span>
          <span className="text-sm text-muted-foreground line-through">
            {originalPrice}
          </span>
        </div>
        <Button
          className="w-full font-semibold h-11 rounded-lg transition hover:scale-[1.02]"
          onClick={() => router.push(`/booking?route=${id}`)}
        >
          Book Ride →
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ServicesClient() {
  const router = useRouter();
  const [dbServices, setDbServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        const services = data.data || data;
        if (Array.isArray(services)) {
          setDbServices(services);
        }
      } catch (err) {
        console.error("Service Load Error:", err);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    }
    loadServices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pb-24">
      <div className="py-14 text-center border-b bg-muted/20">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Our Services 
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mt-2">
          Choose trusted temple rides & city packages with best pricing.
        </p>
      </div>

      <div className="container-custom py-12 space-y-20">
        <Link href="/custom-booking">
          <div className="group cursor-pointer rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6 md:p-8 hover:shadow-2xl hover:scale-[1.02] transition">
            <div className="flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition">
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold">
                    Custom Temple Trip
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Choose temples yourself & get instant price
                  </p>
                </div>
              </div>
              <div className="bg-primary text-white px-6 py-3 rounded-xl font-semibold">
                Plan Trip →
              </div>
            </div>
          </div>
        </Link>

        <section>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-3xl font-bold">Temples Inside City</h2>
          </div>
          {loading ? (
            <ServiceSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {dbServices
                .filter((s) => s.category === "inside")
                .map((s, i) => {
                  const price = s.price;
                  const originalPrice = Math.round(price * 1.3);
                  const saveAmount = originalPrice - price;
                  return (
                    <ServiceCard
                      key={s._id || i}
                      id={s._id || ""}
                      route={s.route || `${s.from} to ${s.to}`}
                      time={s.time || "2-3 Hours"}
                      price={`₹${price}`}
                      originalPrice={`₹${originalPrice}`}
                      saveAmount={`Save ₹${saveAmount}`}
                      router={router}
                    />
                  );
                })}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-8 w-1 bg-secondary rounded-full" />
            <h2 className="text-3xl font-bold">Outside City Temples</h2>
          </div>
          {loading ? (
            <ServiceSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {dbServices
                .filter((s) => s.category === "outside")
                .map((s, i) => {
                  const price = s.price;
                  const originalPrice = Math.round(price * 1.25);
                  const saveAmount = originalPrice - price;
                  return (
                    <ServiceCard
                      key={s._id || i}
                      id={s._id || ""}
                      route={s.route || `${s.from} to ${s.to}`}
                      time={s.time || "Full Day"}
                      price={`₹${price}`}
                      originalPrice={`₹${originalPrice}`}
                      saveAmount={`Save ₹${saveAmount}`}
                      router={router}
                    />
                  );
                })}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Trusted Operators</h2>
          <Card className="shadow-md">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-border divide-y sm:divide-y-0 sm:divide-x">
                {[
                  "Royal Travels",
                  "Hans Travels",
                  "Balaji Bus",
                  "Annapurna",
                  "Star Travels",
                  "Kabra Express",
                  "Veer Travels",
                  "Gajraj Tours",
                ].map((op, i) => (
                  <div
                    key={i}
                    className="p-4 flex justify-between items-center hover:bg-muted/50 transition"
                  >
                    <span className="font-medium">{op}</span>
                    <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                      Verified
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">FAQ</h2>
          <Accordion type="single" collapsible>
            <AccordionItem value="1">
              <AccordionTrigger>How do I book?</AccordionTrigger>
              <AccordionContent>
                Choose service → click Book Ride → fill details → done.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Advance payment?</AccordionTrigger>
              <AccordionContent>
                Mostly pay after ride. Outstation may need token.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Drivers verified?</AccordionTrigger>
              <AccordionContent>
                Yes, all drivers background verified.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
    </div>
  );
}
