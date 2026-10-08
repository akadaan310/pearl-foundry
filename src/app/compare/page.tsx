import type { Metadata } from "next";
import { CompareApp } from "@/components/living/CompareApp";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = {
  title: "Compare",
  description: "Compare two Pearls: metadata, blocks, computations, continuity and lineage. Computed in your browser.",
  alternates: { canonical: "/compare" },
};

export default function Compare() {
  return (
    <>
      <SubstrateLayer data={{ page: "/compare", capability: "pearl.diff", machine: "/api/v1/pearl/diff?a={link}&b={link}" }} />
      <header className="paper-glow border-b border-rule">
        <div className="wrap act !pb-12">
          <p className="eyebrow mb-5">Compare</p>
          <h1 className="keynote max-w-[15ch]">Two objects. What changed?</h1>
          <p className="mt-6 max-w-[44ch] text-[1.2rem] text-ink-2">Paste two Pearls, or a Pearl and its fork. See what was added, what changed, which computation moved, and which threads closed.</p>
        </div>
      </header>
      <div className="wrap py-12"><CompareApp /></div>
    </>
  );
}
