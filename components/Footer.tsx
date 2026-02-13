"use client";

import Link from "next/link";
import {
  Phone,
  Mail,
  MapPin,
  Car,
  Facebook,
  Instagram,

} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary tracking-tight">
                Ujjain <span className="text-foreground">AutoSeva</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your trusted partner for safe and reliable taxi services and temple darshan in Ujjain.
              Available 24/7.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a
                href="https://wa.me/916263189202"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-400 transition-colors"
              >
                <FaWhatsapp size={23} />
              </a>
              <Link href="https://www.instagram.com/ujjain_autoseva/" className="hover:text-primary transition-colors"><Instagram size={20} /></Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/services" className="hover:text-primary transition-colors">Services</Link></li>
              <li><Link href="/booking" className="hover:text-primary transition-colors">Book a Ride</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">My Profile</Link></li>
              <li><Link href="/dashboard/booking" className="hover:text-primary transition-colors">My Bookings</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 text-primary shrink-0" />
                <span>Ujjain, Madhya Pradesh,<br />India 456010</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-primary shrink-0" />
                <a href="tel:+916263189202" className="hover:text-primary transition-colors">+91 62631 89202</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-primary shrink-0" />
                <a href="mailto:ankitbuwala@gmail.com" className="hover:text-primary transition-colors">ankitbuwala@gmail.com</a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-center items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} Ujjain AutoSeva. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
