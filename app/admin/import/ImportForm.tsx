"use client";

import { useActionState } from "react";
import { importCatalogJson } from "@/app/actions/admin";

export default function ImportForm() {
  const [state, action, pending] = useActionState(importCatalogJson, undefined as { ok?: string; error?: string } | undefined);
  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label">Catalog JSON file</label>
        <input type="file" name="file" accept="application/json,.json" className="input" />
      </div>
      <div>
        <label className="label">…or paste JSON</label>
        <textarea name="json" rows={10} className="input font-mono text-xs" placeholder='{"categories": [...], "products": [...]}' />
      </div>
      {state?.ok && <p className="text-sm font-semibold text-emerald-700">{state.ok}</p>}
      {state?.error && <pre className="whitespace-pre-wrap text-xs text-red-600">{state.error}</pre>}
      <button className="btn-primary" disabled={pending}>{pending ? "Importing…" : "Import"}</button>
    </form>
  );
}
