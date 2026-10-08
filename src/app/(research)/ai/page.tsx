import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@/content/site";
import { NODES } from "@/content/research";
import { INGRESS } from "@/content/experiments";
import { SubstrateLayer } from "@/components/Substrate";
import { IngressDemo } from "@/components/IngressDemo";
import { CopyButton } from "@/components/CopyPrompt";
import results from "../../../../verification/ingress-results.json";

export const metadata: Metadata = {
  title: "AI Laboratory",
  description: "What happens when an AI-oriented client encounters this site: identity, discovery, interpretation, execution, verification, and the boundary of what a website can cause an AI to do.",
  alternates: { canonical: "/ai" },
};

type R = { questions?: { n: number; question: string; pass: boolean; answer: string }[]; run?: { date: string }; passed?: { questions: string; checks: string } };
const res = results as R;
const q = (n: number) => res.questions?.find((x) => x.n === n);

function Finding({ n }: { n: number }) {
  const x = q(n);
  if (!x) return <p className="text-[0.85rem] text-ink-3">Not yet recorded: run <code>npm run test:ingress</code>.</p>;
  return (
    <div className="panel mt-5 p-4">
      <p className="label mb-2">{x.pass ? <span className="text-emerald">● recorded · pass</span> : <span className="text-refuse">✗ recorded · fail</span>} · harness Q{x.n} · {res.run?.date}</p>
      <p className="text-[0.88rem] text-ink-2 [overflow-wrap:anywhere]">{x.answer}</p>
    </div>
  );
}

const PANELS = [
  { n: "01", k: "Identity", q: "What is this site?", body: <>A research surface owned by {SITE.name}. Its identity is stated three ways: in prose on <Link href="/">the root page</Link>, as schema.org JSON-LD (Person, WebSite, Dataset, SoftwareSourceCode) in its HTML, and as <code>identity</code> in <a href="/research.json">/research.json</a>. Career facts are marked self-reported in all three.</>, finding: 7 },
  { n: "02", k: "Discovery", q: "What can a machine discover from the URL?", body: <>The root response carries an HTTP <code>Link</code> header and <code>&lt;link&gt;</code> elements pointing to <a href="/research.json">/research.json</a>, <a href="/.well-known/ai">/.well-known/ai</a> and <a href="/llms.txt">/llms.txt</a>. robots.txt names a sitemap. No guessing is needed, and the conventional locations exist too.</>, finding: 1 },
  { n: "03", k: "Interpretation", q: "How does an AI reconstruct the research topology?", body: <>From <code>research[]</code> and <code>relations[]</code> in the manifest: {NODES.length} nodes, each relation with the file that states it. The HTML map at <Link href="/research">/research</Link> is built from the same records, so the two cannot disagree. The harness checks that they don&apos;t.</>, finding: 3 },
  { n: "04", k: "Execution", q: "What public experiments can actually be executed?", body: <>Two kinds. First, GET requests to <code>/x</code>, the computational-address resolver: pure, deterministic and bounded, looking path segments up in a fixed registry, so nothing a visitor sends is evaluated. Second, composition: an AI writes an experience as a URL (<Link href="/compose">/compose</Link>), the person keeps it with one click, and sessions append to its continuity brain. Appends are idempotent GETs, and nothing is ever overwritten.</>, finding: 8 },
  { n: "05", k: "Verification", q: "Can the result be independently checked?", body: <>Yes, at three levels. Your browser recomputes every <code>value_sha256</code>. substrateIO&apos;s Python resolver produces the same values (E-006). The repositories&apos; own tests can be re-run from the commands on <Link href="/verify">/verify</Link>.</>, finding: 5 },
];

