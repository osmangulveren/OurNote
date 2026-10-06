import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { SplitHeading } from "@/components/motion/Reveal";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell aside={<><div className="font-display text-4xl leading-tight">Your loads, your trucks and your invoices — in one place.</div><div className="mt-3 font-mono text-[11px] uppercase tracking-wider text-stone-2">Terracotta Velvet</div></>}>
      <div className="mx-auto w-full max-w-md">
        <SplitHeading text="Welcome *back.*" className="display text-6xl" />
        <p className="mb-8 mt-3 text-ink-3">Trade prices, your loads and every truck you&apos;re on.</p>
        <LoginForm next={next} />
        <p className="mt-8 text-sm text-ink-3">New here? <Link href="/register" className="link-underline text-ink">Open a trade account</Link></p>
      </div>
    </AuthShell>
  );
}
