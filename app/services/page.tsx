"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";



export default function ServicesPage() {
  return (
    <div className="w-full min-h-screen overflow-x-clip bg-gradient-to-br from-black via-blue-950 to-purple-950 text-white">

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">

        {/* Intro */}
        <Card className="bg-white/5 border border-white/10">
          <CardContent className="p-6 space-y-3 text-sm leading-relaxed">
            <h2 className="text-center font-extrabold uppercase contain-style text-xl gradient-text-1 mb-5 underline ">Our services</h2>
            <p className="text-center font-bold uppercase contain-style text-xl">
              Ujjain is one of the most beautiful destinations in India. AutoSeva
              provides reliable taxi and auto services.
            </p>
            <p className="text-center font-bold uppercase contain-style text-xl">
              Book your ride online and travel comfortably from home.
            </p>
            <p className="text-center font-bold uppercase contain-style text-xl">
              AC, Non-AC, Sedan, SUV and Auto services available.
            </p>
            <p className="text-center font-bold uppercase contain-style text-xl">
              Safe drivers, verified vehicles and affordable prices.
            </p>
          </CardContent>
        </Card>

        {/* Taxi Routes To */}
        <section>
          <h1 className="text-center text-4xl m-8 gradient-text-1 font-extrabold underline">Places to visit in Ujjain</h1>
          <h2 className="text-3xl mb-6 gradient-text font-semibold">
            🛺 Temple inside the city
          </h2>

          <div className="border border-white/10 rounded-lg overflow-hidden">

            <div className="grid grid-cols-3 bg-white/10 px-4 py-3 font-semibold text-sm">
              <div>Route</div>
              <div>Time</div>
              <div>Price</div>
            </div>

            {[
              ["Station to Mahakal", "01h 30m", "₹400"],
              ["Statin to  Bada Ganesh Mandir", "1h 30m", "₹300"],
              ["Station to Harshiddhi Mandir", "1h 30m", "₹400"],
              ["Station to Vikramaditya Mandir", "30m", "₹350"],
              ["Statin to Ramghat", "1h 30m", "₹300"],
              ["Station to Shree Ram Mandir", "1h 30m", "₹400"],
            ].map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-3 px-4 py-3 border-t border-white/10 text-sm hover:bg-white/5"
              >
                <div>{item[0]}</div>
                <div>{item[1]}</div>
                <div>{item[2]}</div>
                <div>{item[3]}</div>
                <div>{item[4]}</div>
                <div className="text-blue-400">{item[5]}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Taxi Routes From 2*/}
        <section>
          <h2 className="text-3xl mb-6 gradient-text font-semibold">
            Temple outside the city
          </h2>

          <div className="border border-white/10 rounded-lg overflow-hidden">

            <div className="grid grid-cols-3 bg-white/10 px-4 py-3 font-semibold text-sm">
              <div>Route</div>
              <div>Time</div>
              <div>Price</div>
            </div>

            {[
              ["Mahakal to Sandipani Ashram", "01h 30m", "₹700"],
              ["Mahakal to Mangalnath", "2h 10m", "₹500"],
              ["Mahakal to Siddhavar Ghat", "1h 00m", "₹300"],
              ["Mahakal to Kaal-Bhairav Mandir", "01h 30m", "₹700"],
              ["Mahakal to Gadh-kalika Mandir", "1h 00m", "₹300"],
              ["Mahakal to Ganesh mandir", "3h 10m", "₹500"],
              ["Mahakal to Bharthari Gufa", "1h 00m", "₹300"],
              ["Mahakal to Rinmukteshwar Mahadev mandir", "3h 10m", "₹500"],
            ].map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-3 px-4 py-3 border-t border-white/10 text-sm hover:bg-white/5"
              >
                <div>{item[0]}</div>
                <div>{item[1]}</div>
                <div>{item[2]}</div>
                <div>{item[3]}</div>
                <div>{item[4]}</div>
                <div>{item[5]}</div>
                <div>{item[6]}</div>
                <div className="text-blue-400">{item[7]}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Taxi Routes From 3 */}
        <section>
          <h2 className="text-3xl mb-6 gradient-text font-semibold">
            Other Temples outside the city 
          </h2>

          <div className="border border-white/10 rounded-lg overflow-hidden">

            <div className="grid grid-cols-3 bg-white/10 px-4 py-3 font-semibold text-sm">
              <div>Route</div>
              <div>Time</div>
              <div>Price</div>
            </div>

            {[
              ["Mahakal to Shree Ashtvinayak Mandir", "01h 30m", "₹700"],
              ["Mahakal to Shree Chintaman Ganesh Mandir", "2h 10m", "₹500"],
              ["Mahakal to Navgrah Shani Mandir", "1h 00m", "₹300"],
              ["Mahakal to ISkon Mandir", "01h 30m", "₹700"],
            ].map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-3 px-4 py-3 border-t border-white/10 text-sm hover:bg-white/5"
              >
                <div>{item[0]}</div>
                <div>{item[1]}</div>
                <div>{item[2]}</div>
                <div className="text-blue-400">{item[4]}</div>
              </div>
            ))}
          </div>
        </section>
        {/* Taxi Routes From 4 */}
        <section>
          <h2 className="text-3xl mb-6 gradient-text font-semibold">
            Some Other famous temple 
          </h2>

          <div className="border border-white/10 rounded-lg overflow-hidden">

            <div className="grid grid-cols-3 bg-white/10 px-4 py-3 font-semibold text-sm">
              <div>Route</div>
              <div>Time</div>
              <div>Price</div>
            </div>

            {[
              ["Mahakal to Bhukhi Mata Mandir", "01h 30m", "₹300"],
              ["Mahakal to Navgrah Shani Mandir", "1h 00m", "₹400"],
              ["Mahakal to ISkon Mandir", "01h 30m", "₹700"],
              ["Mahakal to  BangakaMukhi Mata mandir", "1h 00m", "₹300"],
              ["Mahakal to Angareshwar Mahadev Mandir", "3h 10m", "₹300"],
              ["Mahakal to Vikrant Bhairav Mandir", "1h 10m", "₹400"],
              ["Mahakal to Maa Meldi sati mata Mandir", "1h 10m", "₹400"],
            ].map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-3 px-4 py-3 border-t border-white/10 text-sm hover:bg-white/5"
              >
                <div>{item[0]}</div>
                <div>{item[1]}</div>
                <div>{item[2]}</div>
                <div>{item[3]}</div>
                <div>{item[4]}</div>
                <div className="text-blue-400">{item[5]}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Operators */}
        <section>
          <h2 className="text-3xl mb-6 gradient-text">
            🏢 Top Operators in Ujjain
          </h2>

          <Card className="card-safe bg-white/5 border border-white/10 h-[260px] overflow-y-scroll overflow-x-hidden scrollbar-hide">

            <CardContent className="p-4 space-y-2 text-sm">

              {[
                "Royal Travels",
                "Chartered Bus",
                "Hans Travels",
                "Ashok Travels",
                "Samay Shatabdi",
                "Intercity Travels",
                "Balaji Bus Service",
                "GSRTC",
                "Kabra Express",
                "Veer Travels",
                "Annapurna Travels",
                "Kamla Travels",
                "Navrang Travels",
                "Mahalaxmi Travels",
                "Baba Travels",
                "SKT Ashok Travels",
                "Shree Jain Tours",
                "Gajraj Travels",
                "Star Travels Ujjain",
              ].map((op, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-white/10 py-2"
                >
                  <span>{op}</span>
                  <span className="text-blue-400">01234</span>
                </div>
              ))}

            </CardContent>
          </Card>
        </section>

       
        {/* About */}
        <section>
          <h2 className="text-3xl mb-6 gradient-text">
            📖 Book Ujjain Taxi on AutoSeva
          </h2>

          <Card className="bg-white/5 border border-white/10">

            <CardContent className="p-6 text-sm leading-relaxed space-y-4">

              <p className="">
                Ujjain is one of the most beautiful destinations in India. Many
                people visit this place every year.
              </p>

              <p>
                Our taxis ensure safe, affordable and comfortable journeys.
              </p>

              <p>
                Online booking makes travel easy and hassle-free.
              </p>

            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-3xl mb-6 gradient-text">
            ❓ Frequently Asked Questions
          </h2>

          <Accordion type="single" collapsible className="w-full">

            <AccordionItem value="1">
              <AccordionTrigger>
                What are popular boarding points?
              </AccordionTrigger>
              <AccordionContent>
                Dewas Gate, Nanakheda, Mahakal Mandir, Bus Stand etc.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="2">
              <AccordionTrigger>
                How to book taxi online?
              </AccordionTrigger>
              <AccordionContent>
                Login → Select Route → Choose Vehicle → Pay Online.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="3">
              <AccordionTrigger>
                Cheapest taxi service?
              </AccordionTrigger>
              <AccordionContent>
                Local Auto and Mini Taxi services are cheapest.
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </section>

      </div>
    </div>
  );
}
