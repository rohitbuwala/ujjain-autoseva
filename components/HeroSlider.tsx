"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) =>
        prev === slides.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[420px] overflow-hidden">

      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700
            ${index === current ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={slide.img}
            alt={slide.title}
            fill
            className="object-cover"
            priority
          />

          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-center">

            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              {slide.title}
            </h2>

            <p className="mb-4 text-lg">
              {slide.desc}
            </p>

            <button className="bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700">
              Book Now
            </button>

          </div>
        </div>
      ))}
    </div>
  );
}
