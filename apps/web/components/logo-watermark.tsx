import { LogoMark } from "@/components/logo";

/**
 * Faded firm monogram, fixed behind all content — 60vh tall, 8% opacity,
 * z-index 0 (the `.aa-watermark` class in globals.css owns position/opacity).
 */
export function LogoWatermark() {
  return (
    <div className="aa-watermark" aria-hidden="true">
      <LogoMark className="h-[60vh] w-auto" />
    </div>
  );
}
