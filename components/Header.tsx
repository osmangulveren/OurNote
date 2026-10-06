import { logout } from "@/app/actions/auth";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import HeaderClient from "./HeaderClient";
import Logo from "./Logo";

export default async function Header() {
  const user = await currentUser();
  let cart = { lines: 0, volume: 0 };
  if (user?.role === "BUYER") {
    const items = await db.cartItem.findMany({ where: { userId: user.id }, include: { product: { select: { volumeM3: true } } } });
    cart = { lines: items.length, volume: items.reduce((s, i) => s + i.product.volumeM3 * i.quantity, 0) };
  }
  return (
    <HeaderClient
      logo={<Logo />}
      role={(user?.role as "ADMIN" | "BUYER" | undefined) ?? null}
      company={user?.company?.name ?? user?.name ?? null}
      cart={cart}
      logout={logout}
    />
  );
}
