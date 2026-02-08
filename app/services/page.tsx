"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Clock, IndianRupee } from "lucide-react";


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
    <div
      className="
        card-safe

        p-4
        sm:p-5

        flex
        flex-col
        justify-between

        space-y-3
      "
    >

      {/* INFO */}
      <div className="space-y-2">

        <h3 className="font-semibold text-sm sm:text-base md:text-lg">
          {route}
        </h3>


        <p className="flex items-center gap-1 text-xs sm:text-sm text-gray-300">
          <Clock size={14} />
          {time}
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


      {/* BUTTON */}
      <button
        onClick={() => router.push("/booking")}
        className="
          w-full

          bg-green-600
          hover:bg-green-700

          py-2.5

          rounded-lg

          text-sm
          font-semibold

          transition
          active:scale-95
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
    <div
      className="
      mt-0
      pt-0
        w-full
        min-h-screen

        bg-gradient-to-br
        from-black
        via-blue-950
        to-purple-950

        text-white
      "
    >

      <div
        className="
          max-w-7xl
          mx-auto

          px-4
          sm:px-6
          lg:px-8

          py-10
          sm:py-14

          space-y-16
        "
      >


        {/* ================= INTRO ================= */}

        <Card className="card-safe ">

          <CardContent className="p-5 sm:p-6 text-center space-y-3">

            <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text-1">
              Our Services
            </h1>

            <p className="text-gray-300 text-sm sm:text-base">
              Reliable taxi & auto booking in Ujjain
            </p>

            <p className="text-gray-400 text-xs sm:text-sm">
              Safe drivers • Verified vehicles • Best prices
            </p>

          </CardContent>

        </Card>



        {/* ================= CITY TEMPLES ================= */}

        <section className="space-y-6">

          <h2 className="text-xl sm:text-2xl md:text-3xl gradient-text font-bold">
            Temples Inside City
          </h2>


          <div
            className="
              grid

              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3

              gap-4
              sm:gap-5
            "
          >

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

          <h2 className="text-xl sm:text-2xl md:text-3xl gradient-text font-bold">
            Outside City Temples
          </h2>


          <div
            className="
              grid

              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3

              gap-4
              sm:gap-5
            "
          >

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

        <section className="space-y-5">

          <h2 className="text-xl sm:text-2xl md:text-3xl gradient-text font-bold">
            Top Operators
          </h2>


          <Card className="card-safe max-h-[260px] overflow-y-auto scrollbar-hide">

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
                  className="
                    flex
                    justify-between

                    border-b
                    border-white/10

                    py-2
                  "
                >
                  <span>{op}</span>

                  <span className="text-blue-400 text-xs sm:text-sm">
                    Available
                  </span>

                </div>

              ))}

            </CardContent>

          </Card>

        </section>



        {/* ================= FAQ ================= */}

        <section className="space-y-5">

          <h2 className="text-xl sm:text-2xl md:text-3xl gradient-text font-bold">
            FAQ
          </h2>


          <Accordion type="single" collapsible className="w-full">

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
