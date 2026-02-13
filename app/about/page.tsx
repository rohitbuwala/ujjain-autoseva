import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, MapPin, Award, Clock, Heart } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    const stats = [
        { label: "Happy Clients", value: "5,000+", icon: Heart },
        { label: "Years Experience", value: "10+", icon: Award },
        { label: "Expert Drivers", value: "50+", icon: Users },
        { label: "Available Cities", value: "1", icon: MapPin },
    ];

    const values = [
        {
            title: "Safety First",
            desc: "Your safety is our top priority. All our drivers are background-checked and vehicles are regularly inspected.",
            icon: ShieldCheck,
        },
        {
            title: "Punctuality",
            desc: "We understand the value of your time. Our drivers ensure timely pickups and smooth journeys.",
            icon: Clock,
        },
        {
            title: "Customer Centric",
            desc: "We strive to provide the best possible experience for every passenger, every time.",
            icon: Heart,
        },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 bg-primary/5 overflow-hidden">
                <div className="container-custom relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                        About <span className="text-primary">Ujjain AutoSeva</span>
                    </h1>
                    <p className="text-muted-foreground text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Revolutionizing local travel in the holy city of Ujjain. We provide reliable,
                        safe, and affordable transportation for pilgrims and residents alike.
                    </p>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10" />
            </section>

            {/* Our Mission */}
            <section className="py-20">
                <div className="container-custom">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted shadow-2xl">
                            {/* Image Placeholder - In a real app, use generate_image or a real asset */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent flex items-center justify-center">
                                <ShieldCheck className="w-20 h-20 text-primary opacity-20" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission & Vision</h2>
                            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                                Ujjain AutoSeva was founded with a simple goal: to make commuting in Ujjain hassle-free.
                                Whether you're here for Mahakal Darshan or a local resident, we ensure you reach your
                                destination comfortably.
                            </p>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                We envision a future where technology and tradition coexist, providing seamless
                                transportation solutions that respect the heritage of our city while embracing
                                modern standards of service.
                            </p>
                            <Button asChild size="lg" className="rounded-full px-8">
                                <Link href="/booking">Book Your First Ride</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-muted/30">
                <div className="container-custom">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="text-center p-6 bg-card border rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                <stat.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                                <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                                <p className="text-muted-foreground font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-20">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Core Values</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            The principles that drive us to provide excellence in every journey.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {values.map((value, idx) => (
                            <Card key={idx} className="border-none shadow-none bg-primary/5 rounded-3xl">
                                <CardContent className="p-8 text-center pt-10">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <value.icon className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {value.desc}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
