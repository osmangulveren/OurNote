import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { countryName } from "@/lib/config";

export const metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser();
  if (user.role === "ADMIN") redirect("/admin");
  const { welcome } = await searchParams;
  const c = user.company;
  const status = c?.status ?? "PENDING";

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="h1 mb-6">Your account</h1>
      {status === "PENDING" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="font-semibold">{welcome ? "Thanks for applying!" : "Application under review"}</div>
          <p className="mt-1 text-sm">
            We are reviewing your company details. You can browse the catalog now; prices and ordering unlock once your account is approved.
          </p>
        </div>
      )}
      {status === "REJECTED" && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
          Your application was not approved. Please contact us for details.
        </div>
      )}
      {status === "APPROVED" && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <span className="font-semibold">Your trade account is active.</span>
          <Link href="/catalog" className="btn-primary">Start ordering</Link>
        </div>
      )}
      {c && (
        <div className="card grid gap-4 p-6 sm:grid-cols-2">
          {[
            ["Company", c.name],
            ["VAT number", c.vatNumber || "—"],
            ["Address", `${c.address}, ${c.postalCode} ${c.city}`],
            ["Country", countryName(c.country)],
            ["Phone", c.phone],
            ["Login", `${user.name} · ${user.email}`],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="label">{k}</div>
              <div className="text-sm">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
