"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CITIES, COUNTRY_POINT, project, routeTo } from "@/lib/geo";

const REF_CITIES: [string, [number, number]][] = [
  ["Paris", [2.35, 48.86]], ["Berlin", [13.4, 52.52]], ["Warsaw", [21.01, 52.23]], ["Rome", [12.5, 41.9]],
  ["Madrid", [-3.7, 40.42]], ["Amsterdam", [4.9, 52.37]], ["Prague", [14.42, 50.08]], ["Athens", [23.73, 37.98]],
  ["Copenhagen", [12.57, 55.68]], ["Belgrade", [20.46, 44.79]], ["Milan", [9.19, 45.46]], ["Vienna", CITIES.Vienna], ["Ankara", [32.85, 39.93]],
];

/** Fraction of the route covered at each truck stage (border stages snap to Kapıkule). */
function progressFor(stage: string, borderAt: number) {
  switch (stage) {
    case "LOADING": return 0.02;
    case "DEPARTED": return borderAt * 0.6;
    case "AT_BORDER": return borderAt;
    case "CUSTOMS_CLEARED": return borderAt + 0.04;
    case "IN_TRANSIT_EU": return 0.6;
    case "DELIVERING": return 0.9;
    case "COMPLETED":
    case "DELIVERED": return 1;
    default: return 0;
  }
}

function smoothPath(pts: (readonly [number, number])[]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export default function RouteMap({ country, stage, label, className = "" }: { country: string; stage: string; label?: string; className?: string }) {
  const route = useMemo(() => routeTo(country), [country]);
  const pts = route.map((r) => project(r.at));
  const d = smoothPath(pts);
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const totalLen = seg.reduce((a, b) => a + b, 0);
  const borderAt = seg[0] / totalLen;
  const progress = progressFor(stage, borderAt);

  const pathRef = useRef<SVGPathElement>(null);
  const [truck, setTruck] = useState<{ x: number; y: number; a: number } | null>(null);
  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const L = p.getTotalLength();
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 2200);
      const e = 1 - Math.pow(1 - k, 3);
      const at = Math.max(0.001, progress * e) * L;
      const a = p.getPointAtLength(at), b = p.getPointAtLength(Math.min(L, at + 2));
      setTruck({ x: a.x, y: a.y, a: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI });
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, d]);

  const dots = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = 10; x < 1000; x += 22) for (let y = 10; y < 700; y += 22) out.push([x, y]);
    return out;
  }, []);
  const dest = COUNTRY_POINT[country] ? project(COUNTRY_POINT[country]) : pts.at(-1)!;

  return (
    <div className={`relative overflow-hidden [perspective:1600px] ${className}`}>
      <div className="h-full w-full origin-center [transform:rotateX(34deg)_scale(1.12)] [transform-style:preserve-3d]">
        <svg viewBox="0 0 1000 700" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="fade" cx="50%" cy="55%" r="60%">
              <stop offset="0" stopColor="#1c1b18" stopOpacity=".22" />
              <stop offset="1" stopColor="#1c1b18" stopOpacity="0" />
            </radialGradient>
            <mask id="m"><rect width="1000" height="700" fill="url(#fade)" /></mask>
          </defs>
          <g mask="url(#m)">
            {dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} fill="#1c1b18" opacity={0.9} />)}
          </g>
          {REF_CITIES.map(([n, at]) => {
            const [x, y] = project(at);
            return (
              <g key={n} opacity={0.45}>
                <circle cx={x} cy={y} r={3} fill="#8a857b" />
                <text x={x + 7} y={y + 4} fontSize={13} fill="#5c5850" fontFamily="JetBrains Mono Variable, monospace">{n}</text>
              </g>
            );
          })}
          <path d={d} fill="none" stroke="#b3ada2" strokeWidth={2.5} strokeDasharray="2 9" strokeLinecap="round" />
          <motion.path
            ref={pathRef}
            d={d}
            fill="none"
            stroke="#b5532f"
            strokeWidth={4}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: Math.max(0.001, progress) }}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          />
          {route.map((r, i) => {
            const [x, y] = pts[i];
            const last = i === route.length - 1;
            return (
              <g key={r.name}>
                <circle cx={x} cy={y} r={last ? 9 : 6} fill={last ? "#1c1b18" : "#faf8f3"} stroke="#1c1b18" strokeWidth={2} />
                {last && <circle cx={x} cy={y} r={18} fill="none" stroke="#1c1b18" strokeOpacity={0.25}><animate attributeName="r" values="10;26;10" dur="2.4s" repeatCount="indefinite" /><animate attributeName="stroke-opacity" values=".35;0;.35" dur="2.4s" repeatCount="indefinite" /></circle>}
                <text x={x} y={y - 16} fontSize={16} textAnchor="middle" fill="#1c1b18" fontFamily="Instrument Sans Variable, sans-serif" fontWeight={500}>{last ? label ?? r.name : r.name}</text>
              </g>
            );
          })}
          {truck && (
            <g transform={`translate(${truck.x} ${truck.y})`}>
              <circle r={22} fill="#b5532f" opacity={0.15} />
              <g transform={`rotate(${truck.a})`}>
                <rect x={-15} y={-8} width={22} height={16} rx={2} fill="#1c1b18" />
                <rect x={7} y={-7} width={9} height={14} rx={3} fill="#b5532f" />
              </g>
            </g>
          )}
          <circle cx={dest[0]} cy={dest[1]} r={0} />
        </svg>
      </div>
    </div>
  );
}
