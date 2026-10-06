"use client";

import { Stage } from "@/components/three";
import type { Shape } from "@/lib/shape";

const chair: Shape = { type: "armchair", width: 80, depth: 75, height: 78, armWidth: 16, seatHeight: 42, armHeight: 60, legs: "hidden", curved: true };

export default function AuthShell({ children, aside }: { children: React.ReactNode; aside: React.ReactNode }) {
  return (
    <div className="container-page grid min-h-screen gap-10 pb-10 pt-24 md:pt-28 lg:grid-cols-[1fr_1fr]">
      <div className="flex flex-col justify-center py-6">{children}</div>
      <div className="relative hidden overflow-hidden rounded-[28px] bg-ink lg:block">
        <Stage shape={chair} hex="#a8573a" kind="velvet" autoRotate controls={false} className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/70 to-transparent p-10 text-bone">{aside}</div>
      </div>
    </div>
  );
}
