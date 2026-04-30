/**
 * e-Fatura / e-Arşiv adapter — STUB.
 *
 * MVP'de gerçek entegratör (GIB, izibiz, Foriba, Logo, vb.) bağlı değil.
 * İleride bu modülü gerçek bir client implementasyonu ile değiştirin.
 *
 * Önerilen yaklaşım:
 *   - Bu dosyada bir `EInvoiceProvider` arayüzü tutun.
 *   - Gerçek entegratör için `lib/invoices/providers/<vendor>.ts` ekleyin.
 *   - Burada env'e bakarak doğru provider'ı seçin.
 */

import { prisma } from "@/lib/prisma";

export interface EInvoiceProvider {
  send(invoiceId: string): Promise<{ externalId: string; status: "QUEUED" | "ACCEPTED" | "REJECTED" }>;
}

class StubProvider implements EInvoiceProvider {
  async send(invoiceId: string) {
    console.log(`[e-Invoice STUB] Invoice ${invoiceId} sent (no real integration).`);
    return { externalId: `STUB-${invoiceId}`, status: "QUEUED" as const };
  }
}

export function getEInvoiceProvider(): EInvoiceProvider {
  // İleride: process.env.EINVOICE_PROVIDER === "izibiz" → new IzibizProvider(...)
  return new StubProvider();
}

export async function sendToEInvoice(invoiceId: string) {
  const invoice = await prisma.invoiceDraft.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Fatura taslağı bulunamadı.");
  const provider = getEInvoiceProvider();
  const result = await provider.send(invoiceId);
  console.log(`[e-Invoice] ${invoice.invoiceNumber} → ${result.externalId} (${result.status})`);
  return result;
}
