import { Prisma } from "@prisma/client";

export type Money = Prisma.Decimal;
export const D = Prisma.Decimal;

export function toMoney(value: string | number | Prisma.Decimal): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

export function formatTRY(value: Prisma.Decimal | string | number): string {
  const n = typeof value === "object" ? Number(value.toString()) : Number(value);
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatPercent(value: Prisma.Decimal | string | number): string {
  const n = typeof value === "object" ? Number(value.toString()) : Number(value);
  return `%${n.toFixed(2).replace(/\.00$/, "")}`;
}

/** Round to 2 decimals (kuruş) */
export function round2(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
