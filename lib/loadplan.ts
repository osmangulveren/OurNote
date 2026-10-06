// Very small "good enough" load planner for a 13.6 m curtain-sider: rows across the
// trailer width, stacking identical-or-smaller footprints. Used only for visualisation.

export const TRAILER = { length: 13.6, width: 2.45, height: 2.6 };

export type PlanItem = { key: string; color: string; w: number; d: number; h: number; qty: number; mine: boolean };
export type Placed = { key: string; color: string; mine: boolean; x: number; y: number; z: number; sx: number; sy: number; sz: number; overflow: boolean };

export function planLoad(items: PlanItem[]) {
  const boxes: Omit<Placed, "x" | "y" | "z" | "overflow">[] = [];
  for (const it of items) {
    // Upright furniture: keep height, turn the long side across the trailer if it fits.
    const long = Math.max(it.w, it.d), short = Math.min(it.w, it.d);
    const sz = Math.min(long <= TRAILER.width ? long : short, TRAILER.width);
    const sx = long <= TRAILER.width ? short : long;
    const sy = Math.min(it.h, TRAILER.height);
    for (let i = 0; i < it.qty; i++) boxes.push({ key: it.key, color: it.color, mine: it.mine, sx, sy, sz });
  }
  // Others first (already booked, loaded at the front), then by footprint.
  boxes.sort((p, q) => Number(p.mine) - Number(q.mine) || q.sx * q.sz - p.sx * p.sz || q.sy - p.sy);

  type Stack = { x: number; z: number; sx: number; sz: number; top: number };
  type Row = { x: number; depth: number; zUsed: number };
  const stacks: Stack[] = [];
  const rows: Row[] = [];
  let nextX = 0;
  const placed: Placed[] = [];
  const eps = 0.001;
  for (const b of boxes) {
    // 1) on top of an existing stack with a footprint at least as large
    const s = stacks.find((st) => b.sx <= st.sx + eps && b.sz <= st.sz + eps && st.top + b.sy <= TRAILER.height + eps);
    if (s) {
      placed.push({ ...b, x: s.x + b.sx / 2, z: s.z + b.sz / 2, y: s.top + b.sy / 2, overflow: s.x + b.sx > TRAILER.length + eps });
      s.top += b.sy;
      continue;
    }
    // 2) in the leftover width of an existing row (either orientation)
    const orientations = [[b.sx, b.sz], [b.sz, b.sx]].filter(([, z]) => z <= TRAILER.width + eps);
    let spot: { row: Row; sx: number; sz: number } | null = null;
    for (const row of rows) {
      for (const [ox, oz] of orientations) {
        if (row.zUsed + oz <= TRAILER.width + eps && ox <= row.depth + eps) { spot = { row, sx: ox, sz: oz }; break; }
      }
      if (spot) break;
    }
    // 3) otherwise start a new row, long side across the trailer when it fits
    if (!spot) {
      const [ox, oz] = orientations.sort((p, q) => p[0] - q[0])[0] ?? [b.sx, b.sz];
      const row = { x: nextX, depth: ox, zUsed: 0 };
      rows.push(row);
      nextX += ox;
      spot = { row, sx: ox, sz: oz };
    }
    const { row, sx, sz } = spot;
    stacks.push({ x: row.x, z: row.zUsed, sx, sz, top: b.sy });
    placed.push({ ...b, sx, sz, x: row.x + sx / 2, z: row.zUsed + sz / 2, y: b.sy / 2, overflow: row.x + sx > TRAILER.length + eps });
    row.zUsed += sz;
  }
  const usedLength = Math.min(TRAILER.length, nextX);
  return { placed, usedLength, overflow: placed.some((p) => p.overflow) };
}

/** Booked volume of other stores, shown as generic crates that tile the trailer (2 across, 2 high). */
export function otherCrates(volume: number): PlanItem | null {
  const crate = 1.2 * 1.2 * 1.3;
  const qty = Math.round(volume / crate);
  return qty > 0 ? { key: "others", color: "#b3ada2", w: 1.2, d: 1.2, h: 1.3, qty, mine: false } : null;
}
