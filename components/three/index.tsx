"use client";

import dynamic from "next/dynamic";

const Placeholder = ({ className }: { className?: string }) => (
  <div className={`${className ?? ""} grid place-items-center`}>
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/10 border-t-ink/50" />
  </div>
);

export const Stage = dynamic(() => import("./Stage"), { ssr: false, loading: () => <Placeholder className="h-full w-full" /> });
export const ViewsCanvas = dynamic(() => import("./Stage").then((m) => m.ViewsCanvas), { ssr: false });
export const ModelThumb = dynamic(() => import("./Stage").then((m) => m.ModelThumb), { ssr: false });
export const TrailerStage = dynamic(() => import("./TrailerStage"), { ssr: false, loading: () => <Placeholder className="h-full w-full" /> });
