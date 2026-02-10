"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* Icons */
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaPaperPlane,
} from "react-icons/fa";

export default function ContactPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden pt-24 pb-20">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-14">


        {/* ================= HEADER ================= */}
        <section className="text-center space-y-3">

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text hero-text">
            Contact Ujjain AutoSeva
          </h1>

          <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
            Have questions? Need help with booking?
            Our support team is always ready to help you.
          </p>

        </section>


        {/* ================= CONTACT GRID ================= */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">


          {/* ================= INFO CARD ================= */}
          <Card className="card-safe p-5 sm:p-6 space-y-6 text-sm">

            <h2 className="text-xl sm:text-2xl gradient-2 font-semibold">
              Get in Touch
            </h2>


            <div className="space-y-4 text-gray-200">


              {/* Address */}
              <div className="flex items-start gap-3">

                <FaMapMarkerAlt className="text-blue-400 mt-1" />

                <p>
                  <b>Address:</b> Ujjain, MP, India
                </p>

              </div>


              {/* Phone */}
              <div className="flex items-center gap-3">

                <FaPhoneAlt className="text-green-400" />

                <p>
                  <b>Phone:</b> +91 62631 89202
                </p>

              </div>


              {/* Email */}
              <div className="flex items-center gap-3">

                <FaEnvelope className="text-purple-400" />

                <p>
                  <b>Email:</b> support@ujjainautoseva.com
                </p>

              </div>


              {/* Time */}
              <div className="flex items-center gap-3">

                <FaClock className="text-pink-400" />

                <p>
                  <b>Support:</b> 24/7 Available
                </p>

              </div>

            </div>


            <p className="pt-4 border-t border-white/10 text-xs text-gray-400">
              We usually reply within 24 hours.
            </p>

          </Card>


          {/* ================= FORM CARD ================= */}
          <Card className="card-safe p-5 sm:p-6 space-y-6">

            <h2 className="text-xl sm:text-2xl gradient-text-1 font-semibold">
              Send Message
            </h2>


            <form className="space-y-4">


              {/* Name */}
              <input
                type="text"
                placeholder="Your Name"
                className="input"
              />


              {/* Email */}
              <input
                type="email"
                placeholder="Your Email"
                className="input"
              />


              {/* Phone */}
              <input
                type="tel"
                placeholder="Mobile Number"
                className="input"
              />


              {/* Message */}
              <textarea
                rows={4}
                placeholder="Your Message..."
                className="input resize-none"
              ></textarea>


              {/* Button */}
              <Button className="btn-primary w-full flex items-center justify-center gap-2">

                <FaPaperPlane size={14} />

                Send Message

              </Button>


            </form>

          </Card>

        </section>


        {/* ================= MAP ================= */}
        <section className="section-box text-center space-y-5">

          <h2 className="text-xl sm:text-2xl md:text-3xl gradient-text font-bold">
            Visit Our Office
          </h2>


          <div className="w-full h-[220px] sm:h-[280px] md:h-[320px] rounded-xl overflow-hidden border border-white/10">

            <iframe
              src="https://maps.google.com/maps?q=ujjain&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full"
              loading="lazy"
            ></iframe>

          </div>

        </section>


      </div>

    </div>
  );
}
