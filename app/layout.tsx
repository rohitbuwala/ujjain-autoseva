import "./globals.css";

import Providers from "./providers";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body >

        <Providers>

          {/* Navbar */}
          <Navbar />

          {/* Page Content */}
          <main className="min-h-screen">
            {children}
          </main>

          {/* Footer */}
          <Footer />

        </Providers>

      </body>
    </html>
  );
}
