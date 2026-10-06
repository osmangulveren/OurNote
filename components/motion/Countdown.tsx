"use client";

import { useEffect, useState } from "react";

/** Live "3d 04h 12m" countdown to a date. */
export default function Countdown({ to, className = "" }: { to: string | Date; className?: string }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return <span className={className}>&nbsp;</span>;
  const ms = Math.max(0, target - now);
  const d = Math.floor(ms / 864e5);
  const h = Math.floor((ms % 864e5) / 36e5);
  const m = Math.floor((ms % 36e5) / 6e4);
  return (
    <span className={`num ${className}`}>
      {d}d {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m
    </span>
  );
}
