"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { LogoLockup } from "@/components/logo";
import { MarketClock } from "@/components/market-clock";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Sector/report destinations not yet built route to "#" — wired as they land.
const NAV: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Morning Report", href: "/dashboard#latest-report" },
  { label: "Mid-Day", href: "/dashboard#latest-report" },
  { label: "Close", href: "/dashboard#latest-report" },
  { label: "Top 50", href: "/dashboard#top50" },
  { label: "AI Infrastructure", href: "#" },
  { label: "Energy", href: "#" },
  { label: "Chips", href: "#" },
  { label: "Inference", href: "#" },
  { label: "Robotics", href: "#" },
  { label: "Quantum", href: "#" },
  { label: "Macro", href: "#" },
  { label: "Calendar", href: "#" },
  { label: "Settings", href: "#" },
];

export function Toolbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-gold/40 bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4">
        <Link href="/dashboard" aria-label="Armstrong Arikat — Dashboard">
          <LogoLockup />
        </Link>

        {/* Full nav — wide screens only */}
        <nav className="hidden items-center gap-x-3 gap-y-1 xl:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap text-xs font-medium text-gold transition-colors hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <MarketClock />

          {/* Mobile / mid-width: collapse nav to a Sheet */}
          <Sheet>
            <SheetTrigger
              className="text-gold transition-colors hover:text-cream xl:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle>Navigation</SheetTitle>
              <nav className="mt-2 flex flex-col gap-1">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <Link
                      href={item.href}
                      className="rounded px-2 py-2 text-sm text-gold transition-colors hover:bg-card-border/40 hover:text-cream"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
