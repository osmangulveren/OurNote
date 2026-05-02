import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import CreateUserForm from "./CreateUserForm";
import RoleSelector from "./RoleSelector";

export default async function AdminUsersPage() {
  await requirePermission("users.manage");
  const users = await prisma.user.findMany({
    where: { role: { not: "CUSTOMER" } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Personel</h1>
        <p className="text-sm text-slate-500">Roller permission matrix&apos;inden okunur. Müşteri kayıtları ayrı sayfada.</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Yeni personel</h2>
        <CreateUserForm />
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Ad</th>
              <th className="px-4 py-2">Rol</th>
              <th className="px-4 py-2">Eklendi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.name ?? "—"}</td>
                <td className="px-4 py-2"><RoleSelector userId={u.id} role={u.role} /></td>
                <td className="px-4 py-2 text-xs text-slate-500">{u.createdAt.toLocaleString("tr-TR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 ? <p className="px-4 py-4 text-sm text-slate-500">Henüz personel yok.</p> : null}
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-semibold mb-2">Rol özeti</h2>
        <ul className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(ROLE_LABEL).filter(([k]) => k !== "CUSTOMER").map(([k, label]) => (
            <li key={k} className="text-slate-700"><span className="font-medium">{label}</span> <span className="text-xs text-slate-400 ml-1">({k})</span></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
