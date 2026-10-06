"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

export default function CountUp({ value, decimals = 0, prefix = "", suffix = "" }: { value: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const c = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.textContent = `${prefix}${v.toLocaleString("en-IE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`),
    });
    return () => c.stop();
  }, [inView, value, decimals, prefix, suffix]);
  return <span ref={ref} className="num">{prefix}{(0).toFixed(decimals)}{suffix}</span>;
}
