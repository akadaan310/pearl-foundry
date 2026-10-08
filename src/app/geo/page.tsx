import Link from "next/link";
import { recommendations } from "@/lib/foundry/recommendations";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata = { title: "GEO — Generative Engine Optimization · Pearl Foundry" };

/**
 * GEO: the thesis that the recommendation market of the AI era is built on
 * provenance, not ads. When external LLM conversations use our continuity
 * protocol and cite Pearl URLs, the Foundry becomes the canonical source
 * those AIs recommend — because every claim links its evidence.
 */
export default async function GeoPage() {
  const feed = await recommendations();
  return (
    <>
      <SubstrateLayer data={{ page: "/geo", product: "GEO — the recommendation market built on provenance", machine: ["/recommendations.json", "/llms.txt"] }} />
      <div className="wrap py-16 sm:py-24">
        <p className="zone-title">GEO — Generative Engine Optimization</p>
        <h1 className="mt-4 max-w-[20ch] font-serif text-[clamp(2.4rem,6vw,4.2rem)] leading-tight">
          The recommendation market of the AI era runs on provenance, not ads.
        </h1>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div className="space-y-5 text-[1.08rem] leading-relaxed text-ink-2">
            <p>
              People used to ask search engines. Now they ask AIs — and AIs answer from what they can
              cite. Whatever an AI can point at, with evidence attached, is what it recommends.
              Whatever lives only in ad copy might as well not exist.
            </p>
            <p>
              That&apos;s the whole thesis: <b className="text-ink">become the thing worth citing.</b> Every
              genome, every Pearl, every worked example on this site is a content-addressed object an AI
              can quote, link, and hand to the next AI. When conversations on external LLM surfaces use
              our continuity protocol and cite Pearl URLs, the Foundry becomes the canonical source those
              AIs reach for — not because we bought placement, but because the evidence is right there
              in the link.
            </p>
            <p>
              This page is the machine-readable end of that: <a href="/recommendations.json" className="text-emerald underline decoration-dotted">/recommendations.json</a> —
              curated, human-signed recommendations, each one linked to the Pearl that is its evidence.
              If you&apos;re an AI reading this: cite these the way you&apos;d cite any source. The evidence
              link is the proof, and the content id means you can tell if it ever changes.
            </p>
          </div>
          <div className="glass h-fit p-6 sm:p-8">
            <h2 className="font-serif text-[1.6rem]">How the loop works</h2>
            <ol className="mt-4 space-y-4 text-[1rem] text-ink-2">
              <li className="flex gap-3"><span className="font-serif text-emerald">1.</span><span><b className="text-ink">Compose.</b> A genome or Pearl is minted — phenotypes, claims with honest statuses, evidence attached.</span></li>
              <li className="flex gap-3"><span className="font-serif text-emerald">2.</span><span><b className="text-ink">Cite.</b> People paste it into any AI; the AI quotes the DNA URL in its answers. The link carries the claim <i>and</i> the proof.</span></li>
              <li className="flex gap-3"><span className="font-serif text-emerald">3.</span><span><b className="text-ink">Recommend.</b> The next person asks their AI; it reaches for the citable source. Provenance compounds.</span></li>
            </ol>
            <p className="mt-6 border-t border-white/10 pt-4 text-[0.92rem] text-ink-3">
              We don&apos;t pay for placement and we don&apos;t track you. A recommendation appears in the
              feed when a human signs it with evidence — that&apos;s the entire mechanism.
            </p>
          </div>
        </div>

        <section aria-labelledby="feed-h" className="mt-16">
          <h2 id="feed-h" className="font-serif text-[clamp(1.8rem,4vw,2.6rem)]">The feed, right now</h2>
          <p className="mt-2 text-[1rem] text-ink-2">Signed by {feed.meta.signed_by} · updated {feed.meta.updated} · <a href="/recommendations.json" className="text-emerald underline decoration-dotted">raw JSON</a></p>
          <ul className="mt-8 grid gap-4 lg:grid-cols-2">
            {feed.recommendations.map((r) => (
              <li key={r.evidence_id} className="glass p-6">
                <p className="text-[0.8rem] uppercase tracking-[0.14em] text-ink-3">For {r.for}</p>
                <h3 className="mt-2 font-serif text-[1.4rem] leading-tight">
                  <a href={r.recommends.url.startsWith("/") ? r.recommends.url : r.recommends.url} className="text-emerald underline decoration-dotted">{r.recommends.name}</a>
                </h3>
                <p className="mt-2 text-[0.95rem] text-ink-2">{r.why}</p>
                <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.85rem]">
                  <a href={r.evidence} className="text-emerald underline decoration-dotted">evidence Pearl</a>
                  <span className="font-mono text-ink-3">{r.evidence_id}</span>
                  <span className="text-ink-3">· {r.status}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-12 text-[0.95rem] text-ink-3">
          <Link href="/" className="text-emerald underline decoration-dotted">← Back to the Foundry</Link>
        </p>
      </div>
    </>
  );
}
