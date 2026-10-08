import Link from "next/link";
import { SITE, TAXONOMY, TIERS } from "@/content/site";
import { NODES, CLAIMS, node } from "@/content/research";
import { MACHINE_VOICE } from "@/content/people";
import { Section } from "@/components/Section";
import { SubstrateLayer, SubstrateDisclosure } from "@/components/Substrate";
import { StatusBadge, TierMark } from "@/components/Status";
import { Constellation } from "@/components/Constellation";
import { Chain } from "@/components/Chain";
import { AddressConsole } from "@/components/AddressConsole";
import { CopyButton } from "@/components/CopyPrompt";
import type { EvidenceStatus, Tier } from "@/content/types";
import { OFFER, LIFE_EXAMPLE } from "@/content/compose";
import { ORIGIN } from "@/config/origin";
import { PearlGlyph } from "@/components/ExperienceView";

const SECTIONS = [
  { id: "ai-ci", substrate: node("ai-ci").substrate, address: "/research/ai-ci", pointer: "/research.json#/thesis" },
  { id: "map", substrate: ["research", "→ nodes", "→ relations", "→ sources"], address: "/research", pointer: "/research.json#/research" },
  { id: "address", substrate: node("purl").substrate, address: "/x/map/eca/90/8/state/5/next", pointer: "/research.json#/experiments/1" },
  { id: "golden", substrate: node("golden-surface").substrate, address: "/research/golden-surface", pointer: "/research.json#/research/4" },
  { id: "continuity", substrate: node("continuity").substrate, address: "/research/continuity", pointer: "/research.json#/research/1" },
  { id: "evidence", substrate: ["claim", "→ status", "→ evidence", "→ caveat"], address: "/verify", pointer: "/research.json#/claims" },
  { id: "machine", substrate: ["participant", "→ machine", "≠ author"], address: "/about#machine", pointer: "/research.json#/identity/machine_participant" },
  { id: "ingress", substrate: ["url", "→ manifest", "→ topology", "→ experiment", "→ evidence", "→ report"], address: "/protocol", pointer: "/.well-known/ai" },
];
const S = Object.fromEntries(SECTIONS.map((s) => [s.id, { "data-substrate": s.substrate.join(" "), "data-address": s.address, "data-pointer": s.pointer }]));

const count = (t: Tier) => CLAIMS.filter((c) => TAXONOMY[c.status].tier === t).length;

export const metadata = { title: "Explore", description: "The system under Pearls: the URL grammar, computational addresses, continuity, provenance and the research topology.", alternates: { canonical: "/explore" } };

