import type { Category, Product } from "@prisma/client";
import { saveProduct } from "@/app/actions/admin";
import { parseJson } from "@/lib/format";

export default function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const tiers = parseJson<{ minQty: number; price: number }[]>(product?.priceTiers, []);
  const specs = parseJson<{ label: string; value: string }[]>(product?.specs, []);
  const F = ({ name, label, def, type = "text", span }: { name: string; label: string; def?: string | number; type?: string; span?: boolean }) => (
    <div className={span ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      <input name={name} type={type} step={type === "number" ? "any" : undefined} defaultValue={def ?? ""} className="input" />
    </div>
  );
  return (
    <form action={saveProduct} className="space-y-6">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <section className="card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Basics</h2>
        <F name="name" label="Product name (your brand)" def={product?.name} span />
        <F name="sku" label="SKU" def={product?.sku} />
        <div>
          <label className="label">Category</label>
          <select name="categoryId" defaultValue={product?.categoryId} className="input" required>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <F name="shortDescription" label="Short description (one line)" def={product?.shortDescription} span />
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" rows={4} defaultValue={product?.description} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Image URLs (one per line)</label>
          <textarea name="images" rows={3} defaultValue={parseJson<string[]>(product?.images, []).join("\n")} className="input font-mono text-xs" />
        </div>
        <div className="flex gap-6 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Active (visible)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={product?.featured} /> Best seller (home page)</label>
        </div>
      </section>

      <section className="card grid gap-4 p-6 sm:grid-cols-3">
        <h2 className="font-bold sm:col-span-3">Wholesale pricing (EUR, excl. VAT)</h2>
        <F name="price" label="Base price / unit" def={product?.price} type="number" />
        <F name="moq" label="Minimum order qty" def={product?.moq ?? 1} type="number" />
        <F name="unit" label="Unit (pcs, set…)" def={product?.unit ?? "pcs"} />
        <div className="sm:col-span-3">
          <label className="label">Volume tiers — one per line as quantity:price</label>
          <textarea name="priceTiers" rows={3} defaultValue={tiers.map((t) => `${t.minQty}:${t.price}`).join("\n")} className="input font-mono text-xs" placeholder={"10:369\n30:349"} />
        </div>
      </section>

      <section className="card grid gap-4 p-6 sm:grid-cols-3">
        <h2 className="font-bold sm:col-span-3">Product & logistics data</h2>
        <F name="dimensions" label="Dimensions" def={product?.dimensions} />
        <F name="material" label="Material / fabric" def={product?.material} />
        <F name="colors" label="Colours (comma separated)" def={parseJson<string[]>(product?.colors, []).join(", ")} />
        <F name="volumeM3" label="Packed volume m³ / unit" def={product?.volumeM3} type="number" />
        <F name="weightKg" label="Packed weight kg / unit" def={product?.weightKg} type="number" />
        <F name="unitsPerCarton" label="Packages per unit" def={product?.unitsPerCarton ?? 1} type="number" />
        <F name="leadTimeDays" label="Production lead time (days)" def={product?.leadTimeDays ?? 21} type="number" />
        <div className="sm:col-span-3">
          <label className="label">Specifications — one per line as Label: Value</label>
          <textarea name="specs" rows={5} defaultValue={specs.map((s) => `${s.label}: ${s.value}`).join("\n")} className="input font-mono text-xs" />
        </div>
      </section>

      <section className="card grid gap-4 border-dashed bg-slate-50 p-6 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <h2 className="font-bold">Sourcing (internal — never shown to buyers)</h2>
        </div>
        <F name="supplierName" label="Manufacturer" def={product?.supplierName} />
        <F name="supplierPrice" label="Purchase price (EUR)" def={product?.supplierPrice} type="number" />
        <F name="sourceUrl" label="Source URL (e.g. Alibaba)" def={product?.sourceUrl} />
      </section>

      <button className="btn-primary">Save product</button>
    </form>
  );
}
