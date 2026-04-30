import { prisma } from "@/lib/prisma";
import { D } from "@/lib/money";
import type { Prisma } from "@prisma/client";

export interface CustomerSalesRow {
  customerId: string;
  customerEmail: string;
  customerName: string | null;
  companyName: string | null;
  orderCount: number;
  subtotal: string;
  vatTotal: string;
  grandTotal: string;
}

export interface ProductSalesRow {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  subtotal: string;
  vatTotal: string;
  grandTotal: string;
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customerEmail: string;
  orderNumber: string;
  issueDate: string;
  subtotal: string;
  vatTotal: string;
  grandTotal: string;
  status: string;
}

export interface AccountingReport {
  periodStart: Date;
  periodEnd: Date;
  totalOrders: number;
  totalSales: string;
  totalVat: string;
  totalGrand: string;
  customers: CustomerSalesRow[];
  products: ProductSalesRow[];
  invoices: InvoiceRow[];
}

export function getDefaultWeeklyRange(now: Date = new Date()): { start: Date; end: Date } {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

/**
 * Rapora dahil edilen siparişler:
 * - SHIPPED ve APPROVED/PREPARING durumdakiler dahil (PENDING ve CANCELLED hariç).
 * - "Ön muhasebe" amaçlı olduğu için onay görmüş tüm satışları kapsar.
 */
export async function buildAccountingReport(start: Date, end: Date): Promise<AccountingReport> {
  const where: Prisma.OrderWhereInput = {
    createdAt: { gte: start, lte: end },
    status: { in: ["APPROVED", "PREPARING", "SHIPPED"] },
  };

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      user: { include: { customerProfile: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  let totalSales = new D(0);
  let totalVat = new D(0);
  let totalGrand = new D(0);

  const customerMap = new Map<string, CustomerSalesRow & { _sub: any; _vat: any; _grand: any }>();
  const productMap = new Map<string, ProductSalesRow & { _sub: any; _vat: any; _grand: any }>();

  for (const o of orders) {
    totalSales = totalSales.add(o.subtotal);
    totalVat = totalVat.add(o.vatTotal);
    totalGrand = totalGrand.add(o.grandTotal);

    const cKey = o.userId;
    const cExisting = customerMap.get(cKey);
    if (cExisting) {
      cExisting.orderCount += 1;
      cExisting._sub = cExisting._sub.add(o.subtotal);
      cExisting._vat = cExisting._vat.add(o.vatTotal);
      cExisting._grand = cExisting._grand.add(o.grandTotal);
    } else {
      customerMap.set(cKey, {
        customerId: o.userId,
        customerEmail: o.user.email,
        customerName: o.user.name,
        companyName: o.user.customerProfile?.companyName ?? null,
        orderCount: 1,
        subtotal: "0",
        vatTotal: "0",
        grandTotal: "0",
        _sub: new D(o.subtotal),
        _vat: new D(o.vatTotal),
        _grand: new D(o.grandTotal),
      });
    }

    for (const item of o.items) {
      const pKey = item.productId;
      const pExisting = productMap.get(pKey);
      if (pExisting) {
        pExisting.quantity += item.quantity;
        pExisting._sub = pExisting._sub.add(item.lineSubtotal);
        pExisting._vat = pExisting._vat.add(item.lineVat);
        pExisting._grand = pExisting._grand.add(item.lineTotal);
      } else {
        productMap.set(pKey, {
          productId: item.productId,
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
          subtotal: "0",
          vatTotal: "0",
          grandTotal: "0",
          _sub: new D(item.lineSubtotal),
          _vat: new D(item.lineVat),
          _grand: new D(item.lineTotal),
        });
      }
    }
  }

  const customers = Array.from(customerMap.values()).map((c) => ({
    customerId: c.customerId,
    customerEmail: c.customerEmail,
    customerName: c.customerName,
    companyName: c.companyName,
    orderCount: c.orderCount,
    subtotal: c._sub.toFixed(2),
    vatTotal: c._vat.toFixed(2),
    grandTotal: c._grand.toFixed(2),
  }));

  const products = Array.from(productMap.values()).map((p) => ({
    productId: p.productId,
    sku: p.sku,
    productName: p.productName,
    quantity: p.quantity,
    subtotal: p._sub.toFixed(2),
    vatTotal: p._vat.toFixed(2),
    grandTotal: p._grand.toFixed(2),
  }));

  const invoiceRows = await prisma.invoiceDraft.findMany({
    where: { issueDate: { gte: start, lte: end } },
    include: { customer: true, order: true },
    orderBy: { issueDate: "asc" },
  });

  const invoices: InvoiceRow[] = invoiceRows.map((i) => ({
    id: i.id,
    invoiceNumber: i.invoiceNumber,
    customerEmail: i.customer.email,
    orderNumber: i.order.orderNumber,
    issueDate: i.issueDate.toISOString(),
    subtotal: new D(i.subtotal).toFixed(2),
    vatTotal: new D(i.vatTotal).toFixed(2),
    grandTotal: new D(i.grandTotal).toFixed(2),
    status: i.status,
  }));

  return {
    periodStart: start,
    periodEnd: end,
    totalOrders: orders.length,
    totalSales: totalSales.toFixed(2),
    totalVat: totalVat.toFixed(2),
    totalGrand: totalGrand.toFixed(2),
    customers,
    products,
    invoices,
  };
}
