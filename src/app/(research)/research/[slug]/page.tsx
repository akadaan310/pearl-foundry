import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NODES, RELATIONS, CLAIMS } from "@/content/research";
import { EVIDENCE } from "@/content/evidence";
import { EXPERIMENTS } from "@/content/experiments";
import { TIERS } from "@/content/site";
import { repo, blob } from "@/content/repositories";
import { SubstrateLayer, SubstrateDisclosure } from "@/components/Substrate";
import { StatusBadge, TierMark } from "@/components/Status";
import { GoldenSyncModel } from "@/components/GoldenSyncModel";
import { AddressConsole } from "@/components/AddressConsole";
import type { Tier } from "@/content/types";

export function generateStaticParams() {
  return NODES.map((n) => ({ slug: n.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const n = NODES.find((x) => x.id === slug);
  if (!n) return {};
  return { title: n.name, description: n.line, alternates: { canonical: `/research/${n.id}` } };
}

const ACSP_FLOW = ` Human        Session A              ACSP (https://host)              Session B
   │  research    │                          │                            │
   │─────────────►│ POST /r  create          │                            │
   │              │─────────────────────────►│ v1  + owner capability     │
   │              │ POST …/operations append │                            │
   │              │─────────────────────────►│ v2  TOK-001 (src: A)       │
   │              │ POST …/operations checkpoint                          │
   │              │─────────────────────────►│ v3  checkpoint 1           │
   │◄─────────────│ "here is the URL"        │                            │
   │───────────────────── gives https://host/r/7F82KQ3M9XTA ─────────────►│
   │              │                          │◄──── GET /r/7F82KQ3M9XTA ──│
   │              │                          │───── bootstrap, state, ───►│
   │              │                          │      knowledge, operations,│
   │              │                          │      your authority: read  │
   │              │                          │◄──── POST propose (no cap) │ v4  P-001 pending (asserted)
   │              │ accept P-001 ───────────►│ v5,v6  TOK-002 (src: B, recorded by A)
   │              │ delegate → session-b ───►│ v7  cap bound to session-b │
   │───────────────────── gives B its capability (out of band) ──────────►│
   │              │                          │◄──── POST append (Bearer) ─│ v8  TOK-003 (src: B, capability)
   │              │ GET /r/… ───────────────►│                            │
   │              │◄─ sees TOK-003 by session-b; A still owner; B never became A`;

const PURL_DEMO = [
  "A human creates a resource and delegates a scoped task to Agent A.",
  "Agent A opens the URL, reads the manifest, and sees what it may and may not do. It appends a finding (allowed) and is refused update (not delegated), exactly as the manifest predicted.",
  "Agent A hands off to Agent B: checkpoint, attenuated grant and assignment, atomically. The owner does not change.",
  "Agent B reads the continuity view: the checkpoint addressed to it, whether its state hash matches the log, and the package marked as claims.",
  "Agent B performs the delegated operation. Its event records the chain g_B → g_A. B's attempts to transfer ownership or widen grants are refused.",
  "The human replays the log independently and checks every hash.",
  "B forks; the fork has lineage but no copied grants. A supersedes its first finding, and the original stays. The human merges the branch.",
];

export default async function NodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = NODES.find((x) => x.id === slug);
  if (!n) notFound();
  const i = NODES.indexOf(n);
  const r = n.repository ? repo(n.repository) : null;
  const claims = CLAIMS.filter((c) => c.node === n.id);
  const evIds = new Set(claims.flatMap((c) => c.evidence));
  const evidence = EVIDENCE.filter((e) => evIds.has(e.id) || (e.repository && e.repository === n.repository));
  const rels = RELATIONS.filter((x) => x.from === n.id || x.to === n.id);
  const exps = EXPERIMENTS.filter((e) => n.experiments.includes(e.id));
  const name = (id: string) => NODES.find((x) => x.id === id)!.name;
  const docUrl = (p: string) => (p.startsWith("/") ? p : blob(n.repository!, p));

  return (
    <article>
      <SubstrateLayer data={{ page: `/research/${n.id}`, node: n, claims, relations: rels, manifest: `/research.json#/research/${i}` }} />
      <header className="grid-paper border-b border-rule" data-substrate={n.substrate.join(" ")} data-address={`/research/${n.id}`} data-pointer={`/research.json#/research/${i}`}>
        <div className="wrap pb-14 pt-14 sm:pt-20">
          <nav aria-label="Breadcrumb" className="label mb-10"><Link href="/research" className="no-underline hover:text-emerald">Research</Link> / {n.id} · {n.kind} · {n.position.x},{n.position.y}</nav>
          <h1 className="display max-w-[14ch]">{n.name}</h1>
          <p className="lede measure mt-6">{n.line}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {r && r.id !== "site" && (
              <a href={r.url} className="arrow-link break-all font-mono text-[0.8rem]">github.com/{r.slug} →</a>
            )}
            {r && r.commit !== "HEAD" && <span className="coord">described at commit {r.commit.slice(0, 7)}</span>}
            <SubstrateDisclosure lines={n.substrate} />
          </div>
        </div>
      </header>

      <div className="wrap grid gap-16 py-16 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-16">
          <section aria-labelledby="what">
            <h2 id="what" className="label mb-4">What it is</h2>
            <p className="max-w-[44rem] text-[1.05rem] leading-relaxed">{n.what}</p>
          </section>
          <section aria-labelledby="why">
            <h2 id="why" className="label mb-4">Why it exists</h2>
            <p className="max-w-[44rem] text-ink-2">{n.why}</p>
          </section>
          <section aria-labelledby="question">
            <h2 id="question" className="label mb-4">Research question</h2>
            <p className="max-w-[40rem] font-serif text-2xl leading-snug">{n.researchQuestion}</p>
          </section>
          <section aria-labelledby="impl">
            <h2 id="impl" className="label mb-4">Current implementation</h2>
            <ul className="max-w-[44rem] space-y-2.5 text-ink-2">{n.implementation.map((x, k) => <li key={k} className="border-l border-rule pl-4">{x}</li>)}</ul>
          </section>

          <section aria-labelledby="states">
            <h2 id="states" className="label mb-4">Demonstrated · Proposed · Open</h2>
            <div className="grid gap-px bg-rule md:grid-cols-3">
              {([["demonstrated", n.demonstrated], ["proposed", n.proposed], ["open", n.open]] as [Tier, string[]][]).map(([t, items]) => (
                <div key={t} className="bg-ground p-5">
                  <TierMark tier={t} label={TIERS[t].label} />
                  <ul className="mt-4 space-y-3 text-[0.9rem] text-ink-2">{items.map((x, k) => <li key={k}>{x}</li>)}</ul>
                </div>
              ))}
            </div>
          </section>

          {n.id === "continuity" && (
            <section aria-labelledby="flow">
              <h2 id="flow" className="label mb-4">The core flow (from the repository README, executable as the core-demonstration scenario)</h2>
              <figure>
                <pre tabIndex={0} className="machine text-[0.7rem] leading-[1.45]" aria-label="Sequence diagram of the ACSP core flow">{ACSP_FLOW}</pre>
                <figcaption className="mt-2 text-[0.8rem] text-ink-3">Session B contributes under its own identity. Neither session becomes the other. <code>npm run harness -- core-demonstration -v</code>: 89 checks, reproduced (E-003).</figcaption>
              </figure>
            </section>
          )}

          {n.id === "purl" && (
            <section aria-labelledby="demo">
              <h2 id="demo" className="label mb-4">The demonstration (npm run demo), run by a generic manifest-driven client</h2>
              <ol className="max-w-[44rem] space-y-3">
                {PURL_DEMO.map((x, k) => <li key={k} className="grid grid-cols-[2rem_1fr] text-ink-2"><span className="coord pt-1">{String(k + 1).padStart(2, "0")}</span>{x}</li>)}
              </ol>
              <p className="mt-6 text-[0.9rem] text-ink-3">Invariants, each enforced by a mechanism and checked by a test: continuity does not imply identity · reference does not imply ownership · awareness does not imply authority · access does not imply control · handoff does not imply merger · observation does not imply interpretation · interpretation does not imply conclusion · delegation does not erase provenance · forking does not destroy lineage · supersession does not require deletion.</p>
            </section>
          )}

          {n.id === "substrate" && (
            <section aria-labelledby="addr">
              <h2 id="addr" className="label mb-4">Its computational addresses, resolved on this site</h2>
              <AddressConsole initial="/map/eca/90/8/state/5/orbit" />
            </section>
          )}

          {n.id === "golden-surface" && (
            <section id="model" aria-labelledby="model-h">
              <h2 id="model-h" className="label mb-4">The sync model, operable</h2>
              <p className="mb-6 max-w-[44rem] text-ink-2">Issue ops at the twin, deliver them to the phone, drop one on purpose, take the link down, and resync. Watch which divergence class appears and how convergence returns. Each state is recomputed under the declared rules.</p>
              <GoldenSyncModel />
            </section>
          )}

          {claims.length > 0 && (
            <section aria-labelledby="claims">
              <h2 id="claims" className="label mb-4">Claims</h2>
              <ul className="divide-y divide-rule border-y border-rule">
                {claims.map((c) => (
                  <li key={c.id} id={c.id} className="grid gap-2 py-4 sm:grid-cols-[4rem_8.5rem_1fr]">
                    <span className="coord">{c.id}</span>
                    <span><StatusBadge status={c.status} /></span>
                    <span className="text-ink-2">{c.statement}{" "}
                      {c.evidence.map((e) => <Link key={e} href={`/verify#${e}`} className="ml-1 font-mono text-[0.75rem] text-emerald">{e}</Link>)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {evidence.length > 0 && (
            <section aria-labelledby="evidence">
              <h2 id="evidence" className="label mb-4">Evidence</h2>
              <ul className="space-y-4">
                {evidence.map((e) => (
                  <li key={e.id} className="panel p-4">
                    <p className="flex flex-wrap items-center gap-3"><span className="coord">{e.id}</span><StatusBadge status={e.status} /><span className="font-serif text-lg">{e.title}</span></p>
                    <p className="mt-2 text-[0.9rem] text-ink-2">{e.result}</p>
                    {e.caveat && <p className="mt-2 text-[0.85rem] text-ink-3">Caveat: {e.caveat}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="limits">
            <h2 id="limits" className="label mb-4">Limitations</h2>
            <ul className="max-w-[44rem] space-y-2 text-ink-2">{n.limitations.map((x, k) => <li key={k} className="border-l border-refuse/50 pl-4">{x}</li>)}</ul>
          </section>
        </div>

        <aside className="space-y-10 lg:sticky lg:top-20 lg:self-start" aria-label="Repository, documents, relations">
          {r && (
            <div>
              <p className="label mb-3">Repository</p>
              <a href={r.url} className="break-all font-mono text-[0.8rem]">{r.slug}</a>
              <p className="coord mt-1">{r.commit === "HEAD" ? "this site" : `commit ${r.commit.slice(0, 12)}`}</p>
            </div>
          )}
          {n.documents.length > 0 && (
            <div>
              <p className="label mb-3">Protocol documents</p>
              <ul className="space-y-1.5 text-[0.88rem]">{n.documents.map((d) => <li key={d.path}><a href={docUrl(d.path)}>{d.label}</a></li>)}</ul>
            </div>
          )}
          {exps.length > 0 && (
            <div>
              <p className="label mb-3">Experiments</p>
              <ul className="space-y-1.5 text-[0.88rem]">{exps.map((e) => <li key={e.id}><Link href={`/experiments#${e.id}`}>{e.name}</Link></li>)}</ul>
            </div>
          )}
          <div>
            <p className="label mb-3">Relations</p>
            <ul className="space-y-3 text-[0.84rem] text-ink-2">
              {rels.map((x, k) => {
                const other = x.from === n.id ? x.to : x.from;
                return (
                  <li key={k}>
                    <Link href={`/research/${other}`} className="font-serif text-[1rem] text-ink">{x.from === n.id ? "→" : "←"} {name(other)}</Link>
                    <span className="block">{x.label}</span>
                    <span className="coord block">{x.source}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </article>
  );
}
