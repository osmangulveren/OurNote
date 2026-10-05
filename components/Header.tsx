import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { currentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { db } from "@/lib/db";

export default async function Header() {
  const user = await currentUser();
  const cartCount =
    user && user.role === "BUYER" ? await db.cartItem.count({ where: { userId: user.id } }) : 0;

  return (
    <header className="print:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-brand-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            {config.brandName.charAt(0)}
          </span>
          <span className="hidden sm:inline">{config.brandName}</span>
          <span className="badge hidden bg-slate-100 text-slate-600 md:inline-flex">Wholesale</span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 text-sm font-medium text-slate-600">
          <Link href="/catalog" className="rounded-md px-3 py-2 hover:bg-slate-100">Catalog</Link>
          {user?.role === "BUYER" && (
            <Link href="/orders" className="rounded-md px-3 py-2 hover:bg-slate-100">My orders</Link>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="rounded-md px-3 py-2 hover:bg-slate-100">Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          {user?.role === "BUYER" && (
            <Link href="/cart" className="btn-outline relative">
              Cart
              {cartCount > 0 && (
                <span className="badge bg-accent-500 text-white">{cartCount}</span>
              )}
            </Link>
          )}
          {user ? (
            <>
              <Link href="/account" className="hidden rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 md:block">
                {user.company?.name ?? user.name}
              </Link>
              <form action={logout}>
                <button className="rounded-md px-3 py-2 text-slate-500 hover:bg-slate-100">Log out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-outline">Log in</Link>
              <Link href="/register" className="btn-primary hidden sm:inline-flex">Open an account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
