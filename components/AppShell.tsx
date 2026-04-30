import Link from "next/link";
import { signOut } from "@/auth";

export interface NavItem {
  href: string;
  label: string;
}

export default function AppShell({
  title,
  user,
  nav,
  children,
}: {
  title: string;
  user: { email: string; name?: string | null; role: string };
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href={user.role === "ADMIN" ? "/admin" : "/customer"} className="font-semibold text-slate-900">
              {title}
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="px-3 py-1.5 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {user.name ? `${user.name} · ` : ""}
              {user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="text-sm text-slate-700 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-1.5">
                Çıkış
              </button>
            </form>
          </div>
        </div>
        <nav className="md:hidden border-t border-slate-100 px-4 py-2 flex gap-1 overflow-x-auto">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="px-3 py-1.5 rounded-md text-xs text-slate-700 hover:bg-slate-100 whitespace-nowrap">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
