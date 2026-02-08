import "./globals.css";

import Providers from "./providers";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


export const metadata = {
  title: "Ujjain AutoSeva | Taxi & Temple Booking",
  description:
    "Book taxi and temple darshan in Ujjain. Safe, affordable, online booking with Ujjain AutoSeva.",
  keywords: [
    "Ujjain taxi",
    "Mahakal taxi",
    "Ujjain auto",
    "Temple booking",
    "Ujjain cab",
  ],
  authors: [{ name: "Ujjain AutoSeva" }],
  robots: "index, follow",
};

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
         <main className="min-h-screen page-wrapper">
          {children}
        </main>


          {/* Footer */}
          <Footer />

        </Providers>

      </body>
    </html>
  );
}
