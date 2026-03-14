import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Ujjain Darshan in One Day - Perfect Itinerary | Ujjain Auto Seva Blog",
  description: "The perfect one-day Ujjain itinerary. Full schedule, travel times, and estimated costs for a complete spiritual journey.",
};

export default function BlogPost() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="container-custom max-w-3xl">
        <Link href="/blog" className="inline-flex items-center text-primary hover:underline mb-8 font-semibold">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Blog
        </Link>
        
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Ujjain Darshan in One Day – Perfect Itinerary</h1>
          <p className="text-muted-foreground mb-8">Published on: Oct 12, 2024</p>

          <p>Visiting Ujjain for just one day? It is entirely possible to experience the divine essence of Avanti if you follow a tightly structured itinerary and rely on dependable local transport.</p>

          <h2>Morning: The Heart of the City</h2>
          <ul>
            <li><strong>4:00 AM - 6:00 AM:</strong> Bhasma Aarti at Mahakaleshwar (if ticket pre-booked) OR standard early morning Darshan. <em>(Time required: 2 Hours)</em></li>
            <li><strong>7:00 AM:</strong> Breakfast. Enjoy standard local fare like Poha Jalebi near the temple complex.</li>
            <li><strong>8:00 AM - 9:00 AM:</strong> Walk to Harsiddhi Mata Temple and Ram Ghat for river-side peace and darshan.</li>
          </ul>

          <h2>Late Morning to Afternoon: Outer City Circuit</h2>
          <ul>
            <li><strong>10:00 AM - 11:30 AM:</strong> Take an auto to Kal Bhairav Temple. It is located slightly outside the main city center.</li>
            <li><strong>12:00 PM - 1:00 PM:</strong> Visit Mangalnath Temple.</li>
            <li><strong>1:00 PM - 2:00 PM:</strong> Lunch break. There are several good Bhojnalayas near the station or Kal Bhairav route.</li>
          </ul>

          <h2>Afternoon/Evening: History and Peace</h2>
          <ul>
            <li><strong>2:30 PM - 4:00 PM:</strong> Sandipani Ashram & Gadkalika Temple.</li>
            <li><strong>5:00 PM - 6:30 PM:</strong> Return to the Shipra River (Ram Ghat) for the beautiful evening sunset and Shipra Aarti.</li>
          </ul>

          <h2>Estimated Costs and Travel Efficiency</h2>
          <p>If you hire point-to-point autos, navigating this route can cost you upwards of ₹1500 and a lot of bartering time. By booking a reliable <Link href="/booking">Full Ujjain Tour Auto</Link> for ₹1200, you guarantee a driver tracking this exact route for you all day, allowing you to focus entirely on your spiritual journey.</p>
          
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
