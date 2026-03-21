import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Top 5 Temples in Ujjain for One-Day Darshan | Ujjain Auto Seva Blog",
  description: "A complete list of the top temples to visit in Ujjain, including Mahakaleshwar, Kal Bhairav, and Harsiddhi.",
};

export default function BlogPost() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="container-custom max-w-3xl">
        <Link href="/blog" className="inline-flex items-center text-primary hover:underline mb-8 font-semibold">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Blog
        </Link>
        
        <article className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Ujjain Temple List for One-Day Darshan</h1>
          <p className="text-muted-foreground mb-8">Published on: Dec 01, 2024</p>

          <div className="w-full h-[400px] relative rounded-2xl overflow-hidden mb-10 bg-muted">
            <Image 
              src="https://upload.wikimedia.org/wikipedia/commons/0/02/Mahakal_Temple.jpg" 
              alt="Ujjain Temples Overview" 
              fill 
              className="object-cover"
            />
          </div>

          <p>Ujjain is arguably one of the most spiritual cities in India. If you only have one day to spend in this ancient city, here are the top 5 must-visit temples that should form the core of your darshan.</p>

          <h2>1. Mahakaleshwar Jyotirlinga</h2>
          <p>The unquestioned center of Ujjain. The only South-facing (Dakshinamukhi) Jyotirlinga, famous for the dawn Bhasma Aarti. A visit here is vital for any pilgrim.</p>

          <h2>2. Kal Bhairav Temple</h2>
          <p>The guardian deity of Ujjain. It is considered customary to pay respects to Kal Bhairav immediately after visiting Mahakal. The deity uniquely accepts liquor as an offering.</p>

          <h2>3. Harsiddhi Mata Temple</h2>
          <p>Located right next to the Mahakal complex, this is one of the 51 Shaktipeeths. The evening Aarti here, featuring two massive stone pillars lit with hundreds of oil lamps, is absolutely breathtaking.</p>

          <h2>4. Mangalnath Temple</h2>
          <p>According to the Matsya Purana, Ujjain is the birthplace of Mars (Mangal). Mangalnath is the temple where astrological remedies for &quot;Mangal Dosh&quot; are performed.</p>

          <h2>5. Sandipani Ashram</h2>
          <p>Connecting with the rich history of the Mahabharata, this is where Lord Krishna, Balarama, and Sudama received their education. A very peaceful and historically rich site.</p>

          <h2>Transportation Tip</h2>
          <p>Covering these 5 locations optimally requires navigating narrow city lanes. Our <Link href="/custom-booking">5 Temple Darshan Package</Link> is designed specifically for this route, saving you time and stress.</p>

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
