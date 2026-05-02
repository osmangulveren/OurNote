import { PaymentMethod } from "@prisma/client";

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CREDIT_CARD: "Kredi Kartı",
  BANK_CARD: "Banka Kartı",
  CASH: "Nakit",
  CHECK: "Çek",
  CASH_ON_DELIVERY: "Kapıda Ödeme",
  WIRE_TRANSFER: "Havale / EFT",
};
