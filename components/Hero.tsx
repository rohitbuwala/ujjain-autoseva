"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
    const router = useRouter();

    return (
        <section className="relative w-full overflow-hidden bg-background pt-12 pb-24 lg:pt-20 lg:pb-48">

            {/* Background decoration */}
            <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden opacity-10 dark:opacity-5 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-125 h-100 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute bottom-[0%] left-[0%] w-100 h-100 rounded-full bg-secondary/20 blur-3xl" />
            </div>

            <div className="container-custom flex flex-col items-center text-center">

                {/* Content */}
                <div className="max-w-3xl flex flex-col items-center gap-6 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium w-fit animate-in fade-in slide-in-from-bottom-3 duration-700">
                        <MapPin size={14} className="text-secondary" />
                        <span>Trust of Ujjain • Safe & Reliable</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        Easy Taxi & Auto <br />
                        Booking in <span className="text-primary">Ujjain</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                        Book taxis for Mahakal Darshan, Omkareshwar, or local city travel.
                        Safe rides, professional drivers, and fair prices.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                        <Button
                            size="lg"
                            className="h-14 px-8 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105"
                            onClick={() => router.push("/booking")}
                        >
                            Book a Ride
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="h-14 px-8 text-lg border-primary/20 hover:bg-accent transition-all hover:scale-105"
                            onClick={() => router.push("/services")}
                        >
                            <Calendar className="mr-2 h-5 w-5 text-secondary" />
                            View Darshan Packages
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-10 mt-6 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-muted-foreground animate-in fade-in zoom-in duration-700 delay-500">
                        <div className="flex items-center gap-2 bg-accent/50 px-4 py-2 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Verified Drivers
                        </div>
                        <div className="flex items-center gap-2 bg-accent/50 px-4 py-2 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            24/7 Availability
                        </div>
                        <div className="flex items-center gap-2 bg-accent/50 px-4 py-2 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            Top Rated Service
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
