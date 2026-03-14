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
    description: "The heart of Ujjain and one of the 12 Jyotirlingas, where Lord Shiva resides in his most powerful form.",
    history: "Considered Swayambhu (self-manifested), it has a rich history tied to King Vikramaditya and the ancient city of Avantika.",
    timing: "3:00 AM (Bhasma Aarti) to 11:00 PM",
    tips: "Book Bhasma Aarti tickets at least 15 days in advance. Mobile phones and leather bags are not allowed inside.",
    image: "/maha.jpg",
  },
  {
    name: "Kal Bhairav Temple",
    description: "Dedicated to the fierce manifestation of Lord Shiva, considered the guardian deity of the city.",
    history: "Built by King Bhadrasen, the deity here famously accepts liquor as prasad—a phenomenon that leaves scientists baffled.",
    timing: "5:00 AM to 10:00 PM",
    tips: "Visit during the late morning to avoid massive crowds. Prasad (liquor, flowers) is available right outside the temple.",
    image: "/logo2.webp",
  },
  {
    name: "Harsiddhi Mata Temple",
    description: "One of the 51 Shaktipeeths, known for fulfilling wishes (Har-Siddhi).",
    history: "Legend says the elbow of Goddess Sati dropped here. King Vikramaditya is said to have worshipped here heavily.",
    timing: "5:00 AM to 7:00 PM",
    tips: "The evening Aarti, right when the towering Deep Stambhas (lamp pillars) are lit, offers a spectacular and divine view.",
    image: "/har.jpg",
  },
  {
    name: "Ram Ghat",
    description: "The oldest and most sacred bathing ghat on the banks of the Shipra River.",
    history: "It is one of the main venues for the famous Kumbh Mela (Simhastha) held every 12 years.",
    timing: "24 Hours (Best visited during sunrise or sunset)",
    tips: "Attend the breathtaking evening Shipra Aarti. Enjoy a peaceful boat ride early in the morning.",
    image: "/ram.jpeg",
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
                <p className="text-muted-foreground leading-relaxed mb-4">{temple.description}</p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-primary uppercase tracking-wide">History</h3>
                    <p className="text-sm text-foreground/80 mt-1">{temple.history}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-primary uppercase tracking-wide">Best Timing</h3>
                    <p className="text-sm text-foreground/80 mt-1">{temple.timing}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-primary uppercase tracking-wide">Pro Tips</h3>
                    <p className="text-sm text-foreground/80 mt-1">{temple.tips}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
