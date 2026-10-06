import { Reveal, SplitHeading } from "@/components/motion/Reveal";
import { requestSamples } from "@/app/actions/orders";
import { currentUser } from "@/lib/auth";
import { FABRICS } from "@/lib/fabrics";
import FabricExplorer from "./FabricExplorer";

export const metadata = { title: "Fabrics" };

export default async function FabricsPage({ searchParams }: { searchParams: Promise<{ requested?: string }> }) {
  const user = await currentUser();
  const { requested } = await searchParams;
  const canRequest = user?.role === "BUYER" && user.company?.status === "APPROVED";
  return (
    <div className="container-page pt-24 md:pt-28">
      <Reveal className="eyebrow mb-3">{FABRICS.length} fabrics · 3 families · every model</Reveal>
      <SplitHeading text={"Feel it *before*\nyou stock it."} className="display mb-6 text-[clamp(3rem,7vw,6rem)]" />
      <Reveal delay={0.2} className="mb-12 max-w-xl text-lg text-ink-3">
        Warm earth tones, heavy bouclé and soft velvet. Turn any fabric in 3D, then order the physical swatches for your showroom.
      </Reveal>
      {requested && <div className="mb-8 rounded-2xl bg-moss-2 p-5 text-moss">Swatch kit requested — it&apos;s usually posted within three working days.</div>}
      <FabricExplorer canRequest={canRequest} action={requestSamples} />
    </div>
  );
}
