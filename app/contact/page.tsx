"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden pt-24 pb-20">

      <div className="max-w-7xl mx-auto px-4 space-y-16">


        {/* Header */}
        <section className="text-center space-y-4">

          <h1 className="text-4xl md:text-5xl font-bold gradient-text hero-text">
            Contact Ujjain AutoSeva
          </h1>

          <p className="text-gray-300 max-w-2xl mx-auto">
            Have questions? Need help with booking?
            Our support team is always ready to help you.
          </p>

        </section>


        {/* Contact Grid */}
        <section className="grid md:grid-cols-2 gap-8">


          {/* Info Card */}
          <Card className="card-safe p-6 space-y-6 text-sm">

            <h2 className="text-2xl gradient-2 font-semibold">
              Get in Touch
            </h2>

            <div className="space-y-3">

              <p>📍 <b>Address:</b> Ujjain, MP, India</p>
              <p>📞 <b>Phone:</b> +91 62631 89202</p>
              <p>📧 <b>Email:</b> support@ujjainautoseva.com</p>
              <p>⏰ <b>Support:</b> 24/7 Available</p>

            </div>

            <p className="pt-4 border-t border-white/10 text-xs text-gray-400">
              We usually reply within 24 hours.
            </p>

          </Card>


          {/* Form Card */}
          <Card className="card-safe p-6 space-y-6">

            <h2 className="text-2xl gradient-text-1 font-semibold">
              Send Message
            </h2>


            <form className="space-y-4">


              <input
                type="text"
                placeholder="Your Name"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500"
              />


              <input
                type="email"
                placeholder="Your Email"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500"
              />


              <input
                type="tel"
                placeholder="Mobile Number"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-pink-500"
              />


              <textarea
                rows={4}
                placeholder="Your Message..."
                className="w-full rounded-lg bg-black/40 border border-white/20 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              ></textarea>


              <Button className="btn-neon w-full bg-blue-400">
                Send Message 🚀
              </Button>


            </form>

          </Card>

        </section>


        {/* Map */}
        <section className="section-box text-center space-y-6">

          <h2 className="text-3xl gradient-text">
            Visit Our Office
          </h2>

          <div className="w-full h-[300px] rounded-xl overflow-hidden border border-white/10">

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
