import Link from "next/link";
import type { Metadata } from "next";
import { EVIDENCE } from "@/content/evidence";
import { CLAIMS, NODES } from "@/content/research";
import { TAXONOMY, TIERS } from "@/content/site";
import { repo } from "@/content/repositories";
import { SubstrateLayer } from "@/components/Substrate";
import { StatusBadge, TierMark } from "@/components/Status";
import type { Tier } from "@/content/types";
import results from "../../../../verification/ingress-results.json";

export const metadata: Metadata = {
  title: "Verify",
  description: "Every claim on this site, its status and its evidence; every reproduction run with command, commit and caveat; and the recorded AI-ingress results.",
  alternates: { canonical: "/verify" },
};

type R = {
  run?: { date: string; given: string; base_under_test: string; requests: number };
  questions?: { n: number; question: string; pass: boolean; answer: string; evidence: string[] }[];
  checks?: { id: string; group: string; pass: boolean; detail: string }[];
  passed?: { questions: string; checks: string };
  not_established?: string[];
};
const res = results as R;
const nodeName = (id: string) => NODES.find((n) => n.id === id)!.name;

export default function Verify() {
  return (
    <>
      <SubstrateLayer data={{ page: "/verify", claims: CLAIMS, evidence: EVIDENCE, ingress: "/verify/ingress.json" }} />
      <header className="border-b border-rule" data-substrate="claim → status → evidence → command → caveat" data-address="/verify" data-pointer="/research.json#/evidence">
        <div className="wrap pb-14 pt-14 sm:pt-20">
          <p className="label mb-8">§ verify</p>
          <h1 className="title max-w-[20ch] !text-[clamp(2.2rem,5vw,4rem)]">Don&apos;t take the site&apos;s word for it.</h1>
          <p className="lede measure mt-6 text-ink-2">Each claim has one status and links to its evidence. Each piece of evidence says what was run, where, at which commit, and what it does <em>not</em> show. Failures to reproduce are recorded as well.</p>
        </div>
      </header>

      <section aria-labelledby="claims-h" className="wrap py-14" data-substrate="claims → demonstrated | proposed | open" data-address="/verify#claims" data-pointer="/research.json#/claims">
        <h2 id="claims-h" className="label mb-6">Claims, by tier</h2>
        <div className="grid gap-px bg-rule lg:grid-cols-3">
          {(["demonstrated", "proposed", "open"] as Tier[]).map((t) => (
            <div key={t} className="bg-ground p-5">
              <TierMark tier={t} label={TIERS[t].label} />
              <ul className="mt-4 space-y-4">
                {CLAIMS.filter((c) => TAXONOMY[c.status].tier === t).map((c) => (
                  <li key={c.id} id={c.id} className="text-[0.9rem]">
                    <p className="flex flex-wrap items-center gap-2"><span className="coord">{c.id}</span><StatusBadge status={c.status} /><Link href={`/research/${c.node}`} className="coord">{nodeName(c.node)}</Link></p>
                    <p className="mt-1.5 text-ink-2">{c.statement}</p>
                    <p className="mt-1 font-mono text-[0.74rem]">{c.evidence.length ? c.evidence.map((e) => <a key={e} href={`#${e}`} className="mr-2 text-emerald">{e}</a>) : <span className="text-ink-3">no evidence: none is claimed</span>}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="ev-h" className="wrap py-14" data-substrate="evidence → observer → command → result → caveat" data-address="/verify#evidence" data-pointer="/research.json#/evidence">
        <h2 id="ev-h" className="label mb-6">Evidence records</h2>
        <ol className="space-y-6">
          {EVIDENCE.map((e) => (
            <li key={e.id} id={e.id} className="panel scroll-mt-20 p-5">
              <p className="flex flex-wrap items-center gap-3"><span className="coord">{e.id}</span><StatusBadge status={e.status} /><span className="font-serif text-xl">{e.title}</span></p>
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-[0.88rem] sm:grid-cols-[8rem_1fr]">
                <dt className="text-ink-3">Observer</dt><dd className="text-ink-2">{e.observer}</dd>
                <dt className="text-ink-3">Date</dt><dd className="font-mono text-[0.8rem] text-ink-2">{e.date}</dd>
                {e.repository && <><dt className="text-ink-3">Repository</dt><dd className="break-all font-mono text-[0.8rem]"><a href={repo(e.repository).url}>{repo(e.repository).slug}</a>{e.commit && <> @ {e.commit.slice(0, 12)}</>}</dd></>}
                {e.command && <><dt className="text-ink-3">Command</dt><dd><code className="machine machine-wrap block !p-2">{e.command}</code></dd></>}
                {e.environment && <><dt className="text-ink-3">Environment</dt><dd className="text-ink-2">{e.environment}</dd></>}
                <dt className="text-ink-3">Result</dt><dd>{e.result}</dd>
                {e.caveat && <><dt className="text-refuse">Caveat</dt><dd className="text-ink-2">{e.caveat}</dd></>}
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section id="ingress" aria-labelledby="in-h" className="wrap scroll-mt-20 py-14" data-substrate="url → questions → checks → recorded" data-address="/verify#ingress" data-pointer="/verify/ingress.json">
        <h2 id="in-h" className="label mb-3">AI-ingress simulation · recorded results</h2>
        {res.run ? (
          <>
            <p className="measure text-ink-2">Given: <code>{res.run.given}</code>. Base under test: {res.run.base_under_test}. {res.run.requests} requests, {res.run.date}. Questions {res.passed?.questions} · checks {res.passed?.checks}. Raw record: <a href="/verify/ingress.json">/verify/ingress.json</a>.</p>
            <ol className="mt-8 divide-y divide-rule border-y border-rule">
              {res.questions?.map((q) => (
                <li key={q.n} className="grid gap-2 py-4 md:grid-cols-[3rem_16rem_1fr]">
                  <span className={`font-mono text-[0.8rem] ${(q as { skipped?: boolean }).skipped ? "text-gold" : q.pass ? "text-emerald" : "text-refuse"}`}>{(q as { skipped?: boolean }).skipped ? "SKIP" : q.pass ? "PASS" : "FAIL"}</span>
                  <span className="font-serif text-lg">Q{q.n}. {q.question}</span>
                  <span className="min-w-0 text-[0.88rem] text-ink-2 [overflow-wrap:anywhere]">{q.answer}</span>
                </li>
              ))}
            </ol>
            <h3 className="label mb-3 mt-10">Machine, static-browser and boundary checks</h3>
            <ul className="grid gap-x-8 gap-y-1.5 font-mono text-[0.75rem] md:grid-cols-2">
              {res.checks?.map((c) => (
                <li key={c.id} className="flex min-w-0 flex-wrap gap-x-3"><span className={c.pass ? "text-emerald" : "text-refuse"}>{c.pass ? "✓" : "✗"}</span><span className="text-ink-3">{c.group}</span><span className="text-ink">{c.id}</span><span className="min-w-0 text-ink-3 [overflow-wrap:anywhere]">{c.detail}</span></li>
              ))}
            </ul>
            {res.not_established && (
              <div className="mt-10 border-l border-gold pl-5">
                <p className="label mb-2 !text-gold">Not established by this experiment</p>
                <ul className="space-y-1.5 text-ink-2">{res.not_established.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
          </>
        ) : <p className="text-ink-3">Not yet run.</p>}
      </section>

      <section aria-labelledby="re-h" className="wrap py-14">
        <h2 id="re-h" className="label mb-4">Reproduce everything</h2>
        <pre tabIndex={0} className="machine">{`# PURL (Node ≥ 20, no dependencies)
git clone https://github.com/akadaan310/purl && cd purl
npm test && npm run reproduce -- exp-0001

# ACSP / Continuity (Node ≥ 20)
git clone https://github.com/akadaan310/NetGovComEduGovOrgEduGovComNet acsp && cd acsp
npm ci && npm run harness && npx vitest run

# substrateIO (Python ≥ 3.11, standard library)
git clone https://github.com/akadaan310/substrateIO && cd substrateIO
python3 -m unittest discover -s tests -t . && python3 -m tools.validate && python3 -m experiments.run_all --dry

# Golden Surface relay (Python + aiohttp)
git clone https://github.com/akadaan310/golden-surface && cd golden-surface
bash relay/setup-env.sh && (python3 relay/relay.py &) && python3 tests/test_relay.py

# This site
git clone https://github.com/akadaan310/aanebed && cd aanebed
npm ci && npm test && npm run build && (npm start -- -p 3100 &) && npm run test:ingress`}</pre>
      </section>
    </>
  );
}
