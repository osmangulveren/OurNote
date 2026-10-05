import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.ts"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f6fb",
          100: "#e3eaf5",
          200: "#c4d3ea",
          500: "#2f5aa8",
          600: "#244a8f",
          700: "#1d3b73",
          900: "#0f1f3d",
        },
        accent: { 500: "#d97a2b", 600: "#bf6620" },
      },
    },
  },
  plugins: [],
} satisfies Config;
