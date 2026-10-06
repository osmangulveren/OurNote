export default function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {items.map((t) => (
        <span key={t} className="flex items-center gap-10 whitespace-nowrap">
          <span>{t}</span>
          <svg width="14" height="14" viewBox="0 0 14 14" className="opacity-50" aria-hidden><path d="M7 0v14M0 7h14" stroke="currentColor" strokeWidth="1" /></svg>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`flex overflow-hidden ${className}`} aria-label={items.join(", ")}>
      <div className="flex animate-marquee">{row}{row}</div>
    </div>
  );
}
