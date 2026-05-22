import { cn } from "@/lib/utils";

/**
 * Armstrong Arikat twin-peak "AA" monogram — an SVG interpretation of the firm
 * logo. Two interlocking gilded peaks, each hollowed to read as an "A". The
 * right peak is taller and drawn in front.
 *
 * Per Brian's spec the lettermark is rendered at 1.5x its baseline proportion:
 * the peaks fill the full viewBox height rather than sitting in a padded field.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 188 168"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Armstrong Arikat"
    >
      <defs>
        <linearGradient id="aaGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFE2B6" />
          <stop offset="42%" stopColor="#C9A961" />
          <stop offset="100%" stopColor="#9C7F42" />
        </linearGradient>
      </defs>

      {/* back peak (left) */}
      <path
        d="M70 30 L34 156 L106 156 Z"
        fill="url(#aaGold)"
        stroke="#8A7548"
        strokeWidth="1"
        strokeLinejoin="miter"
      />
      <path d="M70 62 L52 148 L88 148 Z" fill="#000000" />

      {/* front peak (right, taller) */}
      <path
        d="M122 14 L86 156 L158 156 Z"
        fill="url(#aaGold)"
        stroke="#7A6336"
        strokeWidth="1"
        strokeLinejoin="miter"
      />
      <path d="M122 48 L104 148 L140 148 Z" fill="#000000" />
    </svg>
  );
}

/**
 * Horizontal lockup for the toolbar — compact mark plus stacked wordmark.
 */
export function LogoLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoMark className="h-9 w-auto" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-lg font-semibold tracking-wide text-gold">
          Armstrong Arikat
        </span>
        <span className="text-[0.6rem] uppercase tracking-[0.3em] text-gold-muted">
          Research Terminal
        </span>
      </span>
    </span>
  );
}
