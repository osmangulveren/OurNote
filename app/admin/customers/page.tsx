import { setCompanyStatus } from "@/app/actions/admin";
import { countryName } from "@/lib/config";
import { db } from "@/lib/db";
import { date } from "@/lib/format";

export const metadata = { title: "Customers" };

const tone: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800", APPROVED: "bg-emerald-100 text-emerald-800", REJECTED: "bg-red-100 text-red-700",
};

export default async function CustomersPage() {
  const companies = await db.company.findMany({
    include: { users: true, _count: { select: { orders: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return (
    <div className="space-y-6">
      <h1 className="h1">Customers</h1>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Company</th><th>Country</th><th>VAT</th><th>Contact</th><th>Orders</th><th>Applied</th><th>Status</th><th /></tr></thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td><div className="font-semibold">{c.name}</div><div className="text-xs text-slate-500">{c.address}, {c.postalCode} {c.city}</div></td>
                <td>{countryName(c.country)}</td>
                <td className="font-mono text-xs">{c.vatNumber ?? "—"}</td>
                <td className="text-xs">{c.users.map((u) => <div key={u.id}>{u.name} · {u.email}</div>)}<div>{c.phone}</div></td>
                <td>{c._count.orders}</td>
                <td>{date(c.createdAt)}</td>
                <td><span className={`badge ${tone[c.status]}`}>{c.status}</span></td>
                <td className="whitespace-nowrap text-right">
                  {c.status !== "APPROVED" && (
                    <form action={setCompanyStatus} className="inline"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="status" value="APPROVED" /><button className="btn-primary px-3 py-1 text-xs">Approve</button></form>
                  )}
                  {c.status !== "REJECTED" && (
                    <form action={setCompanyStatus} className="ml-1 inline"><input type="hidden" name="id" value={c.id} /><input type="hidden" name="status" value="REJECTED" /><button className="btn-danger px-3 py-1 text-xs">{c.status === "APPROVED" ? "Block" : "Reject"}</button></form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted">Tip: verify EU VAT numbers at ec.europa.eu/taxation_customs/vies before approving — reverse-charge invoicing depends on a valid VAT ID.</p>
    </div>
  );
}
