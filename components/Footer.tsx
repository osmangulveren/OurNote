import Link from "next/link";
import { config } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="relative z-[2] mt-32 bg-ink text-bone print:hidden">
      <div className="container-page grid gap-12 py-20 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="font-display text-5xl leading-none">{config.brandName}</div>
          <p className="mt-4 max-w-xs text-sm text-stone-2">
            Upholstered furniture made in Anatolian workshops, sold under one brand and delivered to European retailers by truck.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <div className="eyebrow mb-4 text-stone">Buy</div>
          <Link href="/catalog" className="block hover:text-paper/70">Collection</Link>
          <Link href="/fabrics" className="block hover:text-paper/70">Fabrics & swatches</Link>
          <Link href="/departures" className="block hover:text-paper/70">Truck departures</Link>
        </div>
        <div className="space-y-2 text-sm">
          <div className="eyebrow mb-4 text-stone">Account</div>
          <Link href="/register" className="block hover:text-paper/70">Open trade account</Link>
          <Link href="/orders" className="block hover:text-paper/70">Track orders</Link>
          <a href={`mailto:${config.company.email}`} className="block hover:text-paper/70">{config.company.email}</a>
        </div>
        <div className="space-y-1 text-sm text-stone-2">
          <div className="eyebrow mb-4 text-stone">Seller of record</div>
          <div className="text-bone">{config.company.legalName}</div>
          <div>{config.company.address}</div>
          <div className="num">VAT {config.company.vat}</div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col justify-between gap-2 py-6 font-mono text-[11px] uppercase tracking-[0.16em] text-stone sm:flex-row">
          <span>Made in Türkiye · Invoiced in Romania · Delivered across the EU</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
