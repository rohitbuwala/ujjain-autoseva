"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
} from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen py-12 md:py-16">

      {/* Header */}
      <div className="container-custom text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have questions or need assistance? We're here to help!
          Reach out to us via phone, email, or fill out the form below.
        </p>
      </div>

      <div className="container-custom grid lg:grid-cols-2 gap-12">

        {/* Contact Info */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Get in Touch</CardTitle>
              <CardDescription>We are available 24/7 for your support.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Our Location</h3>
                  <p className="text-muted-foreground">Ujjain, Madhya Pradesh <br />India 456010</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Phone Number</h3>
                  <p className="text-muted-foreground">+91 62631 89202</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Email Address</h3>
                  <p className="text-muted-foreground">ankitbuwala@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Working Hours</h3>
                  <p className="text-muted-foreground">Monday - Sunday: 24 Hours</p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Map Embed */}
          <div className="w-full h-[300px] rounded-xl overflow-hidden border border-border shadow-sm">
            <iframe
              src="https://maps.google.com/maps?q=ujjain&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full"
              loading="lazy"
              style={{ border: 0 }}
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and our team will get back to you shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="+91 99999 99999" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="john@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help..."
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <Button className="w-full" size="lg">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
