import Link from "next/link";

export type ViewMode = "grid" | "list";

export default function ViewModeToggle({
  mode,
  baseUrl,
  searchParams,
}: {
  mode: ViewMode;
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
}) {
  function build(target: ViewMode) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "view") sp.set(k, v);
    }
    sp.set("view", target);
    return `${baseUrl}?${sp.toString()}`;
  }
  return (
    <div className="inline-flex border border-slate-300 rounded-full overflow-hidden text-xs">
      <Link
        href={build("grid")}
        prefetch={false}
        className={`px-3 py-1.5 ${mode === "grid" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
      >
        ▦ Galeri
      </Link>
      <Link
        href={build("list")}
        prefetch={false}
        className={`px-3 py-1.5 ${mode === "list" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
      >
        ☰ Liste
      </Link>
    </div>
  );
}

export function parseView(v?: string): ViewMode {
  return v === "list" ? "list" : "grid";
}
