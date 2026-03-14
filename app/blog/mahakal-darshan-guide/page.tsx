import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Mahakal Darshan Complete Guide 2026 | Ujjain Auto Seva Blog",
  description: "Step-by-step darshan guide, timings, ticket info, and pro tips for your visit to Mahakaleshwar Jyotirlinga in Ujjain.",
};

export default function BlogPost() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="container-custom max-w-3xl">
        <Link href="/blog" className="inline-flex items-center text-primary hover:underline mb-8 font-semibold">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Blog
        </Link>
        
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Mahakal Darshan Complete Guide 2026</h1>
          <p className="text-muted-foreground mb-8">Published on: Oct 12, 2024</p>

          <div className="w-full h-[400px] relative rounded-2xl overflow-hidden mb-10">
            <Image 
              src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Mahakaleshwar_Temple_Ujjain.jpg" 
              alt="Mahakaleshwar Temple Ujjain" 
              fill 
              className="object-cover"
            />
          </div>

          <h2>Step-by-Step Darshan Guide</h2>
          <p>Visiting the Mahakaleshwar Jyotirlinga is a spiritually uplifting experience. To ensure a smooth darshan, it is highly recommended to plan your visit in advance.</p>
          <ul>
            <li><strong>General Darshan:</strong> Free entry queue. Expect waiting times of 1-3 hours depending on the day.</li>
            <li><strong>VIP / Fast-Track Darshan:</strong> Tickets can be purchased online via the official temple trust website or at the counter for ~₹250. This significantly reduces waiting time.</li>
            <li><strong>Bhasma Aarti:</strong> The most divine experience. Requires advance online booking (at least 15-30 days prior). Dress code is strictly enforced (Dhoti for men, Saree for women).</li>
          </ul>

          <h2>Timings</h2>
          <ul>
            <li><strong>Bhasma Aarti:</strong> 3:00 AM to 5:00 AM</li>
            <li><strong>Morning Darshan:</strong> 6:00 AM to 12:00 PM</li>
            <li><strong>Evening Aarti:</strong> 7:00 PM to 7:45 PM</li>
            <li><strong>Temple Closes:</strong> 11:00 PM</li>
          </ul>

          <h2>Auto Price Estimate & Local Travel</h2>
          <p>Navigating Ujjain is easiest via auto-rickshaws. From the Railway Station to Mahakal Temple, standard fares hover around ₹100-₹150. For a complete, hassle-free experience, pre-book a <Link href="/custom-booking">Mahakal Only drop package</Link> with Ujjain Auto Seva for transparent pricing without the haggling.</p>

          <h2>Pro Tips for Devotees</h2>
          <ul>
            <li>Leave leather belts, wallets, and mobile phones at your hotel to save time at locker lines.</li>
            <li>Mondays, weekends, and festivals like Mahashivratri see extreme crowds. Plan mid-week for peace.</li>
            <li>Always rely on trusted auto services like <Link href="/">Ujjain Auto Seva</Link> to avoid tourist traps.</li>
          </ul>

          <div className="mt-12 p-8 bg-green-500/10 rounded-2xl border border-green-500/20 text-center not-prose">
            <h3 className="text-2xl font-bold mb-3 text-foreground">Ready for your spiritual journey?</h3>
            <p className="mb-6 text-muted-foreground">Book a reliable auto with verified drivers for a hassle-free experience.</p>
            <a 
              href={`https://wa.me/916263189202?text=${encodeURIComponent("Hello, I'd like to book an auto for darshan.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold transition-transform hover:scale-105 shadow-lg shadow-green-500/20"
            >
              Book Auto for Darshan Now
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
