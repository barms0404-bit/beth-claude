"use client";

import Link from "next/link";
import { Menu, ChevronDown } from "lucide-react";
import { LogoLockup } from "@/components/logo";
import { MarketClock } from "@/components/market-clock";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// A nav entry is either a flat link or a dropdown with children.
type NavLink = { label: string; href: string };
type NavGroup = { label: string; children: NavLink[] };
type NavItem = NavLink | NavGroup;

const isGroup = (item: NavItem): item is NavGroup =>
  (item as NavGroup).children !== undefined;

// Sector/report destinations not yet built route to "#" — wired as they land.
const NAV: NavItem[] = [
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
  {
    label: "Healthcare",
    children: [
      { label: "Healthcare Command", href: "/healthcare" },
      { label: "Biotech", href: "/healthcare/biotech" },
      { label: "Big Pharma", href: "/healthcare/big-pharma" },
      { label: "Tools & Life Sciences", href: "/healthcare/tools" },
      { label: "GLP-1 Tracker", href: "/healthcare/glp1" },
      { label: "AI Drug Discovery", href: "/healthcare/ai-drug-discovery" },
      { label: "Clinical Catalyst Calendar", href: "/healthcare/clinical-calendar" },
      { label: "FDA Calendar", href: "/healthcare/fda-calendar" },
    ],
  },
  { label: "Macro", href: "#" },
  { label: "Calendar", href: "#" },
  { label: "Settings", href: "#" },
];

function DesktopItem({ item }: { item: NavItem }) {
  if (!isGroup(item)) {
    return (
      <Link
        href={item.href}
        className="whitespace-nowrap text-xs font-medium text-gold transition-colors hover:text-cream"
      >
        {item.label}
      </Link>
    );
  }
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1 whitespace-nowrap text-xs font-medium uppercase tracking-[0.08em] text-gold transition-colors hover:text-cream"
        aria-haspopup="menu"
      >
        {item.label}
        <ChevronDown className="h-3 w-3" aria-hidden />
      </button>
      <div
        role="menu"
        className="invisible absolute right-0 z-40 mt-2 min-w-[16rem] rounded-md border border-gold/40 bg-ink/98 p-2 opacity-0 shadow-lg shadow-black/40 backdrop-blur transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
      >
        {item.children.map((child) => (
          <Link
            key={child.label}
            role="menuitem"
            href={child.href}
            className="block rounded px-3 py-2 text-xs text-gold transition-colors hover:bg-card-border/40 hover:text-cream"
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

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
            <DesktopItem key={item.label} item={item} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <MarketClock />

          {/* Mobile / mid-width: collapse nav to a Sheet (flatten groups). */}
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
                {NAV.flatMap((item) =>
                  isGroup(item)
                    ? [
                        <div
                          key={`${item.label}-header`}
                          className="mt-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-muted"
                        >
                          {item.label}
                        </div>,
                        ...item.children.map((child) => (
                          <SheetClose asChild key={`${item.label}-${child.label}`}>
                            <Link
                              href={child.href}
                              className="rounded px-3 py-2 text-sm text-gold transition-colors hover:bg-card-border/40 hover:text-cream"
                            >
                              {child.label}
                            </Link>
                          </SheetClose>
                        )),
                      ]
                    : [
                        <SheetClose asChild key={item.label}>
                          <Link
                            href={item.href}
                            className="rounded px-2 py-2 text-sm text-gold transition-colors hover:bg-card-border/40 hover:text-cream"
                          >
                            {item.label}
                          </Link>
                        </SheetClose>,
                      ],
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
