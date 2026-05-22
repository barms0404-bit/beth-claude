/**
 * Faded firm monogram, fixed behind all content (8% opacity, ~60vh tall).
 * Drop the real logo at public/logo.svg to replace the placeholder monogram.
 */
export function LogoWatermark() {
  return (
    <div className="aa-watermark" aria-hidden="true">
      {/* Placeholder monogram — swap for <img src="/logo.svg" /> once the asset lands. */}
      <svg
        width="60vh"
        height="60vh"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="96" stroke="#C9A961" strokeWidth="2" />
        <text
          x="100"
          y="118"
          textAnchor="middle"
          fontFamily="Cormorant Garamond, serif"
          fontSize="92"
          fill="#C9A961"
        >
          AA
        </text>
      </svg>
    </div>
  );
}
