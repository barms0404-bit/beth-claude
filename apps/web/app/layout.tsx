import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { LogoWatermark } from "@/components/logo-watermark";
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
        <LogoWatermark />

        <header className="relative z-10 border-b border-card-border">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <a href="/" className="flex flex-col leading-tight">
              <span className="font-serif text-2xl font-semibold text-gold">
                Armstrong Arikat
              </span>
              <span className="text-xs uppercase tracking-[0.25em] text-gold-muted">
                Private Wealth Group · Research Terminal
              </span>
            </a>
            <nav className="flex gap-6 text-sm text-gold-muted">
              <a href="/" className="hover:text-gold">Dashboard</a>
              <a href="/#reports" className="hover:text-gold">Reports</a>
            </nav>
          </div>
        </header>

        <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
          {children}
        </main>

        <footer className="relative z-10 border-t border-card-border">
          <div className="mx-auto max-w-7xl px-6 py-6 text-xs leading-relaxed text-gold-muted">
            {DISCLAIMER}
          </div>
        </footer>
      </body>
    </html>
  );
}
