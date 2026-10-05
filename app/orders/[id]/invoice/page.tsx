import { notFound } from "next/navigation";
import InvoiceView from "@/components/InvoiceView";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { company: true, items: true } });
  if (!order || (user.role !== "ADMIN" && order.companyId !== user.companyId)) notFound();
  return <InvoiceView order={order} />;
}
