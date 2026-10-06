import Link from "next/link";
import { redirect } from "next/navigation";
import { Reveal, SplitHeading } from "@/components/motion/Reveal";
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
    <div className="container-page max-w-4xl pt-24 md:pt-28">
      <SplitHeading text={c?.name ?? "Your account"} className="display mb-8 text-[clamp(2.8rem,6vw,5rem)]" />
      {status === "PENDING" && (
        <Reveal className="mb-8 rounded-[22px] bg-ink p-7 text-bone">
          <div className="font-display text-3xl">{welcome ? "Thanks — we've got your application." : "Your application is being reviewed."}</div>
          <p className="mt-2 max-w-xl text-stone-2">We verify your VAT number and usually approve within one business day. Until then you can browse the collection and fabrics.</p>
          <Link href="/catalog" className="btn mt-5 bg-paper text-ink hover:bg-bone">Browse the collection</Link>
        </Reveal>
      )}
      {status === "REJECTED" && <Reveal className="mb-8 rounded-[22px] bg-clay-3 p-6 text-clay-2">We couldn&apos;t approve this application. Please get in touch so we can help.</Reveal>}
      {status === "APPROVED" && (
        <Reveal className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-moss-2 p-6 text-moss">
          <span className="font-display text-2xl">Your trade account is active.</span>
          <div className="flex gap-2"><Link href="/orders" className="btn-outline">Orders</Link><Link href="/catalog" className="btn-primary">Order</Link></div>
        </Reveal>
      )}
      {c && (
        <Reveal className="grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
          {[
            ["Company", c.name], ["VAT number", c.vatNumber || "—"], ["Address", `${c.address}, ${c.postalCode} ${c.city}`],
            ["Country", countryName(c.country)], ["Phone", c.phone], ["Login", `${user.name} · ${user.email}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-6 border-b border-line py-4 text-sm"><span className="text-stone">{k}</span><span className="text-right">{v}</span></div>
          ))}
        </Reveal>
      )}
    </div>
  );
}
