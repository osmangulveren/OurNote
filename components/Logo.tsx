import { config } from "@/lib/config";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-baseline gap-2 ${className}`}>
      <span className="font-display text-[26px] leading-none tracking-tight">{config.brandName}</span>
      <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.2em] text-stone sm:inline">Trade</span>
    </span>
  );
}
