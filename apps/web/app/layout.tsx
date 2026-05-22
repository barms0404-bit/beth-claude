import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Toolbar } from "@/components/toolbar";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Armstrong Arikat | Research Terminal",
  description:
    "Multi-agent equity research terminal — Armstrong Arikat Private Wealth Group.",
};

const DISCLAIMER =
  "For informational purposes only. Not investment advice, an offer, or a solicitation. " +
  "Past performance does not guarantee future results. Generated research is subject to " +
  "Armstrong Arikat Private Wealth Group compliance review.";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-ink text-cream antialiased">
        {/* Firm watermark is rendered by body::before in globals.css */}
        <Toolbar />

        <main className="relative z-10 mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
          {children}
        </main>

        <footer className="relative z-10 border-t border-card-border">
          <div className="mx-auto max-w-screen-2xl px-6 py-6 text-xs leading-relaxed text-gold-muted">
            {DISCLAIMER}
          </div>
        </footer>
      </body>
    </html>
  );
}
