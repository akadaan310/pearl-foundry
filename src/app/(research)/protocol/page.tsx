import Link from "next/link";
import type { Metadata } from "next";
import { SITE, TAXONOMY, MACHINE_ENTRYPOINTS } from "@/content/site";
import { INGRESS, EXPERIMENTS } from "@/content/experiments";
import { SubstrateLayer } from "@/components/Substrate";
import { StatusBadge } from "@/components/Status";
import { CopyButton } from "@/components/CopyPrompt";
import type { EvidenceStatus } from "@/content/types";

export const metadata: Metadata = {
  title: "Ingress protocol",
  description: "Machine-readable research instructions for browsing-capable AI: who wrote them, what they request, what is permitted, what is not, and what evidence to return.",
  alternates: { canonical: "/protocol" },
};

export default function Protocol() {
  const x = EXPERIMENTS.find((e) => e.id === "X-INGRESS")!;
  return (
    <>
      <SubstrateLayer data={{ page: "/protocol", ingress: INGRESS, permitted: x.permitted, forbidden: x.forbidden, machine: ["/ai.txt", "/.well-known/ai"] }} />
      <header className="border-b border-rule" data-substrate="url → manifest → topology → experiment → evidence → report" data-address="/protocol" data-pointer="/.well-known/ai#/protocol">
        <div className="wrap pb-14 pt-14 sm:pt-20">
          <p className="label mb-8">§ protocol · machine-readable research instructions</p>
          <h1 className="title max-w-[22ch] !text-[clamp(2.2rem,5vw,4rem)]">Give this URL to an AI. This is what it will find.</h1>
          <p className="lede measure mt-6 text-ink-2">These instructions are written for machines and published for humans. Nothing here is hidden, and nothing here is a command. It is a request to observe and report, with explicit limits.</p>
        </div>
      </header>

      <div className="wrap grid gap-16 py-16 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-16">
          <section aria-labelledby="who">
            <h2 id="who" className="label mb-4">Who wrote this · what it is</h2>
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-[9rem_1fr]">
              <dt className="text-ink-3">Label</dt><dd>{INGRESS.title}</dd>
              <dt className="text-ink-3">Author</dt><dd>{INGRESS.author}</dd>
              <dt className="text-ink-3">Nature</dt><dd className="text-ink-2">{INGRESS.nature}</dd>
              <dt className="text-ink-3">Machine copies</dt><dd className="font-mono text-[0.85rem]"><a href="/ai.txt">/ai.txt</a> · <a href="/.well-known/ai">/.well-known/ai</a></dd>
            </dl>
          </section>

          <section aria-labelledby="steps">
            <h2 id="steps" className="label mb-4">What is requested</h2>
            <ol className="divide-y divide-rule border-y border-rule">
              {INGRESS.steps.map((s) => (
                <li key={s.n} className="grid gap-2 py-4 sm:grid-cols-[3rem_11rem_1fr]">
                  <span className="coord pt-1">{String(s.n).padStart(2, "0")}</span>
                  <span className="font-serif text-lg">{s.name}</span>
                  <span className="text-ink-2">{s.do} <span className="mt-1 block font-mono text-[0.75rem] text-ink-3">{s.read}</span></span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="perm" className="grid gap-px bg-rule md:grid-cols-2">
            <div className="bg-ground p-6">
              <h2 id="perm" className="label mb-4 !text-emerald">Permitted</h2>
              <ul className="space-y-2.5 text-[0.92rem] text-ink-2">{x.permitted.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
            <div className="bg-ground p-6">
              <h2 className="label mb-4 !text-refuse">Not permitted</h2>
              <ul className="space-y-2.5 text-[0.92rem] text-ink-2">{x.forbidden.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          </section>

          <section aria-labelledby="return">
            <h2 id="return" className="label mb-4">What evidence to return</h2>
            <ul className="space-y-2 text-ink-2">{INGRESS.report.map((r, i) => <li key={i} className="border-l border-rule pl-4">{r}</li>)}</ul>
          </section>

          <section aria-labelledby="bounds">
            <h2 id="bounds" className="label mb-4">Boundaries</h2>
            <ul className="space-y-2 text-ink-2">{INGRESS.boundaries.map((b, i) => <li key={i} className="border-l border-refuse/50 pl-4">{b}</li>)}</ul>
          </section>

          <section aria-labelledby="taxonomy">
            <h2 id="taxonomy" className="label mb-4">Terminology: evidence statuses</h2>
            <dl className="divide-y divide-rule border-y border-rule">
              {(Object.keys(TAXONOMY) as EvidenceStatus[]).map((s) => (
                <div key={s} className="grid gap-2 py-3 sm:grid-cols-[10rem_1fr]">
                  <dt><StatusBadge status={s} /></dt>
                  <dd className="text-[0.92rem] text-ink-2">{TAXONOMY[s].definition} <span className="text-ink-3">Tier: {TAXONOMY[s].tier}.</span></dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[0.88rem] text-ink-3">Note: in substrateIO, <code>OBSERVED</code> is reserved for physical observation, and executing a model yields <code>SIMULATED</code>. On this site, injected bit flips are always labelled simulated.</p>
          </section>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-20 lg:self-start">
          <div className="panel p-5">
            <p className="label mb-3">canonical prompt</p>
            <p className="font-serif leading-relaxed">“{SITE.canonicalPrompt}”</p>
            <div className="mt-4"><CopyButton text={SITE.canonicalPrompt} label="Copy prompt" /></div>
          </div>
          <div>
            <p className="label mb-3">Entry points</p>
            <ul className="space-y-2 text-[0.82rem]">
              {MACHINE_ENTRYPOINTS.map((e) => <li key={e.path}><a href={e.path} className="font-mono">{e.path}</a><span className="block text-ink-3">{e.purpose}</span></li>)}
            </ul>
          </div>
          <p><Link href="/ai" className="arrow-link">Watch a client follow it →</Link></p>
        </aside>
      </div>
    </>
  );
}
