"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, MessageCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary/20">404</h1>
          <h2 className="text-3xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground">
            Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <Button className="gap-2">
              <Home size={18} />
              Go Home
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="gap-2">
              <MessageCircle size={18} />
              Contact Us
            </Button>
          </Link>
        </div>

        <div className="pt-8">
          <button
            onClick={() => window.history.back()}
            className="text-sm text-muted-foreground hover:text-primary transition flex items-center gap-1 mx-auto"
          >
            <ArrowLeft size={14} />
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
