import Link from "next/link";
import type { Metadata } from "next";
import { NODES, RELATIONS, CLAIMS } from "@/content/research";
import { TAXONOMY } from "@/content/site";
import { repo } from "@/content/repositories";
import { Constellation, RelationsTable } from "@/components/Constellation";
import { SubstrateLayer, SubstrateDisclosure } from "@/components/Substrate";
import { TierMark } from "@/components/Status";

export const metadata: Metadata = {
  title: "Research map",
  description: "The research topology: AI-CI, Continuity (ACSP), PURL, substrateIO, Golden Surface, Netscape Surface, SEURL and MUSA, with the source of every relation.",
  alternates: { canonical: "/research" },
};

export default function Research() {
  return (
    <>
      <SubstrateLayer data={{ page: "/research", nodes: NODES.map((n) => ({ id: n.id, name: n.name, kind: n.kind, substrate: n.substrate })), relations: RELATIONS, manifest: "/research.json#/research" }} />
      <header className="border-b border-rule" data-substrate="research → nodes → relations → sources" data-address="/research" data-pointer="/research.json#/research">
        <div className="wrap pb-12 pt-14 sm:pt-20">
          <p className="label mb-8">§ research · the constellation</p>
          <h1 className="title max-w-[20ch] !text-[clamp(2.2rem,5vw,4rem)]">A research topology, not a portfolio grid.</h1>
          <p className="lede measure mt-6 text-ink-2">Each node was described only after reading its repository: the README, the specification and the implementation. Every relation cites the file that states it. Nothing is inferred from a repository&apos;s name.</p>
        </div>
      </header>

      <section className="wrap py-12" aria-labelledby="map-h">
        <h2 id="map-h" className="sr-only">Map</h2>
        <Constellation />
      </section>

      <section className="wrap py-12" aria-labelledby="index-h">
        <h2 id="index-h" className="label mb-6">Index of nodes</h2>
        <ul className="divide-y divide-rule border-y border-rule">
          {NODES.map((n) => {
            const cs = CLAIMS.filter((c) => c.node === n.id);
            const t = (tier: string) => cs.filter((c) => TAXONOMY[c.status].tier === tier).length;
            const r = n.repository ? repo(n.repository) : null;
            return (
              <li key={n.id} className="grid gap-4 py-8 md:grid-cols-[14rem_1fr_15rem]">
                <div>
                  <Link href={`/research/${n.id}`} className="font-serif text-2xl no-underline hover:text-emerald">{n.name}</Link>
                  <p className="coord mt-1">{n.kind} · {n.position.x},{n.position.y}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-ink-2">{n.line}</p>
                  <p className="mt-3 text-[0.9rem] text-ink-3"><span className="text-ink-2">Question.</span> {n.researchQuestion}</p>
                  <SubstrateDisclosure lines={n.substrate} className="mt-3" />
                </div>
                <div className="space-y-2 text-[0.85rem]">
                  <p className="flex flex-wrap gap-x-4 gap-y-1">
                    <TierMark tier="demonstrated" label={`${t("demonstrated")} demonstrated`} />
                    <TierMark tier="proposed" label={`${t("proposed")} proposed`} />
                    <TierMark tier="open" label={`${t("open")} open`} />
                  </p>
                  {r && r.id !== "site" && <a href={r.url} className="block break-all font-mono text-[0.75rem] text-ink-3">{r.slug}</a>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="wrap py-12" aria-labelledby="rel-h">
        <h2 id="rel-h" className="label mb-6">Every relation, with its source</h2>
        <RelationsTable />
      </section>
    </>
  );
}
