"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ================================
   BOOKING FUNCTION
================================ */

async function bookRide(
      router: any,
      route: string,
      time: string, 
      price: string) {

  const [from, to] = route.split(" to ");

  const res = await fetch("/api/booking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({

      from: from || "Ujjain",
      to: to || "Destination",

      date: new Date().toISOString().split("T")[0],

      phone: "9999999999",   // TEMP FIX ✅

      price: price.replace("₹", ""),
    }),
  });

  if (res.status === 401) {
    router.push("/login");
    return;
  }

  if (res.ok) {
    alert("✅ Booking Sent. Waiting for Admin");
  } else {
    alert("❌ Booking Failed");
  }
}


/* ================================
   SERVICE CARD
================================ */

function ServiceCard({
  route,
  time,
  price,
  router,
}: any) {
  const base = Number(price.replace("₹", ""));
  const fake = base + 150;

  return (
    <div className="card-safe p-4 flex flex-col justify-between">

      {/* Info */}
      <div className="space-y-1">

        <h3 className="font-semibold text-base sm:text-lg">
          {route}
        </h3>

        <p className="text-xs sm:text-sm text-gray-300">
          ⏱ {time}
        </p>

        <div className="flex items-center gap-2 flex-wrap">

          <span className="line-through text-gray-400 text-xs">
            ₹{fake}
          </span>

          <span className="text-green-400 font-bold text-sm">
            {price}
          </span>

          <span className="text-[10px] bg-red-600 px-2 py-[2px] rounded">
            SAVE ₹150
          </span>

        </div>

      </div>

      {/* Button */}
      <button
      onClick={() => router.push("/booking")}

        className="
          mt-3 w-full
          bg-green-600
          hover:bg-green-700
          active:scale-95
          py-2
          rounded-lg
          text-sm
          font-semibold
          transition
        "
      >
        Book Ride
      </button>

    </div>
  );
}

/* ================================
   PAGE
================================ */

export default function ServicesPage() {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-gradient-to-br from-black via-blue-950 to-purple-950 text-white">

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">

        {/* INTRO */}
        <Card className="card-safe">

          <CardContent className="p-6 text-center space-y-3">

            <h1 className="text-3xl font-extrabold gradient-text-1">
              Our Services
            </h1>

            <p className="text-gray-300">
              Reliable taxi & auto booking in Ujjain
            </p>

            <p className="text-gray-400">
              Safe drivers • Verified vehicles • Best prices
            </p>

          </CardContent>

        </Card>

        {/* ================= CITY TEMPLES ================= */}

        <section className="space-y-6">

          <h2 className="text-3xl gradient-text font-bold">
            🛺 Temples Inside City
          </h2>

          <div className="
            grid gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          ">

            {[
              ["Station to Mahakal", "01h 30m", "₹400"],
              ["Station to Bada Ganesh", "1h 30m", "₹300"],
              ["Station to Harshiddhi", "1h 30m", "₹400"],
              ["Station to Vikramaditya", "30m", "₹350"],
              ["Station to Ramghat", "1h 30m", "₹300"],
              ["Station to Shree Ram", "1h 30m", "₹400"],
            ].map((item, i) => (

              <ServiceCard
                key={i}
                route={item[0]}
                time={item[1]}
                price={item[2]}
                router={router}
              />

            ))}

          </div>

        </section>

        {/* ================= OUTSIDE CITY ================= */}

        <section className="space-y-6">

          <h2 className="text-3xl gradient-text font-bold">
            🚖 Outside City Temples
          </h2>

          <div className="
            grid gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          ">

            {[
              ["Mahakal to Sandipani", "01h 30m", "₹700"],
              ["Mahakal to Mangalnath", "2h 10m", "₹500"],
              ["Mahakal to Siddhavar", "1h 00m", "₹300"],
              ["Mahakal to Kaal Bhairav", "01h 30m", "₹700"],
              ["Mahakal to Gadh Kalika", "1h 00m", "₹300"],
              ["Mahakal to Bharthari", "1h 00m", "₹300"],
            ].map((item, i) => (

              <ServiceCard
                key={i}
                route={item[0]}
                time={item[1]}
                price={item[2]}
                router={router}
              />

            ))}

          </div>

        </section>

        {/* ================= OPERATORS ================= */}

        <section>

          <h2 className="text-3xl mb-6 gradient-text">
            🏢 Top Operators
          </h2>

          <Card className="card-safe h-[260px] overflow-y-auto scrollbar-hide">

            <CardContent className="p-4 space-y-2 text-sm">

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
                  className="flex justify-between border-b border-white/10 py-2"
                >
                  <span>{op}</span>
                  <span className="text-blue-400">Available</span>
                </div>

              ))}

            </CardContent>

          </Card>

        </section>

        {/* ================= FAQ ================= */}

        <section>

          <h2 className="text-3xl mb-6 gradient-text">
            ❓ FAQ
          </h2>

          <Accordion type="single" collapsible>

            <AccordionItem value="1">

              <AccordionTrigger>
                How to book?
              </AccordionTrigger>

              <AccordionContent>
                Login → Choose Ride → Click Book
              </AccordionContent>

            </AccordionItem>

            <AccordionItem value="2">

              <AccordionTrigger>
                Is payment safe?
              </AccordionTrigger>

              <AccordionContent>
                Yes. All payments are secure.
              </AccordionContent>

            </AccordionItem>

            <AccordionItem value="3">

              <AccordionTrigger>
                24/7 support?
              </AccordionTrigger>

              <AccordionContent>
                Yes. Call or WhatsApp anytime.
              </AccordionContent>

            </AccordionItem>

          </Accordion>

        </section>

      </div>

    </div>
  );
}