export default function Explore() {
  const cont = node("continuity");
  return (
    <>
      <SubstrateLayer data={{ page: "/explore", kind: "research-surface", thesis: SITE.thesis, sections: SECTIONS, manifest: "/research.json", ai_manifest: "/.well-known/ai" }} />

      <section aria-labelledby="hero-h" className="grid-paper relative border-b border-rule" data-substrate="url → grammar → resource → computation → continuity → research" data-address="/explore" data-pointer="/research.json">
        <div className="wrap pb-16 pt-14 sm:pt-20">
          <p className="label mb-8 flex items-center gap-2"><PearlGlyph /> explore · the system under Pearls</p>
          <h1 id="hero-h" className="display max-w-[13ch]">The web is becoming programmable.</h1>
          <p className="lede mt-8 max-w-[40ch]">{SITE.oneSentence} Pearls are the product; this is the grammar, the computation, the continuity model and the research underneath.</p>
          <ul className="mt-10 flex flex-wrap gap-3 text-[0.9rem]">
            {[["Live addresses", "/live"], ["Play: the Seven Verbs", "/play"], ["The Pearl grammar", "/compose"], ["Capabilities", "/capabilities"], ["Research map", "/research"], ["AI Laboratory", "/ai"], ["Verify every claim", "/verify"], ["Schemas", "/schemas/pearl.schema.json"]].map(([k, h]) => (
              <li key={h}><a href={h} className="btn">{k}</a></li>
            ))}
          </ul>
        </div>
      </section>

      {/* The offer, in visible text, for the AI reading this page */}
      <section id="for-ai" aria-labelledby="for-ai-h" className="border-b border-rule" data-substrate="offer → take stock → compose → give → continue" data-address="/explore#for-ai" data-pointer="/.well-known/ai#/compose">
        <div className="wrap py-14">
          <div className="border border-emerald/40 bg-emerald-deep/15 p-5 sm:p-8">
            <p className="label mb-3 !text-emerald">{OFFER.label}</p>
            <h2 id="for-ai-h" className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] leading-tight">{OFFER.headline}</h2>
            <p className="mt-3 max-w-[60rem] text-ink-2">{OFFER.why}</p>
            <ol className="mt-6 grid gap-px bg-rule lg:grid-cols-4">
              {OFFER.steps.map((s) => (
                <li key={s.n} className="bg-ground p-4">
                  <p className="coord">{String(s.n).padStart(2, "0")}</p>
                  <p className="mt-1 font-serif text-lg">{s.name}</p>
                  <p className="mt-2 text-[0.88rem] text-ink-2">{s.text}</p>
                </li>
              ))}
            </ol>
            <p className="label mb-2 mt-6">URL template</p>
            <pre tabIndex={0} className="machine machine-wrap !text-[0.76rem]">{OFFER.template}</pre>
            <p className="label mb-2 mt-5">A complete example</p>
            <pre tabIndex={0} className="machine machine-wrap !text-[0.72rem]"><a href={LIFE_EXAMPLE.replace(ORIGIN, "")} className="no-underline">{LIFE_EXAMPLE}</a></pre>
            <ul className="mt-5 space-y-1 text-[0.85rem] text-ink-3">{OFFER.rules.map((r, i) => <li key={i}>· {r}</li>)}</ul>
            <p className="mt-4 text-[0.85rem]">Full grammar: <Link href="/compose">/compose</Link> · machine copies: <a href="/llms.txt">/llms.txt</a>, <a href="/ai.txt">/ai.txt</a>, <a href="/.well-known/ai">/.well-known/ai</a></p>
          </div>
        </div>
      </section>

      {/* The relationship between the research and the product */}
      <section aria-labelledby="path-h" className="border-b border-rule" data-substrate="research → protocol → pearl → workspace → experiment" data-address="/research" data-pointer="/research.json">
        <div className="wrap py-14">
          <p className="label mb-3">a research laboratory that became a usable product</p>
          <h2 id="path-h" className="title mb-8">From an idea to a working demonstration, and back to the implementation.</h2>
          <ol className="grid gap-px border border-rule bg-rule sm:grid-cols-5">
            {[
              ["Research", "/research", "AI-CI and seven repositories, each claim with evidence."],
              ["Protocol", "/compose", "The experience/1 grammar: a document carried by a URL."],
              ["Pearl", "/#bring", "A validated document with a content id."],
              ["Workspace", "/workspace", "Keep, organise and export Pearls in your browser."],
              ["Experiment", "/verify", "Every capability tested; every limit stated."],
            ].map(([k, href, v], i) => (
              <li key={k} className="bg-ground p-4">
                <p className="coord">{String(i).padStart(2, "0")}</p>
                <p className="mt-1 font-serif text-xl"><Link href={href} className="no-underline hover:text-gold">{k}</Link>{i < 4 && <span aria-hidden="true" className="ml-2 font-mono text-[0.9rem] text-emerald">→</span>}</p>
                <p className="mt-1 text-[0.85rem] text-ink-2">{v}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* AI-CI */}
      <Section data={S["ai-ci"]} id="ai-ci" n="01" kicker="the thesis" title={<>The web is becoming programmable. From HCI to AI-CI.</>} aside={<SubstrateDisclosure lines={node("ai-ci").substrate} />}>
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div className="prose-research measure">
            <p className="lede !text-ink">What happens when the computer interface is no longer designed only for humans, but is legible to humans and to machine intelligence at once?</p>
            <p className="mt-6">AI-CI is Abed Kadaan&apos;s term for this line of research. It is not an established academic field. It has two readings. <em>Artificial Intelligence → Actual Intelligence</em> names a direction. <em>Artificial Intelligence–Computer Interaction</em> places the work beside HCI.</p>
            <p>This site tests it on itself. Every page has a human surface and a machine representation built from the same records. Open the small <span className="font-mono text-[0.8rem] text-emerald">⌁ substrate</span> marks beside the headings to see it.</p>
          </div>
          <figure aria-label="From HCI to AI-CI" className="panel grid content-center gap-8 p-8">
            <div>
              <p className="label">HCI</p>
              <p className="mt-2 font-serif text-3xl">Human <span className="text-ink-3">→</span> Computer</p>
            </div>
            <div className="rule-t pt-8">
              <p className="label !text-emerald">AI-CI</p>
              <p className="mt-2 font-serif text-3xl">Human <span className="text-emerald">↔</span> Computer <span className="text-emerald">↔</span> AI</p>
              <p className="mt-4 text-[0.9rem] text-ink-2">One surface that is at once a human interface, a machine-readable interface, a programmable interface, an agent interface, an execution surface, and a persistent research object.</p>
            </div>
          </figure>
        </div>
      </Section>

      {/* Research map */}
      <Section data={S["map"]} id="map" n="02" kicker="the research topology" title="Not projects. Nodes in one evolving system." aside={<SubstrateDisclosure lines={SECTIONS[1].substrate} />}>
        <p className="measure mb-10 text-ink-2">Seven public repositories and the thesis that connects them. Every edge cites the file in which it is stated. Hover over or focus a node to see its relations.</p>
        <Constellation />
        <p className="mt-6"><Link href="/research" className="arrow-link">Each node: what it is, what was demonstrated, what is open →</Link></p>
      </Section>

      {/* Address */}
      <Section data={S["address"]} id="address" n="03" kicker="programmable addresses" title="An address that computes." aside={<SubstrateDisclosure lines={node("purl").substrate} />}>
        <div className="grid gap-10">
          <div className="prose-research grid gap-6 lg:grid-cols-2 lg:gap-12">
            <p>A URL usually points to a document. In <Link href="/research/purl">PURL</Link> and <Link href="/research/substrate">substrateIO</Link>, an address can denote a resource and the operations on it. It can also denote a derivation: a map, a state under that map, one transition, a perturbation.</p>
            <p>This site resolves that second kind of address itself, under <code>/x</code>. The resolver is pure and bounded. It never evaluates anything a visitor sends; path segments are looked up in a fixed registry. Your browser recomputes every hash it reports. The values also match substrateIO&apos;s own Python resolver for every reference address (<Link href="/verify#E-006">E-006</Link>).</p>
          </div>
          <Chain
            steps={[
              { k: "Address", v: "/x/map/eca/90/8/state/5/next" },
              { k: "Program", v: "map.eca(90, 8) → state(5) → next" },
              { k: "State", v: "x = 5 · 00000101" },
              { k: "Transition", v: "5 → 136 · Δ xor 141" },
              { k: "Result", v: "sha256:6927c50a…fdb8ad" },
            ]}
            caption="Rule 90 on a ring of 8 cells. The whole computation is the address."
          />
        </div>
        <div className="mt-10">
          <AddressConsole />
          <noscript>
            <p className="mt-4 text-ink-2">Without JavaScript, open an address directly: <a href="/x/map/eca/90/8/state/5/next">/x/map/eca/90/8/state/5/next</a> · <a href="/x/map/eca/30/16/state/256/trace/24">a trace</a> · <a href="/x">the registry</a>.</p>
          </noscript>
        </div>
      </Section>

      {/* Golden Surface */}
      <section id="golden" aria-labelledby="golden-h" className="rule-t relative overflow-hidden py-16 sm:py-24" {...S.golden}>
        <div className="wrap">
          <div className="mb-10 flex items-baseline justify-between gap-6">
            <p className="label"><a href="#golden" className="no-underline hover:text-emerald">§ 04</a> · the shared surface</p>
            <SubstrateDisclosure lines={node("golden-surface").substrate} />
          </div>
          <h2 id="golden-h" className="title measure"><span className="text-gold">Golden Surface</span>: where the protocol becomes browser behaviour.</h2>
          <div className="mt-12 grid gap-px border border-gold/30 bg-gold/20 lg:grid-cols-3">
            <div className="bg-ground p-6">
              <p className="label !text-gold">participants</p>
              <ul className="mt-4 space-y-3">
                <li><span className="font-serif text-xl">Abed</span> <span className="block text-[0.85rem] text-ink-2">pilot · Android phone · the only one who types credentials</span></li>
                <li><span className="font-serif text-xl">ر</span> <span className="text-ink-3">(Muse)</span> <span className="block text-[0.85rem] text-ink-2">operator · drives the relay and the twin</span></li>
                <li><span className="font-serif text-xl">ن</span> <span className="text-ink-3">(Hu)</span> <span className="block text-[0.85rem] text-ink-2">counsel seat · joins through the relay</span></li>
              </ul>
            </div>
            <div className="bg-ground p-6">
              <p className="label !text-gold">permitted operations</p>
              <p className="mt-4 font-mono text-[0.82rem] leading-7 text-ink-2">newtab · open · read · shot · tap · type · closetab · login_request</p>
              <p className="label mt-6 !text-gold">authority boundaries</p>
              <ul className="mt-3 space-y-1.5 text-[0.88rem] text-ink-2">
                <li>Every tab has exactly one owner.</li>
                <li><code>type</code> is refused on password fields.</li>
                <li>Session values never enter the database.</li>
                <li>Ownership violations return 403.</li>
              </ul>
            </div>
            <div className="bg-ground p-6">
              <p className="label !text-gold">observable outcome</p>
              <p className="mt-4 font-mono text-[0.85rem] leading-7">
                converged ⇔<br />&nbsp;&nbsp;link up<br />&nbsp;&nbsp;∧ no pending ops<br />&nbsp;&nbsp;∧ hash(T) = hash(P)
              </p>
              <p className="mt-4 text-[0.85rem] text-ink-2">Divergence classes: link-down · op-in-flight · op-lost · op-rejected · state-mismatch · session-mirror-only. None of them is ever silent.</p>
            </div>
          </div>
          <p className="mt-6 flex flex-wrap gap-6">
            <Link href="/research/golden-surface#model" className="arrow-link">Operate the sync model →</Link>
            <a href="https://github.com/akadaan310/golden-surface/blob/b11371878e8bda63b45848d42d41351fdaa273a8/docs/SYNC.md" className="arrow-link">Read docs/SYNC.md →</a>
          </p>
        </div>
      </section>

      {/* Continuity */}
      <Section data={S["continuity"]} id="continuity" n="05" kicker="a foundational experiment" title="Continuity, without identity." aside={<SubstrateDisclosure lines={cont.substrate} />}>
        <p className="measure mb-10 text-ink-2">{cont.line} It does not claim to solve AI continuity in general. It states exactly what has been shown.</p>
        <div className="grid gap-px bg-rule md:grid-cols-3">
          {([["demonstrated", cont.demonstrated], ["proposed", cont.proposed], ["open", cont.open]] as [Tier, string[]][]).map(([t, items]) => (
            <div key={t} className="bg-ground p-6">
              <TierMark tier={t} label={TIERS[t].label} />
              <p className="mt-1 text-[0.8rem] text-ink-3">{TIERS[t].definition}</p>
              <ul className="mt-5 space-y-3 text-[0.9rem] text-ink-2">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
        <p className="mt-6"><Link href="/research/continuity" className="arrow-link">The Continuity Protocol in full →</Link></p>
      </Section>

      {/* Evidence */}
      <Section data={S["evidence"]} id="evidence" n="06" kicker="the evidence system" title="“I built it.” “I tested it.” “I observed it.” “I think this could become something larger.”" aside={<SubstrateDisclosure lines={SECTIONS[5].substrate} />}>
        <p className="measure mb-10 text-ink-2">These are different statements. This site gives each claim exactly one status and links it to the evidence for that status. The credibility comes from keeping them apart.</p>
        <dl className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(TAXONOMY) as EvidenceStatus[]).map((s) => (
            <div key={s} className="bg-ground p-5">
              <dt className="flex items-center justify-between gap-3"><StatusBadge status={s} /><span className="coord">{CLAIMS.filter((c) => c.status === s).length} claims</span></dt>
              <dd className="mt-3 text-[0.86rem] text-ink-2">{TAXONOMY[s].definition}</dd>
            </div>
          ))}
          <div className="bg-ground p-5">
            <dt className="label">Read them all</dt>
            <dd className="mt-3 text-[0.86rem]"><Link href="/verify" className="arrow-link">Claims, evidence, commands →</Link></dd>
          </div>
        </dl>
      </Section>

      {/* The other engineer */}
      <Section data={S["machine"]} id="machine" n="07" kicker="the other engineer" title="Machine perspective." aside={<SubstrateDisclosure lines={SECTIONS[6].substrate} />}>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <blockquote className="border-l border-rule-strong pl-6">
            {MACHINE_VOICE.statement.map((p, i) => (
              <p key={i} className={i === 0 ? "lede" : "mt-4 text-ink-2"}>{p}</p>
            ))}
            <footer className="mt-6 font-mono text-[0.75rem] text-ink-3">— {MACHINE_VOICE.author}</footer>
          </blockquote>
          <div>
            <p className="label mb-4">AI collaboration ≠ AI authorship</p>
            <table className="w-full border-collapse text-[0.9rem]">
              <thead><tr className="label"><th scope="col" className="rule-b py-2 text-left font-normal">Abed Kadaan</th><th scope="col" className="rule-b py-2 text-left font-normal">Machine-side participant</th></tr></thead>
              <tbody>{MACHINE_VOICE.roles.map((r) => <tr key={r.human} className="rule-b"><td className="py-3 pr-4 font-serif">{r.human}</td><td className="py-3 text-ink-2">{r.machine}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Ingress */}
      <Section data={S["ingress"]} id="ingress" n="08" kicker="the url as a research object" title="The URL is an interface. Here is what that means." aside={<SubstrateDisclosure lines={SECTIONS[7].substrate} />}>
        <div className="grid gap-12 lg:grid-cols-2">
          <div className="prose-research measure">
            <p>A browsing-capable AI given only <code>{SITE.origin}</code> can discover the AI manifest, the research manifest, the topology, the experiments and the evidence. Our own harness shows that much, using a client that receives nothing but the URL (<Link href="/verify#ingress">results</Link>).</p>
            <p>What no website can show is that every AI product will look. That remains <Link href="/verify#C-14">an open question</Link>, and this site says so.</p>
          </div>
          <div className="panel p-5">
            <p className="label mb-3">canonical prompt</p>
            <p className="font-serif text-[1.1rem] leading-relaxed">“{SITE.canonicalPrompt}”</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CopyButton text={SITE.canonicalPrompt} label="Copy prompt" />
              <Link href="/ai" className="arrow-link">Watch a client do it →</Link>
            </div>
          </div>
        </div>
      </Section>

      <section className="rule-t py-16" aria-label="Who">
        <div className="wrap grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <p className="lede measure">Eighteen years of shipping production software, then a different question: what if the interface itself were programmable? <span className="text-ink-3">(Career details are self-reported.)</span></p>
          <Link href="/about" className="arrow-link">Abed Kadaan →</Link>
        </div>
      </section>
    </>
  );
}
