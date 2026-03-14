import { Metadata } from "next";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Ujjain Temple Guide | Ujjain Auto Seva",
  description: "Complete guide to all major temples in Ujjain including Mahakaleshwar, Kaal Bhairav, and more.",
};

const temples = [
  {
    name: "Mahakaleshwar Jyotirlinga",
    description: "One of the 12 Jyotirlingas, this globally revered temple is the heart of Ujjain. Known for the Bhasma Aarti, it draws millions of devotees seeking the blessings of Lord Mahakal.",
    image: "https://images.unsplash.com/photo-1707161877994-cc8c5e608d24?w=800&q=80",
  },
  {
    name: "Kaal Bhairav Temple",
    description: "Dedicated to the guardian deity of Ujjain. Devotees offer liquor as prasad to the deity, a unique tradition that has existed for centuries.",
    image: "https://images.unsplash.com/photo-1621235123049-9c5ae251141e?w=800&q=80",
  },
  {
    name: "Harsiddhi Mata Temple",
    description: "One of the 51 Shaktipeeths, known for its two massive Deep Stambhas (lamp pillars) which look magnificent when lit during Navratri.",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80",
  },
  {
    name: "Mangalnath Temple",
    description: "Considered the birthplace of Mars (Mangal), this temple is famously visited for Bhaat Puja to resolve Mangal Dosh.",
    image: "https://images.unsplash.com/photo-1502010886283-7c2a715a3190?w=800&q=80",
  }
];

export default function TempleGuidePage() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-muted/20">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-primary">Ujjain Temple Guide</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the spiritual landscape of Avanti (Ujjain). Plan your darshan with our comprehensive guide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {temples.map((temple, idx) => (
            <Card key={idx} className="overflow-hidden group hover:shadow-lg transition-shadow border-border/50">
              <div className="h-64 relative w-full overflow-hidden bg-muted">
                <Image src={temple.image} alt={temple.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-3">{temple.name}</h2>
                <p className="text-muted-foreground leading-relaxed">{temple.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
