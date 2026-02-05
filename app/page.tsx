"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import HeroSlider from "@/components/HeroSlider";

export default function HomePage() {

  const router = useRouter();

  return (
    <div className="min-h-screen bg-transparent pt-20 overflow-x-hidden">


      {/* ================= HERO ================= */}
      <HeroSlider />


      {/* ================= QUICK SERVICES ================= */}
      <section className="section-box my-16">

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-20">

          {[
            { title: "Taxi Booking", icon: "🚖", link: "/booking" },
            { title: "Darshan", icon: "🛕", link: "/packages" },
            { title: "My Trips", icon: "📜", link: "/dashboard/bookings" },
            { title: "Support", icon: "📞", link: "/contact" },
            // NEW
          ].map((item) => (

            <Card
              key={item.title}
              onClick={() => router.push(item.link)}
              className="card-safe cursor-pointer hover:scale-105 transition-all duration-300"
            >
              <CardContent className="p-4 text-center space-y-2">

                <div className="text-3xl">{item.icon}</div>

                <h3 className="font-semibold text-sm">
                  {item.title}
                </h3>

              </CardContent>
            </Card>

          ))}

        </div>

      </section>



      {/* ================= PREMIUM SERVICES ================= */}
      <section className="section-box">

        <h2 className="text-3xl text-center mb-10 gradient-text font-extrabold">
          Our Premium Services
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">

          {[
            {
              title: "Taxi Service",
              desc: "Safe pickup and drop with professional drivers",
              icon: "🚖",
            },
            {
              title: "Temple Darshan",
              desc: "Easy booking for Mahakal & nearby temples",
              icon: "🛕",
            },
            {
              title: "Tour Packages",
              desc: "Customized pilgrimage tour plans",
              icon: "📦",
            },
            {
              title: "Hotel Booking",
              desc: "Comfortable stay near temples",
              icon: "🏨",
            },
            {
              title: "Local Guide",
              desc: "City guide for pilgrims & tourists",
              icon: "🧭",
            },
          ].map((item) => (

            <Card key={item.title} className="card-safe">

              <CardContent className="p-5 text-center space-y-3">

                <div className="text-4xl">{item.icon}</div>

                <h3 className="font-semibold text-lg">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-300">
                  {item.desc}
                </p>

              </CardContent>
            </Card>

          ))}

        </div>

      </section>



      {/* ================= POPULAR PACKAGES ================= */}
      <section className="section-box mt-20">

        <h2 className="text-3xl text-center mb-10 gradient-text font-bold">
          Popular Packages
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">

          {[
            {
              title: "1 Day Darshan",
              price: "₹999",
              desc: "Mahakal, Kaal Bhairav, Mangalnath",
            },
            {
              title: "2 Day Tour",
              price: "₹1999",
              desc: "Ujjain + Omkareshwar",
            },
            {
              title: "Custom Trip",
              price: "On Request",
              desc: "Personalized travel plan",
            },
          ].map((pkg) => (

            <Card key={pkg.title} className="card-safe">

              <CardContent className="p-5 space-y-3">

                <h3 className="text-center font-semibold text-lg">
                  {pkg.title}
                </h3>

                <p className="text-blue-400 font-bold text-center">
                  {pkg.price}
                </p>

                <p className="text-sm text-gray-300 text-center">
                  {pkg.desc}
                </p>

                <Button
                  className="btn-neon w-full mt-2 bg-blue-400"
                >
                  Book Now
                </Button>

              </CardContent>
            </Card>

          ))}

        </div>

      </section>



      {/* ================= WHY CHOOSE US ================= */}
      <section className="section-box mt-20">

        <h2 className="text-3xl text-center mb-10 gradient-text font-bold">
          Why Choose Ujjain AutoSeva?
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">

          {[
            "Verified Drivers",
            "24/7 Support",
            "Affordable Pricing",
            "Fast Booking",
            "Secure Payments",
            "Trusted Platform",
            "Local Expertise",
            "Best Routes",
          ].map((point) => (

            <Card key={point} className="card-safe">

              <CardContent className="p-4 text-center text-sm">

                ✅ {point}

              </CardContent>
            </Card>

          ))}

        </div>

      </section>



      {/* ================= CTA ================= */}
      <section className="section-box text-center mt-24 mb-20">

        <h2 className="text-3xl mb-4 gradient-text font-bold">
          Ready for Your Journey?
        </h2>

        <p className="mb-6 text-gray-300">
          Register now and book taxi, darshan, hotel & tours easily
        </p>

        <Button
          size="lg"
          className="btn-neon bg-blue-500"
          onClick={() => router.push("/register")}
        >
          Get Started
        </Button>

      </section>

    </div>
  );
}
