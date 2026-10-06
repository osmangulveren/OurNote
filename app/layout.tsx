import type { Metadata, Viewport } from "next";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SmoothScroll from "@/components/motion/SmoothScroll";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${config.brandName} — Trade`, template: `%s · ${config.brandName}` },
  description: `Wholesale upholstered furniture for European retailers. Delivered prices, shared trucks, live tracking.`,
};

export const viewport: Viewport = { themeColor: "#f3efe7" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <SmoothScroll />
        <Header />
        <main className="relative flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
