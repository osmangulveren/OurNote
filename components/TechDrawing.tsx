import type { Shape } from "@/lib/shape";

/** Front + side elevations with dimension lines, generated from the product's dimensions (cm). */
export default function TechDrawing({ shape: s, className = "" }: { shape: Shape; className?: string }) {
  const W = s.width, D = s.type === "corner" ? (s.chaiseDepth ?? 160) : s.depth, H = s.height;
  const aw = s.armWidth ?? 20, sh = s.seatHeight ?? 45, ah = s.armHeight ?? Math.min(65, H - 18);
  const leg = s.legs === "hidden" ? 2 : 9;
  const sofaLike = ["sofa", "corner", "armchair"].includes(s.type);
  const gap = 40;
  const extra = s.openDepth && s.type !== "corner" ? Math.max(0, s.openDepth - D) : 0;
  const vw = W + gap + D + extra + 60, vh = H + 60;
  const ox = 30, fy = H + 20; // front view origin (floor line)
  const sx = ox + W + gap; // side view origin
  const stroke = { stroke: "#1c1b18", strokeWidth: 0.6, fill: "none" } as const;
  const thin = { stroke: "#1c1b18", strokeWidth: 0.25, fill: "none" } as const;
  const dimC = "#8a857b";

  const Dim = ({ x1, y1, x2, y2, label, off = 8, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; off?: number; vertical?: boolean }) =>
    vertical ? (
      <g>
        <line x1={x1 - off} y1={y1} x2={x2 - off} y2={y2} stroke={dimC} strokeWidth={0.3} />
        <line x1={x1 - off - 2} y1={y1} x2={x1 - off + 2} y2={y1} stroke={dimC} strokeWidth={0.3} />
        <line x1={x2 - off - 2} y1={y2} x2={x2 - off + 2} y2={y2} stroke={dimC} strokeWidth={0.3} />
        <text x={x1 - off - 2.5} y={(y1 + y2) / 2} fontSize={4.2} fill={dimC} textAnchor="middle" transform={`rotate(-90 ${x1 - off - 2.5} ${(y1 + y2) / 2})`} fontFamily="JetBrains Mono Variable, monospace">{label}</text>
      </g>
    ) : (
      <g>
        <line x1={x1} y1={y1 + off} x2={x2} y2={y2 + off} stroke={dimC} strokeWidth={0.3} />
        <line x1={x1} y1={y1 + off - 2} x2={x1} y2={y1 + off + 2} stroke={dimC} strokeWidth={0.3} />
        <line x1={x2} y1={y2 + off - 2} x2={x2} y2={y2 + off + 2} stroke={dimC} strokeWidth={0.3} />
        <text x={(x1 + x2) / 2} y={y1 + off - 1.5} fontSize={4.2} fill={dimC} textAnchor="middle" fontFamily="JetBrains Mono Variable, monospace">{label}</text>
      </g>
    );

  const r = Math.min(aw * 0.4, 12);
  return (
    <svg viewBox={`0 0 ${vw} ${vh + 14}`} className={className} role="img" aria-label={`Technical drawing ${W} × ${D} × ${H} cm`}>
      {/* floor lines */}
      <line x1={ox - 10} y1={fy} x2={ox + W + 10} y2={fy} {...stroke} />
      <line x1={sx - 10} y1={fy} x2={sx + D + 10} y2={fy} {...stroke} />

      {sofaLike ? (
        <>
          {/* FRONT */}
          {Array.from({ length: Math.max(1, s.backCushions ?? 3) }, (_, i) => {
            const cw = (W - 2 * aw) / Math.max(1, s.backCushions ?? 3);
            return s.backCushions === 0 ? null : <rect key={i} x={ox + aw + i * cw + 0.6} y={fy - H} width={cw - 1.2} height={H - sh} rx={5} {...stroke} />;
          })}
          {s.backCushions === 0 && <rect x={ox + aw} y={fy - H} width={W - 2 * aw} height={H - sh} rx={10} {...stroke} />}
          <rect x={ox + aw} y={fy - sh} width={W - 2 * aw} height={13} rx={3} {...stroke} />
          {Array.from({ length: (s.seatCushions ?? 3) - 1 }, (_, i) => {
            const x = ox + aw + ((W - 2 * aw) / (s.seatCushions ?? 3)) * (i + 1);
            return <line key={i} x1={x} y1={fy - sh} x2={x} y2={fy - sh + 13} {...thin} />;
          })}
          <rect x={ox + aw + 1} y={fy - sh + 13} width={W - 2 * aw - 2} height={sh - 13 - leg} {...stroke} />
          {[0, W - aw].map((x) => (
            <path key={x} d={`M${ox + x},${fy - leg} V${fy - ah + r} Q${ox + x},${fy - ah} ${ox + x + r},${fy - ah} H${ox + x + aw - r} Q${ox + x + aw},${fy - ah} ${ox + x + aw},${fy - ah + r} V${fy - leg} Z`} {...stroke} />
          ))}
          {leg > 2 && [4, W - 9].map((x) => <rect key={x} x={ox + x} y={fy - leg} width={5} height={leg} fill="#1c1b18" />)}
          {/* SIDE */}
          <path d={`M${sx},${fy - leg} V${fy - ah + 8} Q${sx},${fy - ah} ${sx + 8},${fy - ah} H${sx + D - 8} Q${sx + D},${fy - ah} ${sx + D},${fy - ah + 8} V${fy - leg} Z`} {...stroke} />
          {s.channels && Array.from({ length: 6 }, (_, i) => <line key={i} x1={sx + (D / 7) * (i + 1)} y1={fy - ah + 10} x2={sx + (D / 7) * (i + 1)} y2={fy - leg - 3} {...thin} />)}
          {H > ah && <path d={`M${sx + 14},${fy - ah} L${sx + 10},${fy - H + 6} Q${sx + 12},${fy - H} ${sx + 20},${fy - H} Q${sx + 30},${fy - H} ${sx + 32},${fy - ah}`} {...stroke} />}
          {s.openDepth && s.type !== "corner" && (
            <rect x={sx + D - 2} y={fy - sh} width={s.openDepth - D} height={sh - leg} {...thin} strokeDasharray="2 1.2" />
          )}
          <Dim x1={ox} y1={fy - ah} x2={ox} y2={fy} label={`${ah}`} vertical off={8} />
          <Dim x1={ox + W} y1={fy - sh} x2={ox + W} y2={fy} label={`${sh}`} vertical off={-10} />
        </>
      ) : (
        <>
          <rect x={ox} y={fy - H} width={W} height={H} rx={s.type === "pouf" ? 8 : 3} {...stroke} />
          <rect x={sx} y={fy - H} width={D} height={H} rx={s.type === "pouf" ? 8 : 3} {...stroke} />
          {s.channels && Array.from({ length: Math.round(W / 15) - 1 }, (_, i) => <line key={i} x1={ox + (W / Math.round(W / 15)) * (i + 1)} y1={fy - H + 3} x2={ox + (W / Math.round(W / 15)) * (i + 1)} y2={fy - 3} {...thin} />)}
        </>
      )}
      <Dim x1={ox} y1={fy - H} x2={ox} y2={fy} label={`${H}`} vertical off={sofaLike ? 16 : 8} />
      <Dim x1={ox} y1={fy} x2={ox + W} y2={fy} label={`${W}`} off={8} />
      <Dim x1={sx} y1={fy} x2={sx + D} y2={fy} label={`${D}`} off={8} />
      {s.openDepth && s.type !== "corner" && <Dim x1={sx} y1={fy} x2={sx + s.openDepth} y2={fy} label={`${s.openDepth} open`} off={15} />}
      <text x={ox + W / 2} y={vh + 10} fontSize={4} textAnchor="middle" fill="#8a857b" fontFamily="JetBrains Mono Variable, monospace" letterSpacing={1}>FRONT</text>
      <text x={sx + D / 2} y={vh + 10} fontSize={4} textAnchor="middle" fill="#8a857b" fontFamily="JetBrains Mono Variable, monospace" letterSpacing={1}>SIDE · CM</text>
    </svg>
  );
}
