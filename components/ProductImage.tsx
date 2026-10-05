/* eslint-disable @next/next/no-img-element */
const palettes = [
  ["#e3eaf5", "#2f5aa8"], ["#f6ece2", "#bf6620"], ["#e7f0ea", "#3c7a55"],
  ["#efe9f5", "#6a4c93"], ["#f1efe9", "#7a6a4f"], ["#e6eff3", "#2f6f8a"],
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export default function ProductImage({
  src, name, category, className = "",
}: { src?: string; name: string; category?: string; className?: string }) {
  if (src) {
    return <img src={src} alt={name} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  }
  const [bg, fg] = palettes[hash(category ?? name) % palettes.length];
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center ${className}`} style={{ background: bg, color: fg }}>
      <svg viewBox="0 0 64 40" className="h-12 w-20 opacity-80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <rect x="4" y="14" width="10" height="20" rx="4" />
        <rect x="50" y="14" width="10" height="20" rx="4" />
        <rect x="14" y="6" width="36" height="16" rx="3" />
        <rect x="14" y="22" width="36" height="9" rx="2" />
        <path d="M9 34v3M55 34v3" />
      </svg>
      <span className="line-clamp-2 text-xs font-semibold opacity-80">{name}</span>
    </div>
  );
}
