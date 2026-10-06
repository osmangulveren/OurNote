import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import TechDrawing from "@/components/TechDrawing";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { fabricOf } from "@/lib/fabrics";
import { money, parseJson } from "@/lib/format";
import { shapeOf } from "@/lib/shape";

export const metadata = { title: "Product sheet" };

/** Customer-facing product sheet a store can print for its sales floor (no trade prices). */
export default async function SheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await db.product.findUnique({ where: { slug: (await params).slug } });
  if (!p) notFound();
  const specs = parseJson<{ label: string; value: string }[]>(p.specs, []);
  const colors = parseJson<string[]>(p.colors, []);
  return (
    <div className="mx-auto max-w-[210mm] bg-paper px-10 py-14 pt-28 print:pt-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="eyebrow">{config.brandName} · {p.sku}</div>
          <h1 className="display mt-2 text-6xl">{p.name}</h1>
          <p className="mt-3 max-w-md text-ink-3">{p.shortDescription}</p>
        </div>
        <div className="text-right">
          {p.rrp > 0 && <div className="num font-display text-5xl">{money(p.rrp)}</div>}
          <div className="mt-4 print:hidden"><PrintButton /></div>
        </div>
      </div>
      <TechDrawing shape={shapeOf(p)} className="rounded-2xl bg-bone p-6 ring-1 ring-line" />
      <div className="mt-8 grid grid-cols-2 gap-x-10">
        {[["Dimensions", p.dimensions], ["Upholstery", p.material], ...specs.map((s) => [s.label, s.value])].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-line py-2.5 text-sm"><span className="text-stone">{k}</span><span>{v}</span></div>
        ))}
      </div>
      <div className="mt-8">
        <div className="eyebrow mb-3">Available fabrics</div>
        <div className="flex flex-wrap gap-3">
          {colors.map((c) => (
            <div key={c} className="flex items-center gap-2 text-sm"><span className="h-5 w-5 rounded-full" style={{ background: fabricOf(c).hex }} />{c}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
