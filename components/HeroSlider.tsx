"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";


const slides = [
  {
    id: 1,
    title: "Ujjain Darshan Booking",
    desc: "Easy online mandir darshan booking",
    img: "/logo1.webp",
  },
  {
    id: 2,
    title: "Taxi Service",
    desc: "Comfortable travel with drivers",
    img: "/logo2.webp",
  },
  {
    id: 3,
    title: "Tour Packages",
    desc: "Best pilgrimage packages",
    img: "/logo3.jpg",
  },
];

export default function HeroSlider() {

  const [current, setCurrent] = useState(0);

  const router = useRouter();
  const { data: session, status } = useSession();


  // Login + Booking Redirect
  function goToBooking() {

    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    router.push("/booking");
  }


  // Auto Slide
  useEffect(() => {

    const timer = setInterval(() => {
      setCurrent((prev) =>
        prev === slides.length - 1 ? 0 : prev + 1
      );
    }, 4500);

    return () => clearInterval(timer);

  }, []);


  return (
   <div
        className="
          relative
          w-full
          md:8
          h-[320px]
          sm:h-[300px]
          md:h-[420px]
          lg:h-[420px]

          overflow-hidden
        "
      >


      {slides.map((slide, index) => (

        <div
          key={slide.id}
          className={`
            absolute inset-0

            transition-opacity
            duration-700

            ${index === current ? "opacity-100" : "opacity-0"}
          `}
        >

          {/* Background Image */}
          <Image
            src={slide.img}
            alt={slide.title}
            fill
            className="object-cover object-center"
            priority={index === 0}
          />


          {/* Overlay */}
          <div
            className="
              absolute inset-0

              bg-black/60

              flex flex-col
              items-center
              justify-center

              px-4
              text-center
              text-white
            "
          >

            {/* Title */}
            <h2
              className="
                font-bold

                text-xl
                sm:text-2xl
                md:text-4xl
                lg:text-5xl

                mb-2
                hero-text
              "
            >
              {slide.title}
            </h2>


            {/* Description */}
            <p
              className="
                text-sm
                sm:text-base
                md:text-lg

                max-w-xl

                mb-4
                text-gray-200
              "
            >
              {slide.desc}
            </p>


            {/* CTA Button */}
            <Button
              disabled={status === "loading"}
              className="
                btn-primary

                px-6
                py-2.5

                text-sm
                sm:text-base

                mt-2
              "
              onClick={goToBooking}
            >
              {status === "loading" ? "Please wait..." : "Book Now"}
            </Button>

          </div>

        </div>

      ))}

    </div>
  );
}
