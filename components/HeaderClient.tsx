"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";

type Props = {
  logo: React.ReactNode;
  role: "ADMIN" | "BUYER" | null;
  company: string | null;
  cart: { lines: number; volume: number };
  logout: () => Promise<void>;
};

const links = [
  { href: "/catalog", label: "Collection" },
  { href: "/fabrics", label: "Fabrics" },
  { href: "/departures", label: "Trucks" },
];

export default function HeaderClient({ logo, role, company, cart, logout }: Props) {
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useMotionValueEvent(scrollY, "change", (y) => setCompact(y > 24));
  useEffect(() => setOpen(false), [path]);

  const nav = [
    ...links,
    ...(role === "BUYER" ? [{ href: "/orders", label: "Orders" }] : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 print:hidden">
        <motion.div
          animate={{ paddingTop: compact ? 10 : 18, paddingBottom: compact ? 10 : 18 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`transition-colors duration-500 ${compact || open ? "bg-bone/80 shadow-[0_1px_0_rgba(28,27,24,.08)] backdrop-blur-xl" : "bg-transparent"}`}
        >
          <div className="container-page flex items-center gap-8">
            <Link href="/" aria-label="Home">{logo}</Link>
            <nav className="hidden flex-1 items-center gap-7 text-[14px] text-ink-2 md:flex">
              {nav.map((l) => (
                <Link key={l.href} href={l.href} className={`link-underline ${path.startsWith(l.href) ? "text-ink" : ""}`}>
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              {role === "BUYER" && (
                <Link href="/cart" className="group flex items-center gap-2.5 rounded-full bg-ink py-1.5 pl-3 pr-1.5 text-[13px] text-paper transition hover:bg-ink-2">
                  <TruckIcon />
                  <span className="num">{cart.volume.toFixed(1)} m³</span>
                  <span className="grid h-6 min-w-6 place-items-center rounded-full bg-paper px-1.5 text-[11px] font-semibold text-ink num">{cart.lines}</span>
                </Link>
              )}
              {role ? (
                <div className="hidden items-center gap-1 md:flex">
                  <Link href={role === "ADMIN" ? "/admin" : "/account"} className="btn-ghost max-w-[180px] truncate">{company ?? "Account"}</Link>
                  <form action={logout}><button className="btn-ghost text-stone">Log out</button></form>
                </div>
              ) : (
                <div className="hidden items-center gap-2 md:flex">
                  <Link href="/login" className="btn-ghost">Log in</Link>
                  <Link href="/register" className="btn-primary">Open trade account</Link>
                </div>
              )}
              <button onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-ink/15 md:hidden" aria-label="Menu" aria-expanded={open}>
                <span className="relative block h-3 w-5">
                  <span className={`absolute left-0 top-0 h-px w-5 bg-ink transition ${open ? "translate-y-1.5 rotate-45" : ""}`} />
                  <span className={`absolute bottom-0 left-0 h-px w-5 bg-ink transition ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30 bg-bone pt-24 md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <nav className="container-page flex flex-col">
              {[...nav, ...(role ? [{ href: "/account", label: "Account" }] : [{ href: "/login", label: "Log in" }, { href: "/register", label: "Open trade account" }])].map((l, i) => (
                <motion.div key={l.href} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.05 }}>
                  <Link href={l.href} className="flex items-baseline justify-between border-b border-line py-4 font-display text-4xl">
                    {l.label}
                    <span className="font-mono text-xs text-stone">0{i + 1}</span>
                  </Link>
                </motion.div>
              ))}
              {role && (
                <form action={logout} className="pt-6"><button className="btn-outline">Log out</button></form>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function TruckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      <path d="M2 6h12v10H2zM14 9h4l3 3v4h-7z" strokeLinejoin="round" />
      <circle cx="6" cy="17.5" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="17" cy="17.5" r="1.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
