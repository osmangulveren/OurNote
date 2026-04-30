import type { AccountingReport } from "./report";

function escapeCsv(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(values: Array<string | number | null | undefined>): string {
  return values.map(escapeCsv).join(";");
}

/**
 * Üretilen CSV ; ayraçlı, BOM'lu — Excel TR yerel ayarıyla doğru açılır.
 * Not: İleride aynı veriyi Excel/PDF olarak da üretmek için
 *      `report` objesi paylaşılır servis çıktısıdır.
 */
export function reportToCsv(report: AccountingReport): string {
  const lines: string[] = [];
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  lines.push(row(["Ön Muhasebe Raporu"]));
  lines.push(row(["Dönem", `${fmt(report.periodStart)} → ${fmt(report.periodEnd)}`]));
  lines.push(row(["Toplam Sipariş", report.totalOrders]));
  lines.push(row(["Toplam Satış (KDV hariç)", report.totalSales]));
  lines.push(row(["Toplam KDV", report.totalVat]));
  lines.push(row(["Genel Toplam", report.totalGrand]));
  lines.push("");

  lines.push(row(["MÜŞTERİ BAZLI SATIŞLAR"]));
  lines.push(row(["Email", "Firma", "Ad", "Sipariş Sayısı", "Subtotal", "KDV", "Toplam"]));
  for (const c of report.customers) {
    lines.push(row([c.customerEmail, c.companyName, c.customerName, c.orderCount, c.subtotal, c.vatTotal, c.grandTotal]));
  }
  lines.push("");

  lines.push(row(["ÜRÜN BAZLI SATIŞLAR"]));
  lines.push(row(["SKU", "Ürün", "Miktar", "Subtotal", "KDV", "Toplam"]));
  for (const p of report.products) {
    lines.push(row([p.sku, p.productName, p.quantity, p.subtotal, p.vatTotal, p.grandTotal]));
  }
  lines.push("");

  lines.push(row(["FATURA TASLAKLARI"]));
  lines.push(row(["Fatura No", "Sipariş", "Müşteri", "Tarih", "Subtotal", "KDV", "Toplam", "Durum"]));
  for (const i of report.invoices) {
    lines.push(row([
      i.invoiceNumber,
      i.orderNumber,
      i.customerEmail,
      i.issueDate.slice(0, 10),
      i.subtotal,
      i.vatTotal,
      i.grandTotal,
      i.status,
    ]));
  }

  return "﻿" + lines.join("\n");
}
