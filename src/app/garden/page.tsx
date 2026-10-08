import type { Metadata } from "next";
import { Garden } from "@/components/v6/Garden";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = { title: "Your Pearls", description: "Things you've opened, made, kept, given to an AI and got back, as a living constellation. Kept in this browser.", alternates: { canonical: "/garden" } };

export default function GardenPage() {
  return (
    <>
      <SubstrateLayer data={{ page: "/garden", storage: "browser-local (pearls.trail.v1, pearls.workspace.v1)", sync: false, account: "not available: the substrate's human sign-in is dev-only and magic links are deferred" }} />
      <section className="wrap py-12 sm:py-16">
        <p className="zone-title">Continuity</p>
        <h1 className="mt-2 font-serif text-[clamp(2.4rem,6vw,4.4rem)] leading-[1.02]">The things you made, and where they went.</h1>
        <div className="mt-10"><Garden /></div>
      </section>
    </>
  );
}
