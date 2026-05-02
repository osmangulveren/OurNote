"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ProductFormState } from "@/lib/products/actions";

const initial: ProductFormState = {};

const CATEGORY_OPTIONS = [
  { value: "KOLTUK", label: "Koltuk (tekli)" },
  { value: "KANEPE", label: "Kanepe / Set" },
  { value: "SOMINE", label: "Şömine" },
];
const FABRIC_OPTIONS = [
  { value: "", label: "—" },
  { value: "BOUCLE", label: "Bouclé" },
  { value: "KADIFE", label: "Kadife" },
  { value: "CHENILLE", label: "Chenille" },
  { value: "SUNI_DERI", label: "Suni Deri" },
  { value: "KETEN", label: "Keten" },
  { value: "DIGER", label: "Diğer" },
  { value: "YOK", label: "Yok" },
];
const FRAME_OPTIONS = [
  { value: "", label: "—" },
  { value: "KAYIN_MASIF", label: "Kayın Masif" },
  { value: "MDF", label: "MDF" },
  { value: "METAL", label: "Metal" },
  { value: "KARMA", label: "Karma" },
  { value: "YOK", label: "Yok" },
];

interface Props {
  action: (prev: ProductFormState, fd: FormData) => Promise<ProductFormState>;
  defaults?: Record<string, any>;
  submitLabel?: string;
}

