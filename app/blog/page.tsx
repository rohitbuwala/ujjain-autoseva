import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Blog & Travel Tips | Ujjain Auto Seva",
  description: "Read our latest articles on Ujjain travel itineraries, Mahakal darshan guides, and local tips.",
};

export default function BlogPage() {
  const posts = [
    {
      title: "One-Day Ujjain Itinerary",
      desc: "How to maximize your 24 hours in the city of Mahakal.",
      slug: "one-day-ujjain-itinerary",
      date: "Oct 12, 2024",
    },
    {
      title: "Mahakal Darshan Guide",
      desc: "Everything you need to know about Bhasma Aarti and fast-track entries.",
      slug: "mahakal-darshan-guide",
      date: "Nov 05, 2024",
    },
    {
      title: "Top 5 Temples You Must Visit",
      desc: "A curated list of spiritual sites you cannot miss in Ujjain.",
      slug: "top-5-temples",
      date: "Dec 01, 2024",
    }
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Travel Blog & Tips</h1>
          <p className="text-lg text-muted-foreground mx-auto">
            Insights, guides, and stories to help you plan the perfect pilgrimage.
          </p>
        </div>

        <div className="space-y-6">
          {posts.map((post, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow border-border/50 group cursor-pointer">
              <Link href={`/blog/${post.slug}`} className="block">
                <CardHeader>
                  <div className="text-sm text-primary font-semibold mb-2">{post.date}</div>
                  <CardTitle className="text-2xl group-hover:text-primary transition-colors">{post.title}</CardTitle>
                  <CardDescription className="text-base mt-2">{post.desc}</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
