import Departures from "@/components/Departures";
import { Reveal, SplitHeading } from "@/components/motion/Reveal";
import { config } from "@/lib/config";
import { bookableDepartures } from "@/lib/orders";

export const metadata = { title: "Truck departures" };

export default async function DeparturesPage() {
  const departures = await bookableDepartures();
  return (
    <div className="pt-24 md:pt-28">
      <div className="container-page">
        <Reveal className="eyebrow mb-3">{departures.length} trucks open for booking</Reveal>
        <SplitHeading text={"Shared trucks,\nscheduled *weekly.*"} className="display mb-6 text-[clamp(3rem,7vw,6rem)]" />
        <Reveal delay={0.2} className="mb-14 grid max-w-4xl gap-6 text-ink-3 md:grid-cols-3">
          <p><b className="font-medium text-ink">Book space, not a truck.</b> Choose a departure at checkout and pay only for the cubic metres your order takes.</p>
          <p><b className="font-medium text-ink">Produced to meet it.</b> Book before the closing date and your pieces are built in time for loading.</p>
          <p><b className="font-medium text-ink">{config.depositPercent}% to reserve.</b> Your deposit holds your space; the balance is due before loading.</p>
        </Reveal>
      </div>
      <section className="bg-ink py-16 text-bone">
        <div className="container-page"><Departures items={departures} dark /></div>
      </section>
    </div>
  );
}
