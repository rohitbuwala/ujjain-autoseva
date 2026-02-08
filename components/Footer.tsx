"use client";

import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Car,
  Landmark,
} from "lucide-react";

export default function Footer() {

  return (
    <footer
      className="
        bg-gradient-to-r
        from-black
        via-blue-950
        to-purple-950

        border-t
        border-white/10

        mt-20
      "
    >

      {/* MAIN FOOTER */}
      <div
        className="
          max-w-7xl
          mx-auto

          px-4
          sm:px-6
          lg:px-8

          py-10

          grid
          grid-cols-1
          sm:grid-cols-2
          md:grid-cols-3

          gap-8

          text-sm
          text-gray-300
        "
      >

        {/* ================= BRAND ================= */}
        <div className="space-y-3">

          <h2
            className="
              text-xl
              font-bold
              gradient-text
              flex
              items-center
              gap-2
            "
          >
            <Car size={22} />
            Ujjain AutoSeva
            <Landmark size={22} />
          </h2>

          <p>
            Online Taxi & Darshan Booking Platform
          </p>

          <p className="text-gray-400 text-sm">
            Safe • Fast • Reliable
          </p>

        </div>


        {/* ================= LINKS ================= */}
        <div className="space-y-3">

          <h3 className="font-semibold text-white">
            Quick Links
          </h3>

          <ul className="space-y-2">

            <li>
              <Link
                href="/"
                className="hover:text-blue-400 transition"
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                href="/services"
                className="hover:text-blue-400 transition"
              >
                Services
              </Link>
            </li>

            <li>
              <Link
                href="/contact"
                className="hover:text-blue-400 transition"
              >
                Contact
              </Link>
            </li>

            <li>
              <Link
                href="/dashboard"
                className="hover:text-blue-400 transition"
              >
                Dashboard
              </Link>
            </li>

            <li>
              <Link
                href="/booking"
                className="hover:text-blue-400 transition"
              >
                Book Now
              </Link>
            </li>

          </ul>

        </div>


        {/* ================= CONTACT ================= */}
        <div className="space-y-3">

          <h3 className="font-semibold text-white">
            Contact Us
          </h3>


          <div className="space-y-2">

            <p className="flex items-center gap-2">
              <Phone size={16} className="text-blue-400" />
              +91 6263189202
            </p>

            <p className="flex items-center gap-2">
              <Mail size={16} className="text-purple-400" />
               ankitbuwala@gmail.com
            </p>

            <p className="flex items-center gap-2">
              <MapPin size={16} className="text-green-400" />
              Ujjain, MP (India)
            </p>

          </div>

        </div>

      </div>


      {/* ================= BOTTOM BAR ================= */}
      <div
        className="
          text-center

          py-4

          border-t
          border-white/10

          text-gray-400
          text-xs
        "
      >

        © {new Date().getFullYear()} Ujjain AutoSeva • All Rights Reserved

      </div>

    </footer>
  );
}
