"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Hero() {
    const router = useRouter();

    return (
        <section className="relative w-full overflow-hidden bg-background pt-10 pb-20 md:pt-12 md:pb-24 lg:py-24 lg:min-h-[80vh] lg:flex lg:items-center">

            {/* Background decoration */}
            <div className="absolute top-0 right-0 -z-10 w-full h-full overflow-hidden opacity-10 dark:opacity-5 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-125 h-100 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute bottom-[0%] left-[0%] w-100 h-100 rounded-full bg-secondary/20 blur-3xl" />
            </div>

            <div className="container-custom flex flex-col items-center text-center w-full">

                {/* Content */}
                <div className="max-w-3xl lg:max-w-5xl flex flex-col items-center gap-5 md:gap-6 z-10">
                    
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium w-fit animate-in fade-in slide-in-from-bottom-3 duration-700">
                        <MapPin size={14} className="text-secondary" />
                        <span>Trust of Ujjain • Safe & Reliable</span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-center px-4 leading-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 max-w-4xl mx-auto">
                        Book Trusted Auto for <span className="text-primary">Mahakal Darshan & Full Ujjain Temple Tour</span>
                    </h1>

                    {/* Description */}
                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
                        Trusted auto service for Mahakal Darshan in Ujjain.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 md:mt-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                        <Button
                            size="lg"
                            className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105"
                            onClick={() => router.push("/custom-booking")}
                        >
                            Book Now
                            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-950/30 transition-all hover:scale-105"
                            onClick={() => window.open(`https://wa.me/916263189202?text=${encodeURIComponent("Hello, I'd like to book an auto for darshan.")}`, "_blank")}
                        >
                            WhatsApp Now
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-8 md:pt-10 lg:pt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground animate-in fade-in zoom-in duration-700 delay-500">
                        <div className="flex items-center gap-2 bg-accent/50 px-3 py-2 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Verified Drivers</span>
                        </div>
                        <div className="flex items-center gap-2 bg-accent/50 px-3 py-2 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>24/7 Support</span>
                        </div>
                        <div className="flex items-center gap-2 bg-accent/50 px-3 py-2 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span>Top Rated</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
