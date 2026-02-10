"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Calendar, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Hero() {
    const router = useRouter();

    return (
        <section className="relative w-full overflow-hidden bg-background pt-8 pb-16 md:pt-16 md:pb-24 lg:pb-32">

            {/* Background decoration */}
            <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden opacity-10 dark:opacity-5 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute bottom-[0%] left-[0%] w-[400px] h-[400px] rounded-full bg-secondary/20 blur-3xl" />
            </div>

            <div className="container-custom grid lg:grid-cols-2 gap-12 items-center">

                {/* Left: Content */}
                <div className="flex flex-col gap-6 text-center lg:text-left z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium w-fit mx-auto lg:mx-0">
                        <MapPin size={14} className="text-secondary" />
                        <span>Trust of Ujjain • Safe & Reliable</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.15]">
                        Easy Taxi & Auto <br className="hidden lg:block" />
                        Booking in <span className="text-primary">Ujjain</span>
                    </h1>

                    <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                        Book taxis for Mahakal Darshan, Omkareshwar, or local city travel.
                        Safe rides, professional drivers, and fair prices.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-4">
                        <Button
                            size="lg"
                            className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                            onClick={() => router.push("/booking")}
                        >
                            Book a Ride
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 px-8 text-base border-primary/20 hover:bg-accent"
                            onClick={() => router.push("/packages")}
                        >
                            <Calendar className="mr-2 h-4 w-4 text-secondary" />
                            View Darshan Packages
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-8 mt-4 flex flex-wrap justify-center lg:justify-start gap-8 text-sm font-medium text-muted-foreground border-t border-border">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Verified Drivers
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            24/7 Availability
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            Top Rated Service
                        </div>
                    </div>
                </div>

                {/* Right: Mockup/Image */}
                <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none lg:mr-0">
                    {/* Abstract Shape or Image Placeholder */}
                    <div className="relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-muted border border-border group">
                        {/* Replace with actual image later */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                            <div className="text-center p-8">
                                <p className="text-muted-foreground mb-4">Traveler Image / Map Illustration</p>
                                <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                    <MapPin className="text-primary w-10 h-10" />
                                </div>
                            </div>
                        </div>

                        {/* Floating Card Mockup */}
                        <div className="absolute -bottom-6 -left-6 bg-card border border-border p-4 rounded-xl shadow-xl max-w-[200px] hidden md:block animate-in slide-in-from-bottom-5 duration-1000">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                                    ✓
                                </span>
                                <div>
                                    <p className="text-xs text-muted-foreground">Status</p>
                                    <p className="text-sm font-bold text-foreground">Ride Confirmed</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -top-6 -right-6 bg-card border border-border p-4 rounded-xl shadow-xl max-w-[200px] hidden md:block animate-in slide-in-from-top-5 duration-1000 delay-300">
                            <div className="flex items-center gap-3">
                                <div className="text-left">
                                    <p className="text-xs text-muted-foreground">Driver Arriving</p>
                                    <p className="text-sm font-bold text-foreground">5 mins</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
