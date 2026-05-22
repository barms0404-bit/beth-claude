import type { Config } from "tailwindcss";

/**
 * Armstrong Arikat Private Wealth Group — design system.
 * Colors mirror the firm logo: pure black ground, logo gold, cream text.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // raw brand tokens — also exposed as CSS vars in globals.css
        ink: "#000000",
        gold: {
          DEFAULT: "#C9A961", // accent / logo gold
          dark: "#A88B4A",    // hover / pressed states
          muted: "#8A7548",   // secondary text
        },
        cream: "#F5E6C8",     // primary text
        card: {
          DEFAULT: "#0A0A0A",
          border: "#1F1A0F",
        },
        success: "#4ADE80",
        danger: "#EF4444",
        // shadcn semantic aliases -> brand tokens
        background: "#000000",
        foreground: "#F5E6C8",
        muted: { DEFAULT: "#0A0A0A", foreground: "#8A7548" },
        border: "#1F1A0F",
        ring: "#C9A961",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
