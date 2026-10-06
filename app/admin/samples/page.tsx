import { markSampleSent } from "@/app/actions/admin";
import { countryName } from "@/lib/config";
import { db } from "@/lib/db";
import { fabricOf } from "@/lib/fabrics";
import { date, parseJson } from "@/lib/format";

export const metadata = { title: "Swatch kits" };

export default async function SamplesPage() {
  const rows = await db.sampleRequest.findMany({ include: { company: true }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <div className="space-y-6">
      <h1 className="h1">Swatch kits</h1>
      {rows.length === 0 && <p className="muted">No requests yet.</p>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <div className="font-medium">{r.company.name} <span className="text-stone">· {r.company.city}, {countryName(r.company.country)} · {date(r.createdAt)}</span></div>
              <div className="mt-2 flex flex-wrap gap-2">
                {parseJson<string[]>(r.fabrics, []).map((f) => <span key={f} className="chip"><span className="h-3 w-3 rounded-full" style={{ background: fabricOf(f).hex }} />{f}</span>)}
              </div>
              {r.note && <p className="mt-2 text-sm text-ink-3">“{r.note}”</p>}
              <div className="mt-1 text-xs text-stone">{r.company.address}, {r.company.postalCode} {r.company.city}</div>
            </div>
            {r.status === "REQUESTED" ? (
              <form action={markSampleSent}><input type="hidden" name="id" value={r.id} /><button className="btn-primary">Mark sent</button></form>
            ) : <span className="badge bg-moss-2 text-moss">Sent</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
