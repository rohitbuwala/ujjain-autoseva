import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ShieldCheck,
    MapPin,
    Award,
    Clock,
    Heart,
    Zap,
    Star,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us | Ujjain AutoSeva",
    description: "Modern transportation services in the holy city of Ujjain. Safe, reliable, and fair travel for everyone.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/20 pt-24 pb-12">
            <div className="container-custom">
                {/* Header Section - Modern & Compact */}
                <div className="mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                        <Zap className="w-3 h-3 fill-current" />
                        <span>The Spirit of Service</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
                        Modern travel in the <span className="text-primary italic">City of Mahakal</span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed">
                        Ujjain AutoSeva is redefining local transit. We bridge tradition and technology to provide reliable, safe, and fair transportation for everyone visiting our holy city.
                    </p>
                </div>

                {/* Main Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 auto-rows-[minmax(140px,auto)] md:auto-rows-[180px]">

                    {/* Mission Card - Large & Impactful */}
                    <Card className="md:col-span-2 md:row-span-2 overflow-hidden border-none shadow-xl shadow-primary/10 bg-primary text-primary-foreground rounded-[2.5rem] group">
                        <CardContent className="p-8 md:p-12 h-full flex flex-col justify-center relative z-10">
                            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                <Star className="w-48 h-48" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Vision</h2>
                            <p className="text-primary-foreground/90 text-sm md:text-lg leading-relaxed mb-8 max-w-lg">
                                Ujjain is a city of timeless spirituality. We saw a need for a professional service that respects this heritage while providing modern convenience. Our mission is to ensure no pilgrim or resident feels overcharged or lost.
                            </p>
                            <Button asChild variant="secondary" className="w-fit rounded-full px-8 h-12 text-base font-semibold transition-transform hover:scale-105 active:scale-95">
                                <Link href="/booking">Book Your Journey <ArrowRight className="ml-2 w-4 h-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Value Card: Safety */}
                    <Card className="md:row-span-2 border-none shadow-lg shadow-blue-500/5 bg-blue-50/50 dark:bg-blue-950/20 rounded-[2.5rem] flex flex-col justify-between p-8 group hover:bg-blue-600 transition-all duration-500">
                        <div className="w-14 h-14 bg-blue-600 group-hover:bg-white rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-blue-600/20">
                            <ShieldCheck className="w-7 h-7 text-white group-hover:text-blue-600" />
                        </div>
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-blue-50 group-hover:text-white mb-3 transition-colors">Safety First</h3>
                            <p className="text-slate-600 dark:text-blue-200/60 group-hover:text-blue-50/80 text-sm leading-relaxed transition-colors">
                                Every ride is tracked, and every driver is thoroughly vetted. Your safety is our absolute, non-negotiable priority.
                            </p>
                        </div>
                    </Card>

                    {/* Stats Card: Journeys */}
                    <Card className="md:row-span-1 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-center p-6 border-b-4 border-primary">
                        <CardContent className="p-0">
                            <div className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-1">10k+</div>
                            <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em]">Safe Journeys</p>
                        </CardContent>
                    </Card>

                    {/* Stats Card: Drivers */}
                    <Card className="md:row-span-1 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] flex items-center justify-center text-center p-6 border-b-4 border-secondary">
                        <CardContent className="p-0">
                            <div className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-1">100+</div>
                            <p className="text-secondary font-bold text-[10px] uppercase tracking-[0.2em]">Vetted Drivers</p>
                        </CardContent>
                    </Card>

                    {/* Value Card: Reliability */}
                    <Card className="md:row-span-1 border-none bg-slate-100/50 dark:bg-slate-900/50 rounded-[2rem] p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <Clock className="w-5 h-5 text-indigo-600" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Reliable</h3>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Punctual pickups for every Mahakal Darshan and city transfer.</p>
                    </Card>

                    {/* Value Card: Transparency */}
                    <Card className="md:row-span-1 border-none bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2rem] p-6 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <Award className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Fair Price</h3>
                        </div>
                        <p className="text-slate-500 dark:text-emerald-400 text-xs leading-relaxed">Honest, fixed pricing for locals and tourists alike.</p>
                    </Card>

                    {/* Footer CTA Banner - Wide */}
                    <Card className="md:col-span-2 md:row-span-1 border-none shadow-lg bg-slate-900 dark:bg-slate-800 text-white rounded-[2.5rem] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
                        <CardContent className="p-8 h-full flex flex-col sm:flex-row items-center justify-between relative z-10 gap-6">
                            <div className="flex items-center gap-6 text-center sm:text-left">
                                <div className="hidden sm:flex w-14 h-14 bg-white/10 rounded-2xl items-center justify-center shrink-0">
                                    <Heart className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl mb-1">Trusted by 5,000+</h3>
                                    <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">Join the movement for fair travel</p>
                                </div>
                            </div>
                            <Button asChild variant="secondary" className="rounded-full px-8 h-12 font-bold shadow-lg shadow-white/5 whitespace-nowrap">
                                <Link href="/services">Our Services</Link>
                            </Button>
                        </CardContent>
                    </Card>

                </div>

                {/* Legal/Footer Note */}
                <div className="mt-16 flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold">
                    <p>&copy; 2024 Ujjain AutoSeva</p>
                    <div className="flex gap-8">
                        <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
