import { requireCustomer } from "@/lib/auth/session";
import AppShell from "@/components/AppShell";
import ChatWidget from "@/components/ChatWidget";
import { prisma } from "@/lib/prisma";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCustomer();
  const cart = await prisma.cart.findUnique({
    where: { userId: session.user!.id },
    include: { items: true },
  });
  const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const nav = [
    { href: "/customer", label: "Anasayfa" },
    { href: "/customer/products", label: "Katalog" },
    { href: "/customer/cart", label: `Sepet${cartCount ? ` (${cartCount})` : ""}` },
    { href: "/customer/orders", label: "Siparişlerim" },
  ];

  return (
    <AppShell title="Rosadore Home · Müşteri" user={session.user as any} nav={nav}>
      {children}
      <ChatWidget />
    </AppShell>
  );
}