export default function ProductForm({ action, defaults, submitLabel = "Kaydet" }: Props) {
  const [state, formAction] = useFormState(action, initial);
  const d = defaults ?? {};

  return (
    <form action={formAction} className="space-y-6 max-w-3xl">
      <Section title="Temel Bilgi">
        <Grid>
          <Field label="SKU" name="sku" defaultValue={d.sku} required />
          <Select label="Kategori" name="category" defaultValue={d.category ?? "KANEPE"} options={CATEGORY_OPTIONS} />
        </Grid>
        <Field label="Ürün adı" name="name" defaultValue={d.name} required />
        <Textarea label="Açıklama" name="description" defaultValue={d.description ?? ""} rows={2} />
        <Grid>
          <Field label="Birim" name="unit" defaultValue={d.unit ?? "adet"} required />
          <Field label="Birim fiyat (TL)" name="price" type="number" step="0.01" min="0" defaultValue={d.price ?? "0"} required />
          <Field label="KDV (%)" name="vatRate" type="number" step="0.01" min="0" max="100" defaultValue={d.vatRate ?? "20"} required />
          <Field label="Stok" name="stockQuantity" type="number" min="0" defaultValue={String(d.stockQuantity ?? 0)} required />
        </Grid>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" name="isActive" defaultChecked={d.isActive ?? true} />
          Aktif (müşteriler katalogda görsün)
        </label>
      </Section>

      <Section title="Koleksiyon & Tasarım">
        <Grid>
          <Field label="Koleksiyon" name="collection" defaultValue={d.collection ?? ""} />
          <Field label="Tasarımcı / Atölye" name="designer" defaultValue={d.designer ?? ""} />
        </Grid>
        <Field label="Model bilgisi" name="modelInfo" defaultValue={d.modelInfo ?? ""} />
      </Section>

      <Section title="Boyutlar (cm)">
        <Grid cols={3}>
          <Field label="Genişlik" name="widthCm" type="number" min="0" defaultValue={d.widthCm ?? ""} />
          <Field label="Derinlik" name="depthCm" type="number" min="0" defaultValue={d.depthCm ?? ""} />
          <Field label="Yükseklik" name="heightCm" type="number" min="0" defaultValue={d.heightCm ?? ""} />
          <Field label="Oturma genişliği" name="seatWidthCm" type="number" min="0" defaultValue={d.seatWidthCm ?? ""} />
          <Field label="Oturma derinliği" name="seatDepthCm" type="number" min="0" defaultValue={d.seatDepthCm ?? ""} />
          <Field label="Oturma yüksekliği" name="seatHeightCm" type="number" min="0" defaultValue={d.seatHeightCm ?? ""} />
          <Field label="Kişi sayısı" name="seatCount" type="number" min="0" defaultValue={d.seatCount ?? ""} />
          <Field label="Ağırlık (kg)" name="weightKg" type="number" step="0.1" min="0" defaultValue={d.weightKg ?? ""} />
        </Grid>
      </Section>

      <Section title="Yapı / Malzeme">
        <Grid>
          <Select label="Kumaş türü" name="fabricType" defaultValue={d.fabricType ?? ""} options={FABRIC_OPTIONS} />
          <Field label="Kumaş rengi" name="fabricColor" defaultValue={d.fabricColor ?? ""} placeholder="örn. Krem" />
          <Field label="Renk hex" name="fabricColorHex" defaultValue={d.fabricColorHex ?? ""} placeholder="#F5EDE0" />
          <Select label="İskelet türü" name="frameType" defaultValue={d.frameType ?? ""} options={FRAME_OPTIONS} />
          <Field label="Sünger yoğunluğu (kg/m³)" name="foamDensityKgM3" type="number" min="0" defaultValue={d.foamDensityKgM3 ?? ""} />
          <Field label="Dayanıklılık (Martindale)" name="durabilityMartindale" type="number" min="0" defaultValue={d.durabilityMartindale ?? ""} />
        </Grid>
      </Section>

      <Section title="Servis">
        <Grid>
          <Field label="Garanti (ay)" name="warrantyMonths" type="number" min="0" defaultValue={d.warrantyMonths ?? ""} />
          <Field label="Üretim süresi (gün)" name="leadTimeDays" type="number" min="0" defaultValue={d.leadTimeDays ?? ""} />
        </Grid>
        <Textarea label="Bakım talimatları" name="careInstructions" defaultValue={d.careInstructions ?? ""} rows={2} />
      </Section>

      <Section title="Konfigüratör Seçenekleri (JSON)">
        <p className="text-xs text-slate-500 -mt-2">Müşteri ürün sayfasında bu seçenekleri görür. Boş bırakılırsa konfigüratör gösterilmez.</p>
        <Textarea
          label='Kumaş renkleri — örn. [{"name":"Krem","hex":"#F5EDE0"}]'
          name="availableFabricColors"
          defaultValue={typeof d.availableFabricColors === "string" ? d.availableFabricColors : JSON.stringify(d.availableFabricColors ?? [], null, 2)}
          rows={3}
        />
        <Textarea
          label='Kompozisyonlar — örn. [{"label":"Üçlü","priceMultiplier":1}]'
          name="availableCompositions"
          defaultValue={typeof d.availableCompositions === "string" ? d.availableCompositions : JSON.stringify(d.availableCompositions ?? [], null, 2)}
          rows={3}
        />
        <Textarea
          label='Add-on ürünler — örn. [{"label":"Şömine","priceDelta":16000}]'
          name="availableAddons"
          defaultValue={typeof d.availableAddons === "string" ? d.availableAddons : JSON.stringify(d.availableAddons ?? [], null, 2)}
          rows={3}
        />
      </Section>

      {state.error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">Kaydedildi.</p>
      ) : null}

      <Submit label={submitLabel} />
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
      <legend className="px-2 text-sm font-semibold text-slate-700">{title}</legend>
      {children}
    </fieldset>
  );
}
function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 }) {
  const c = cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return <div className={`grid grid-cols-1 ${c} gap-4`}>{children}</div>;
}
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input {...rest} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
    </div>
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <textarea {...rest} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
    </div>
  );
}
function Select(props: { label: string; name: string; defaultValue?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{props.label}</label>
      <select name={props.name} defaultValue={props.defaultValue} className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white">
        {props.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg">
      {pending ? "Kaydediliyor…" : label}
    </button>
  );
}
