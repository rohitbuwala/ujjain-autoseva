"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "next-auth/react";

import HeroSlider from "@/components/HeroSlider";
import { MdTempleHindu } from "react-icons/md";


/* Icons */
import {
  Car,
  Landmark,
  FileText,
  PhoneCall,
  Package,
  Hotel,
  Map,
  ShieldCheck,
  Clock,
  IndianRupee,
  Zap,
  Lock,
  Route,
} from "lucide-react";

export default function HomePage() {

   const router = useRouter();
  const { data: session, status } = useSession();



function goToBooking() {

  if (status === "loading") return; // wait

  if (status === "unauthenticated") {
    router.push("/login");
    return;
  }

  // authenticated
  router.push("/booking");
}


  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden">


      {/* ================= HERO ================= */}
      <HeroSlider />


      {/* ================= QUICK SERVICES ================= */}
      <section className="section-box my-12 md:my-16">

        <h2 className="text-xl md:text-2xl font-bold mb-6 text-center gradient-text">
          Quick Services
        </h2>

        <div className="
          grid
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          gap-4 sm:gap-6
        ">

          {[
            { title: "Taxi Booking", icon: Car, link: "/booking" },
           { title: "Darshan", icon: MdTempleHindu, link: "/packages" },
            { title: "My Trips", icon: FileText, link: "/dashboard/bookings" },
            { title: "Support", icon: PhoneCall, link: "/contact" },
          ].map((item) => (

            <Card
              key={item.title}
              onClick={() => router.push(item.link)}
              className="
                card-safe
                cursor-pointer
                hover:scale-105
                transition
              "
            >
              <CardContent className="p-4 text-center space-y-2">

                <item.icon
                  size={32}
                  className="mx-auto text-blue-400"
                />

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

        <h2 className="text-2xl md:text-3xl text-center mb-10 gradient-text font-bold">
          Our Premium Services
        </h2>

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          gap-5
        ">

          {[
            {
              title: "Taxi Service",
              desc: "Safe pickup and drop with professional drivers",
              icon: Car,
            },
           {
              title: "Temple Darshan",
              desc: "Easy booking for Mahakal & nearby temples",
              icon: MdTempleHindu,
            },

            {
              title: "Tour Packages",
              desc: "Customized pilgrimage tour plans",
              icon: Package,
            },
            {
              title: "Hotel Booking",
              desc: "Comfortable stay near temples",
              icon: Hotel,
            },
            {
              title: "Local Guide",
              desc: "City guide for pilgrims & tourists",
              icon: Map,
            },
          ].map((item) => (

            <Card key={item.title} className="card-safe">

              <CardContent className="p-5 text-center space-y-3">

                <item.icon
                  size={36}
                  className="mx-auto text-purple-400"
                />

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
      <section className="section-box mt-16 md:mt-20">

        <h2 className="text-2xl md:text-3xl text-center mb-10 gradient-text font-bold">
          Popular Packages
        </h2>

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3
          gap-5
        ">

          {[
            {
              title: "1 Day Darshan",
              price: "999",
              desc: "Mahakal, Kaal Bhairav, Mangalnath",
            },
            {
              title: "2 Day Tour",
              price: "1999",
              desc: "Ujjain + Omkareshwar",
            },
            {
              title: "Custom Trip",
              price: "On Request",
              desc: "Personalized travel plan",
            },
          ].map((pkg) => (

            <Card key={pkg.title} className="card-safe">

              <CardContent className="p-5 space-y-3 text-center">

                <h3 className="font-semibold text-lg">
                  {pkg.title}
                </h3>

                <p className="flex justify-center items-center gap-1 text-blue-400 font-bold">

                  {pkg.price !== "On Request" && (
                    <IndianRupee size={16} />
                  )}

                  {pkg.price}

                </p>

                <p className="text-sm text-gray-300">
                  {pkg.desc}
                </p>

               <Button
                className="btn-primary w-full mt-2"
                onClick={goToBooking}
                  >
                Book Now
              </Button>

              </CardContent>
            </Card>

          ))}

        </div>

      </section>



      {/* ================= WHY CHOOSE US ================= */}
      <section className="section-box mt-16 md:mt-20">

        <h2 className="text-2xl md:text-3xl text-center mb-10 gradient-text font-bold">
          Why Choose Ujjain AutoSeva?
        </h2>

        <div className="
          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-4
          gap-5
        ">

          {[
            { text: "Verified Drivers", icon: ShieldCheck },
            { text: "24/7 Support", icon: Clock },
            { text: "Affordable Pricing", icon: IndianRupee },
            { text: "Fast Booking", icon: Zap },
            { text: "Secure Payments", icon: Lock },
            { text: "Trusted Platform", icon: ShieldCheck },
            { text: "Local Expertise", icon: Map },
            { text: "Best Routes", icon: Route },
          ].map((item) => (

            <Card key={item.text} className="card-safe">

              <CardContent className="p-4 text-center space-y-2">

                <item.icon
                  size={22}
                  className="mx-auto text-green-400"
                />

                <p className="text-sm font-medium">
                  {item.text}
                </p>

              </CardContent>
            </Card>

          ))}

        </div>

      </section>



      {/* ================= CTA ================= */}
      <section className="section-box text-center mt-20 md:mt-24 mb-16">

        <h2 className="text-2xl md:text-3xl mb-4 gradient-text font-bold">
          Ready for Your Journey?
        </h2>

        <p className="mb-6 text-gray-300 max-w-xl mx-auto">
          Register now and book taxi, darshan, hotel & tours easily
        </p>

      <Button
        disabled={status === "loading"}
        className="btn-primary px-8"
        onClick={goToBooking}
      >
        {status === "loading" ? "Please wait..." : "Get Started"}
      </Button>


      </section>

    </div>
  );
}
