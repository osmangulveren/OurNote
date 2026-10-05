import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { config } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${config.brandName} – Wholesale`, template: `%s · ${config.brandName}` },
  description: `Wholesale furniture for European retailers, delivered directly to your store by ${config.company.legalName}.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="print:hidden mt-16 border-t border-slate-200 bg-white">
          <div className="container-page flex flex-col gap-2 py-8 text-sm text-slate-500 sm:flex-row sm:justify-between">
            <div>
              <div className="font-semibold text-slate-700">{config.company.legalName}</div>
              <div>{config.company.address} · VAT {config.company.vat}</div>
            </div>
            <div className="flex gap-4">
              <Link href="/catalog" className="hover:text-slate-700">Catalog</Link>
              <a href={`mailto:${config.company.email}`} className="hover:text-slate-700">{config.company.email}</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
