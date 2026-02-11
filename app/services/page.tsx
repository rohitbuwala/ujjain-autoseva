"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock, MapPin, Loader2 } from "lucide-react";


function ServiceCard({ route, time, price, originalPrice, saveAmount, router }: any) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/60">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg lg:text-xl line-clamp-2 leading-tight">{route}</CardTitle>
          <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
            {saveAmount}
          </div>
        </div>
        <CardDescription className="flex items-center gap-1">
          <Clock size={14} />
          {time}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto pt-0">
        <div className="flex items-end gap-2 mb-4">
          <span className="text-2xl font-bold text-primary">{price}</span>
          <span className="text-sm text-muted-foreground line-through mb-1 decoration-destructive/40">
            {originalPrice}
          </span>
        </div>
        <Button
          className="w-full font-semibold"
          onClick={() => router.push("/booking")}
        >
          Book Ride
        </Button>
      </CardContent>
    </Card>
  );
}

function ServiceSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="h-[200px] animate-pulse bg-muted" />
      ))}
    </div>
  );
}

export default function ServicesPage() {
  const router = useRouter();
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        if (Array.isArray(data)) setDbServices(data);
      } catch (err) {
        console.error("Service Load Error:", err);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    }
    loadServices();
  }, []);

  return (
    <div className="min-h-screen pb-20">

      {/* Header */}
      <div className="bg-muted/30 py-8 md:py-12">
        <div className="container-custom text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Our Services</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our wide range of taxi and darshan packages tailored for your comfort and budget.
          </p>
        </div>
      </div>

      <div className="container-custom py-12 space-y-16">


        {/* Inside City */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold">Temples Inside City</h2>
          </div>

          {loading ? (
            <ServiceSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dbServices
                .filter(s => s.category === "inside")
                .map((s, i) => {
                  // Dynamic Discount Logic
                  const price = s.price;
                  // Add ~25-30% markup for original price to show discount
                  const originalPrice = Math.round(price * 1.3);
                  const saveAmount = originalPrice - price;

                  return (
                    <ServiceCard
                      key={s._id || i}
                      route={s.route || s.from + " to " + s.to}
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

        {/* Outside City */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-1 bg-secondary rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold">Outside City Temples</h2>
          </div>

          {loading ? (
            <ServiceSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dbServices
                .filter(s => s.category === "outside")
                .map((s, i) => {
                  const price = s.price;
                  const originalPrice = Math.round(price * 1.25);
                  const saveAmount = originalPrice - price;

                  return (
                    <ServiceCard
                      key={s._id || i}
                      route={s.route || s.from + " to " + s.to}
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

        {/* Operators */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Trusted Operators</h2>
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {[
                  "Royal Travels", "Hans Travels", "Balaji Bus", "Annapurna",
                  "Star Travels", "Kabra Express", "Veer Travels", "Gajraj Tours"
                ].map((op, i) => (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
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

        {/* FAQ */}
        <section className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I book a ride?</AccordionTrigger>
              <AccordionContent>
                Simply choose your service from the list above and click "Book Ride", or go to the Booking page directly. You can also call our support number.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is there any advance payment?</AccordionTrigger>
              <AccordionContent>
                For most city rides, you can pay after the trip. For outstation or packages, a small token amount might be required.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Are the drivers verified?</AccordionTrigger>
              <AccordionContent>
                Yes, all our drivers are background verified and trained for professional conduct.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </div>
    </div>
  );
}
