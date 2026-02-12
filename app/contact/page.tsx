"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";

export default function ContactPage() {

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSend() {

    if (!name || !email || !message) {
      alert("Please fill all fields ❌");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone,
        email,
        message,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (res.ok) {

      alert("Message Sent Successfully ✅");

      setName("");
      setPhone("");
      setEmail("");
      setMessage("");

    } else {
      alert(data.error || "Failed ❌");
    }
  }


  return (
    <div className="min-h-screen py-12 md:py-16">

      {/* ================= HEADER ================= */}
      <div className="container-custom text-center mb-16 space-y-4">

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Contact Us
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have questions or need assistance? We're here to help!
          Reach out via phone, email, or message.
        </p>

      </div>


      <div className="container-custom space-y-16">


        {/* ================= INFO + FORM ================= */}
        <div className="grid lg:grid-cols-2 gap-12">


          {/* ----------- INFO CARD ----------- */}
          <div className="space-y-8">

            <Card className="h-full">

              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>

                <CardDescription>
                  We are available 24/7 for your support.
                </CardDescription>
              </CardHeader>


              <CardContent className="space-y-6">


                {/* Address */}
                <div className="flex items-start gap-4">

                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <MapPin size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold">Our Location</h3>

                    <p className="text-muted-foreground text-sm">
                      Ujjain, Madhya Pradesh <br />
                      India 456010
                    </p>
                  </div>

                </div>


                {/* Phone */}
                <div className="flex items-start gap-4">

                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <Phone size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold">Phone Number</h3>

                    <p className="text-muted-foreground text-sm">
                      +91 62631 89202
                    </p>
                  </div>

                </div>


                {/* Email */}
                <div className="flex items-start gap-4">

                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <Mail size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold">Email Address</h3>

                    <p className="text-muted-foreground text-sm">
                      ankitbuwala@gmail.com
                    </p>
                  </div>

                </div>


                {/* Time */}
                <div className="flex items-start gap-4">

                  <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <Clock size={22} />
                  </div>

                  <div>
                    <h3 className="font-semibold">Working Hours</h3>

                    <p className="text-muted-foreground text-sm">
                      Monday - Sunday : 24 Hours
                    </p>
                  </div>

                </div>


              </CardContent>

            </Card>

          </div>



          {/* ----------- FORM CARD ----------- */}
          <div>

            <Card className="h-full">

              <CardHeader>

                <CardTitle>Send us a Message</CardTitle>

                <CardDescription>
                  Fill the form and we’ll contact you soon.
                </CardDescription>

              </CardHeader>


              <CardContent>

                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                >


                  {/* Name + Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                    <div className="space-y-2">

                      <Label>Full Name</Label>

                      <Input
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />

                    </div>


                    <div className="space-y-2">

                      <Label>Phone Number</Label>

                      <Input
                        placeholder="+91 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />

                    </div>

                  </div>


                  {/* Email */}
                  <div className="space-y-2">

                    <Label>Email Address</Label>

                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />

                  </div>


                  {/* Message */}
                  <div className="space-y-2">

                    <Label>Message</Label>

                    <Textarea
                      rows={5}
                      placeholder="Tell us how we can help..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="resize-none"
                    />

                  </div>


                  {/* Button */}
                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>


                </form>

              </CardContent>

            </Card>

          </div>

        </div>



        {/* ================= MAP SECTION ================= */}
        <div className="w-full">

          <Card className="overflow-hidden">

            <div className="
              w-full
              h-[250px]
              sm:h-[300px]
              md:h-[350px]
              lg:h-[400px]
            ">

              <iframe
                src="https://maps.google.com/maps?q=ujjain&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full"
                loading="lazy"
                style={{ border: 0 }}
                allowFullScreen
              ></iframe>

            </div>

          </Card>

        </div>


      </div>

    </div>
  );
}
