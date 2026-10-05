import { config } from "./config";
import { parseJson } from "./format";

export type PriceTier = { minQty: number; price: number };

export function tiersOf(p: { price: number; priceTiers: string; moq: number }): PriceTier[] {
  const tiers = parseJson<PriceTier[]>(p.priceTiers, []).filter((t) => t.minQty > 0 && t.price > 0);
  const all = [{ minQty: p.moq, price: p.price }, ...tiers.filter((t) => t.minQty > p.moq)];
  return all.sort((a, b) => a.minQty - b.minQty);
}

/** Unit price for a given quantity, using the best matching volume tier. */
export function unitPrice(p: { price: number; priceTiers: string; moq: number }, qty: number) {
  let price = p.price;
  for (const t of tiersOf(p)) if (qty >= t.minQty) price = t.price;
  return price;
}

export type TotalsInput = {
  lines: { unitPrice: number; quantity: number; volumeM3: number }[];
  country: string;
  vatNumber?: string | null;
};

/**
 * EU VAT rules for a Romanian seller:
 *  - Romanian buyer: Romanian VAT is charged.
 *  - Other EU buyer with a VAT number: intra-community supply, reverse charge (0%).
 *  - Non-EU buyer: export, 0% VAT.
 *  - Other EU buyer without a VAT number: Romanian VAT is charged.
 */
export function computeTotals({ lines, country, vatNumber }: TotalsInput) {
  const subtotal = round(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
  const volume = lines.reduce((s, l) => s + l.volumeM3 * l.quantity, 0);
  const freight = round(volume * config.freightPerCbm);
  const isEU = EU.has(country);
  let vatRate = 0;
  let vatNote = "";
  if (country === "RO") {
    vatRate = config.vatRateRO;
  } else if (isEU && vatNumber) {
    vatNote = "Intra-community supply – VAT reverse charge (Art. 138 Directive 2006/112/EC)";
  } else if (isEU) {
    vatRate = config.vatRateRO;
  } else {
    vatNote = "Export outside the EU – VAT exempt";
  }
  const vatAmount = round(((subtotal + freight) * vatRate) / 100);
  return {
    subtotal,
    freight,
    vatRate,
    vatAmount,
    vatNote,
    total: round(subtotal + freight + vatAmount),
    volume: Math.round(volume * 1000) / 1000,
  };
}

const EU = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

const round = (n: number) => Math.round(n * 100) / 100;
