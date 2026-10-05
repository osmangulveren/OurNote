import ImportForm from "./ImportForm";

export const metadata = { title: "Import catalog" };

const example = `{
  "categories": [{ "slug": "sofa-beds", "name": "Sofa Beds", "description": "..." }],
  "products": [{
    "sku": "SB-190", "name": "Milano Sofa Bed", "category": "sofa-beds",
    "shortDescription": "...", "description": "...",
    "images": ["https://..."], "price": 389, "moq": 4, "unit": "pcs",
    "priceTiers": [{ "minQty": 10, "price": 369 }],
    "dimensions": "190 × 90 × 85 cm", "volumeM3": 1.25, "weightKg": 78,
    "material": "Velvet", "colors": ["Beige", "Grey"],
    "specs": [{ "label": "Seat height", "value": "45 cm" }],
    "leadTimeDays": 25, "supplierName": "(internal)", "supplierPrice": 250,
    "sourceUrl": "https://www.alibaba.com/product-detail/..."
  }]
}`;

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Import catalog</h1>
        <p className="muted mt-1">
          Products are matched by SKU: existing ones are updated, new ones are created, nothing is deleted.
          The same format is produced by <code className="rounded bg-slate-100 px-1">npm run catalog:scrape</code> (Alibaba store scraper).
        </p>
      </div>
      <ImportForm />
      <details className="card p-6">
        <summary className="cursor-pointer font-semibold">JSON format</summary>
        <pre className="mt-4 overflow-x-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{example}</pre>
      </details>
    </div>
  );
}
