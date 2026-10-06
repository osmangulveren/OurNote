import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.ts"],
  theme: {
    extend: {
      colors: {
        bone: "#f3efe7",
        paper: "#faf8f3",
        ink: { DEFAULT: "#1c1b18", 2: "#3a3833", 3: "#5c5850" },
        stone: { DEFAULT: "#8a857b", 2: "#b3ada2" },
        line: { DEFAULT: "#ddd6c9", 2: "#e9e3d8" },
        clay: { DEFAULT: "#b5532f", 2: "#8f3f22", 3: "#f1ddd2" },
        moss: { DEFAULT: "#4f5b3a", 2: "#e3e6d8" },
        sand: "#d8c8ae",
        // Legacy aliases used by admin screens
        brand: { 50: "#f6f3ec", 100: "#ece5d8", 200: "#ddd6c9", 500: "#3a3833", 600: "#1c1b18", 700: "#1c1b18", 900: "#1c1b18" },
        accent: { 500: "#b5532f", 600: "#8f3f22" },
      },
      fontFamily: {
        display: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"Instrument Sans Variable"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.04em" },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "pulse-dot": { "0%,100%": { opacity: "1" }, "50%": { opacity: ".35" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "pulse-dot": "pulse-dot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
