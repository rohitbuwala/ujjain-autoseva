import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ShieldCheck,
    Clock,
    Heart,
    Handshake,
    Target,
    Eye,
    Phone,
    Mail,
    MapPin,
    Car,
    CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us | Ujjain AutoSeva",
    description:
        "Learn about Ujjain AutoSeva, our mission, vision, and the professional transportation services we provide in Ujjain.",
    keywords: ["About Ujjain AutoSeva", "Ujjain Taxi Service", "Mahakal Taxi"],
};

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* 1. Hero Section (Strict Height: 350px) */}
            <section className="relative h-[350px] w-full overflow-hidden">
                <Image
                    src="https://images.unsplash.com/photo-1449034446853-66c86144b0ad?q=80&w=2070&auto=format&fit=crop"
                    alt="Professional Transportation Hero"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="container-custom text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                            About Ujjain AutoSeva
                        </h1>
                        <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto">
                            Providing professional, safe, and reliable travel solutions in the
                            heart of the holy city.
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. Our Story */}
            <section className="py-16 md:py-24">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-xl">
                            <Image
                                src="https://images.unsplash.com/photo-1494905998402-395d579af36f?q=80&w=2070&auto=format&fit=crop"
                                alt="Our Story - Ujjain Travel"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold tracking-tight">Our Story</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                Ujjain AutoSeva was founded with a simple goal: to make moving
                                around Ujjain easy for everyone. We noticed that many people,
                                especially pilgrims visiting the Mahakal Temple, faced
                                difficulties in finding fair and reliable transport.
                            </p>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                Today, we have grown into a professional platform that connects
                                thousands of riders with verified drivers. We use modern
                                technology to ensure you get a ride quickly, pay an honest
                                price, and always feel safe.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Mission & Vision */}
            <section className="py-16 bg-muted/30">
                <div className="container-custom">
                    <div className="grid md:grid-cols-2 gap-8">
                        <Card className="p-8 border-none shadow-sm flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Target className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Our Mission</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Our mission is to provide the best travel experience in Ujjain
                                by combining traditional safety with modern technology. We work
                                hard to ensure every journey is smooth and trustworthy.
                            </p>
                        </Card>
                        <Card className="p-8 border-none shadow-sm flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Eye className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Our Vision</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                We want to be the most trusted travel partner in Ujjain. Our
                                vision is a city where every visitor and resident can travel
                                safely, comfortably, and without any worries.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* 4. Our Services */}
            <section className="py-16 md:py-24">
                <div className="container-custom text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">What We Do</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        We offer various transport services to meet your specific needs in
                        and around Ujjain.
                    </p>
                </div>
                <div className="container-custom">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: "Local Rides",
                                desc: "Quick and easy taxi and auto booking for moving around the city.",
                                icon: MapPin,
                            },
                            {
                                title: "Temple Darshan",
                                desc: "Specially organized trips for Mahakal temple and other holy sites.",
                                icon: Car,
                            },
                            {
                                title: "24/7 Support",
                                desc: "We are always available to help you during your journey.",
                                icon: Phone,
                            },
                        ].map((s, i) => (
                            <div
                                key={i}
                                className="p-6 bg-card border rounded-2xl flex items-start gap-4"
                            >
                                <div className="p-3 bg-primary/5 rounded-xl">
                                    <s.icon className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-lg">{s.title}</h4>
                                    <p className="text-muted-foreground text-sm mt-1">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Why Choose Us */}
            <section className="py-16 md:py-24 bg-primary text-primary-foreground">
                <div className="container-custom">
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 text-white">
                            Why Trust Ujjain AutoSeva?
                        </h2>
                        <p className="text-primary-foreground/80">
                            We focus on things that matter most to our customers: safety and
                            honesty.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                title: "Safe Rides",
                                desc: "All our drivers are background checked.",
                                icon: ShieldCheck,
                            },
                            {
                                title: "Fixed Prices",
                                desc: "No hidden charges or unexpected costs.",
                                icon: Handshake,
                            },
                            {
                                title: "On Time",
                                desc: "We value your time and arrive when promised.",
                                icon: Clock,
                            },
                            {
                                title: "Proven Trust",
                                desc: "Thousands of happy customers served.",
                                icon: Heart,
                            },
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-4 text-center">
                                <div className="inline-flex p-4 bg-white/10 rounded-2xl">
                                    <item.icon className="w-8 h-8 text-white" />
                                </div>
                                <h4 className="text-xl font-bold">{item.title}</h4>
                                <p className="text-primary-foreground/70 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Contact Info */}
            <section className="py-16 md:py-24">
                <div className="container-custom">
                    <div className="bg-card border rounded-[2.5rem] p-8 md:p-16">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold">Contact & Support</h2>
                                <p className="text-muted-foreground text-lg">
                                    Have questions or need help with a booking? Our team is ready
                                    to assist you 24 hours a day.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-full">
                                            <Phone className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium opacity-60">Call Us</p>
                                            <p className="font-bold">+91 91740 55734</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-full">
                                            <Mail className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium opacity-60">Email Us</p>
                                            <p className="font-bold">support@ujjainautoseva.com</p>
                                        </div>
                                    </div>
                                </div>
                                <Button asChild size="lg" className="rounded-full px-8">
                                    <Link href="/contact">Send a Message</Link>
                                </Button>
                            </div>
                            <div className="grid gap-4">
                                {[
                                    "Verified Government Registration",
                                    "Secure Payment Options",
                                    "24/7 Emergency Assistance",
                                    "English & Hindi Speaking Drivers",
                                ].map((text, i) => (
                                    <div
                                        key={i}
                                        className="p-4 bg-muted/50 rounded-xl flex items-center gap-3 border border-border/50"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        <span className="font-semibold">{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
