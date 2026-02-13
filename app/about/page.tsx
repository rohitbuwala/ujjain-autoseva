import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ShieldCheck,
    Users,
    MapPin,
    Award,
    Clock,
    Heart,
    Map as MapIcon,
    Zap,
    Star,
    ChevronRight,
    Handshake
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    const stats = [
        { label: "Safe Journeys", value: "10k+", icon: MapPin },
        { label: "Verified Drivers", value: "100+", icon: Award },
        { label: "Happy Commuters", value: "5,000+", icon: Heart },
        { label: "Cities Served", value: "1 (Ujjain)", icon: MapIcon },
    ];

    const values = [
        {
            title: "Uncompromising Safety",
            desc: "Every ride is tracked, and every driver is thoroughly vetted. Your safety isn't just a priority; it's our promise.",
            icon: ShieldCheck,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Punctual & Reliable",
            desc: "Time is sacred, especially in Ujjain. Our smart routing ensures your driver arrives exactly when you need them.",
            icon: Clock,
            color: "text-cyan-600",
            bg: "bg-cyan-50"
        },
        {
            title: "Fair & Transparent",
            desc: "No hidden charges or surge pricing. We believe in honest fares that respect both the passenger and the driver.",
            icon: Handshake,
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            title: "Customer First",
            desc: "From pilgrims to local residents, we listen and evolve our services to meet your unique travel needs.",
            icon: Heart,
            color: "text-rose-600",
            bg: "bg-rose-50"
        },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden bg-slate-50 dark:bg-slate-950/20">
                <div className="container-custom relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
                            <Zap className="w-4 h-4 fill-current" />
                            <span>Transforming Local Travel</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight text-slate-900 dark:text-white">
                            Connecting You to the <span className="text-primary italic">Sacred Heart</span> of Ujjain
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
                            Ujjain AutoSeva is more than just a ride-hailing app. We are a bridge between tradition and technology,
                            ensuring every pilgrim, tourist, and resident finds a reliable way to navigate our holy city.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button asChild size="lg" className="rounded-full px-8 h-14 text-base shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
                                <Link href="/booking">Book a Ride Now</Link>
                            </Button>
                            <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-base bg-white/50 backdrop-blur-sm border-slate-200">
                                <Link href="/services">Explore Services</Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
                </div>
            </section>

            {/* Our Story Section */}
            <section className="section-padding bg-white dark:bg-slate-950">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
                            <div className="relative aspect-[4/5] sm:aspect-video lg:aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                                {/* Visual Placeholder: In production, replace with a high-quality image of Ujjain or an Auto */}
                                <div className="absolute inset-0 flex items-center justify-center p-12 text-center">
                                    <div className="space-y-6">
                                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
                                            <Star className="w-10 h-10 text-primary" />
                                        </div>
                                        <h3 className="text-2xl font-bold italic text-slate-400">Trusted by thousands of pilgrims every year.</h3>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-3">Our Core Origin</h2>
                                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                                    Born from a vision to respect tradition while embracing the future.
                                </h3>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                                Ujjain is a city of timeless spirituality, but for many, navigating its bustling streets can be overwhelming.
                                We saw a need for a professional, tech-enabled transportation service that treats every passenger with
                                the respect and hospitality that our city is known for.
                            </p>

                            <div className="space-y-4">
                                {[
                                    "Verified local drivers with deep city knowledge",
                                    "Fixed, honest pricing with no surge traps",
                                    "24/7 support for international and domestic pilgrims"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <ChevronRight className="w-3 h-3 text-emerald-600" />
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed pt-4 border-t border-slate-100 dark:border-slate-800 italic">
                                "Our mission is to ensure that no one feels lost or overcharged in the holy city of Mahakal.
                                We are here to serve, guide, and transport."
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Counter Section */}
            <section className="py-16 bg-slate-900">
                <div className="container-custom">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center group">
                                <div className="mb-4 inline-flex p-3 rounded-2xl bg-white/5 group-hover:bg-primary/20 transition-colors">
                                    <stat.icon className="w-6 h-6 text-primary-foreground/70" />
                                </div>
                                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                                <div className="text-slate-400 font-medium tracking-wide uppercase text-xs">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="section-padding bg-slate-50 dark:bg-slate-950/40">
                <div className="container-custom">
                    <div className="max-w-3xl mx-auto text-center mb-16 underline-offset-8">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">Values That Guide Us</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-lg">
                            We operate on a foundation of trust. Every feature of our service is designed to reflect
                            these four core pillars of our commitment to you.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, idx) => (
                            <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 hover:-translate-y-2 transition-transform duration-300 rounded-[2rem]">
                                <CardContent className="p-8">
                                    <div className={`w-14 h-14 ${value.bg} ${value.color} rounded-2xl flex items-center justify-center mb-6`}>
                                        <value.icon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{value.title}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm lg:text-base">
                                        {value.desc}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust CTA Section */}
            <section className="section-padding overflow-hidden relative">
                <div className="container-custom">
                    <div className="bg-primary rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden">
                        {/* Background accents */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 max-w-2xl mx-auto space-y-8">
                            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                                Ready to experience a better way to travel?
                            </h2>
                            <p className="text-primary-foreground/80 text-lg md:text-xl">
                                Join thousands of satisfied riders who trust Ujjain AutoSeva for their daily commutes and holy pilgrimages.
                            </p>
                            <div className="pt-4">
                                <Button asChild size="lg" variant="secondary" className="rounded-full px-10 h-16 text-lg hover:scale-105 transition-transform">
                                    <Link href="/booking">Book Your Next Ride</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