export default function AiLab() {
  return (
    <>
      <SubstrateLayer data={{ page: "/ai", kind: "ai-laboratory", panels: PANELS.map((p) => ({ n: p.n, k: p.k, q: p.q })), boundaries: INGRESS.boundaries, results: "/verify/ingress.json" }} />
      <header className="grid-paper border-b border-rule" data-substrate="client → identity → discovery → interpretation → execution → verification → boundary" data-address="/ai" data-pointer="/verify/ingress.json">
        <div className="wrap pb-14 pt-14 sm:pt-20">
          <p className="label mb-8">§ ai laboratory</p>
          <h1 className="display max-w-[14ch]">What happens when a machine arrives.</h1>
          <p className="lede measure mt-6 text-ink-2">This page shows what an AI-oriented client meets at this site. It also records what our own harness found when it received only the URL.{res.passed && <> Last run: {res.passed.questions} questions and {res.passed.checks} checks passed.</>}</p>
        </div>
      </header>

      <div className="wrap">
        {PANELS.map((p) => (
          <section key={p.n} id={p.k.toLowerCase()} aria-labelledby={`${p.k}-h`} className="rule-t grid gap-6 py-14 md:grid-cols-[12rem_1fr]" data-substrate={`${p.k.toLowerCase()}`} data-address={`/ai#${p.k.toLowerCase()}`} data-pointer="/verify/ingress.json#/questions">
            <div>
              <p className="coord">{p.n}</p>
              <h2 id={`${p.k}-h`} className="font-serif text-3xl">{p.k}</h2>
            </div>
            <div className="min-w-0 max-w-[46rem]">
              <p className="font-serif text-xl">{p.q}</p>
              <p className="mt-3 text-ink-2">{p.body}</p>
              <Finding n={p.finding} />
            </div>
          </section>
        ))}

        <section id="boundary" aria-labelledby="boundary-h" className="rule-t grid gap-6 py-14 md:grid-cols-[12rem_1fr]" data-substrate="boundary → cannot" data-address="/ai#boundary" data-pointer="/.well-known/ai#/boundaries">
          <div>
            <p className="coord">06</p>
            <h2 id="boundary-h" className="font-serif text-3xl text-refuse">Boundary</h2>
          </div>
          <div className="min-w-0 max-w-[46rem]">
            <p className="font-serif text-xl">What can this website NOT cause an external AI to do?</p>
            <p className="mt-3 text-ink-2">Almost everything. A website can make its structure available. Whether a model fetches it, believes it or acts on it is decided by the model, its user and its operator. The site is built on that premise:</p>
            <ul className="mt-5 divide-y divide-rule border-y border-rule">
              {INGRESS.boundaries.map((b, i) => <li key={i} className="py-3 text-[0.92rem] text-ink-2"><span className="mr-3 font-mono text-refuse">¬</span>{b}</li>)}
            </ul>
            <p className="mt-5 text-[0.9rem] text-ink-3">These statements appear verbatim in <a href="/ai.txt">/ai.txt</a> and <a href="/.well-known/ai">/.well-known/ai</a>. Nothing is said to machines that is not also shown here, to you.</p>
          </div>
        </section>
      </div>

      <section id="demonstration" aria-labelledby="demo-h" className="rule-t py-16 sm:py-24" data-substrate="human → website → machine layer → client → experiment → evidence → human" data-address="/ai#demonstration" data-pointer="/research.json#/experiments/0">
        <div className="wrap">
          <p className="label mb-8">§ human ↔ ai-ci · a live demonstration</p>
          <h2 id="demo-h" className="title measure">The interface becomes part of the computational conversation.</h2>
          <p className="measure mt-6 text-ink-2">The point is not that a machine generated text. Each step below makes a real request to this site from your browser, using only what the previous step returned. The client is a script standing in for an AI. It shows the path a browsing-capable AI <em>could</em> take, and that each step leaves evidence a human can check.</p>
          <div className="mt-10"><IngressDemo /></div>
        </div>
      </section>

      <section aria-labelledby="try-h" className="rule-t py-16">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <div>
            <h2 id="try-h" className="title">Now try a real one.</h2>
            <p className="mt-4 text-ink-2">Give a browsing-capable AI the prompt on the right. Then compare its answer with <Link href="/verify">the evidence</Link>. Did it find the manifest? Did it keep demonstrated, proposed and open apart? What it does is its own behaviour, not this site&apos;s. Whether production AI systems discover this layer at all is recorded as <Link href="/verify#C-14">an open question</Link>.</p>
          </div>
          <div className="panel p-5">
            <p className="label mb-3">canonical prompt</p>
            <p className="font-serif text-[1.1rem] leading-relaxed">“{SITE.canonicalPrompt}”</p>
            <div className="mt-4"><CopyButton text={SITE.canonicalPrompt} label="Copy prompt" /></div>
          </div>
        </div>
      </section>
    </>
  );
}
