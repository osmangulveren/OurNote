import AuthShell from "@/components/AuthShell";
import { SplitHeading } from "@/components/motion/Reveal";
import { ALL_COUNTRIES } from "@/lib/config";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Open a trade account" };

export default function RegisterPage() {
  const countries = Object.entries(ALL_COUNTRIES).sort((a, b) => a[1].localeCompare(b[1])) as [string, string][];
  return (
    <AuthShell
      aside={
        <ul className="space-y-3 text-lg">
          {["Trade prices and volume tiers", "Book space on shared trucks", "Free fabric swatch kits", "Live tracking to your door"].map((x, i) => (
            <li key={x} className="flex items-baseline gap-4"><span className="font-mono text-xs text-stone-2">0{i + 1}</span>{x}</li>
          ))}
        </ul>
      }
    >
      <div className="mx-auto w-full max-w-xl">
        <SplitHeading text="Open a *trade* account." className="display text-6xl" />
        <p className="mb-8 mt-3 text-ink-3">For furniture stores and interior businesses. We check your VAT number and usually approve within one business day.</p>
        <RegisterForm countries={countries} />
      </div>
    </AuthShell>
  );
}
