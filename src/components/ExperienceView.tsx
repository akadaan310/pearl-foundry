import { TYPE_INFO, type Pearl } from "@/lib/pearl/model";
import { PearlActions } from "@/components/PearlActions";
import { PEARL_STATES, type PearlState } from "@/lib/pearl/states";
import Link from "next/link";
import type { Block } from "@/lib/experience";
import { resolve, AddressError } from "@/lib/address";
import { NODES } from "@/content/research";
import { TierMark } from "@/components/Status";
import { CopyButton } from "@/components/CopyPrompt";
import { StatusBadge } from "@/components/Status";
import type { EvidenceStatus } from "@/content/types";

const CLAIM_STATUS: Record<string, EvidenceStatus> = { observed: "OBSERVED", implemented: "IMPLEMENTED", tested: "TESTED", reproduced: "REPRODUCED", proposed: "PROPOSED", hypothesis: "HYPOTHESIS", open: "OPEN" };

function Spacetime({ states, n }: { states: number[]; n: number }) {
  const s = Math.max(4, Math.min(12, Math.floor(480 / n)));
  return (
    <svg width={n * s} height={states.length * s} viewBox={`0 0 ${n * s} ${states.length * s}`} className="block h-auto max-w-full" role="img" aria-label={`Space-time diagram: ${states.length} states of ${n} cells, time downward`}>
      {states.flatMap((x, t) => Array.from({ length: n }, (_, i) => ((x >> (n - 1 - i)) & 1 ? <rect key={`${t}-${i}`} x={i * s} y={t * s} width={s - 0.6} height={s - 0.6} className="fill-emerald" /> : null)))}
    </svg>
  );
}

function Computation({ address }: { address: string }) {
  try {
    const r = resolve(address);
    const v = r.value as Record<string, unknown>;
    const n = (v.n_bits as number) ?? Number(address.split("/")[4]);
    const states = Array.isArray(v.states) ? (v.states as number[]) : typeof v.x === "number" ? [v.x as number] : [];
    return (
      <figure className="panel my-8 p-5">
        <p className="label mb-4 !text-emerald">live computation · resolved by this site</p>
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          {states.length > 0 && <Spacetime states={states} n={n} />}
          <div className="min-w-0 font-mono text-[0.78rem] text-ink-2">
            <p className="break-all text-ink"><a href={`/x${r.address}`}>/x{r.address}</a></p>
            <p className="mt-3">{r.derivation.map((d) => d.operation.replace("substrate.", "")).join(" → ")}</p>
            {"transition" in v && <p className="mt-2">{(v.transition as { src: number; dst: number }).src} → {(v.transition as { src: number; dst: number }).dst}</p>}
            {"tail_length" in v && <p className="mt-2">tail {v.tail_length as number} · cycle {v.cycle_length as number}</p>}
            <p className="mt-3 break-all text-ink-3">value_sha256 {r.identity.value_sha256}</p>
          </div>
        </div>
        <figcaption className="mt-4 flex flex-wrap items-baseline justify-between gap-3 text-[0.8rem] text-ink-3">
          <span>The composer wrote the address; this site computed the result. Anyone can recompute it: the same value comes from substrateIO&apos;s reference resolver.</span>
          <a href={`/live${r.address}`} className="cmd !min-h-9 !text-[0.75rem]">TURN IT · NEXT, PERTURB, TRACE →</a>
        </figcaption>
      </figure>
    );
  } catch (e) {
    const msg = e instanceof AddressError ? `${e.status} ${e.code}: ${e.message}` : "could not resolve";
    return <p className="my-6 border-l border-refuse/60 pl-4 font-mono text-[0.8rem] text-refuse">computation refused · /x{address} · {msg}</p>;
  }
}

function ResearchCard({ id }: { id: string }) {
  const n = NODES.find((x) => x.id === id)!;
  return (
    <aside className="my-8 border border-rule-strong p-5">
      <p className="label">from this site&apos;s research record · {n.kind}</p>
      <p className="mt-2 font-serif text-2xl"><Link href={`/research/${n.id}`} className="no-underline hover:text-emerald">{n.name}</Link></p>
      <p className="mt-2 text-ink-2">{n.line}</p>
      <div className="mt-4 grid gap-4 text-[0.85rem] text-ink-2 md:grid-cols-3">
        <div><TierMark tier="demonstrated" /><p className="mt-1">{n.demonstrated[0]}</p></div>
        <div><TierMark tier="proposed" /><p className="mt-1">{n.proposed[0]}</p></div>
        <div><TierMark tier="open" /><p className="mt-1">{n.open[0]}</p></div>
      </div>
    </aside>
  );
}

export function BlockView({ b, i }: { b: Block; i: number }) {
  switch (b.type) {
    case "h": return <h2 className="title mb-5 mt-14 first:mt-0">{b.text}</h2>;
    case "p": return <p className="my-5 text-[1.08rem] leading-relaxed text-ink-2">{b.text}</p>;
    case "note": return <p className="my-6 border-l-2 border-gold/70 bg-gold-deep/20 px-5 py-4 text-ink">{b.text}</p>;
    case "quote": return <blockquote className="my-10 border-l border-rule-strong pl-6"><p className="lede">“{b.text}”</p>{b.cite && <footer className="mt-3 font-mono text-[0.75rem] text-ink-3">— {b.cite}</footer>}</blockquote>;
    case "list": return <ul className="my-6 space-y-2 text-ink-2">{b.items.map((x, k) => <li key={k} className="border-l border-rule pl-4">{x}</li>)}</ul>;
    case "steps": return <ol className="my-6 space-y-3">{b.items.map((x, k) => <li key={k} className="grid grid-cols-[2.5rem_1fr] text-ink-2"><span className="coord pt-1">{String(k + 1).padStart(2, "0")}</span>{x}</li>)}</ol>;
    case "facts": return <dl className="my-6 divide-y divide-rule border-y border-rule">{b.items.map((f, k) => <div key={k} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]"><dt className="font-serif text-ink">{f.k}</dt><dd className="text-ink-2">{f.v}</dd></div>)}</dl>;
    case "table": {
      const [head, ...rows] = b.rows;
      return (
        <div className="my-8 overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full border-collapse text-left text-[0.9rem]">
            <thead><tr>{head.map((c, k) => <th key={k} scope="col" className="label rule-b py-2 pr-4 font-normal">{c}</th>)}</tr></thead>
            <tbody>{rows.map((r, k) => <tr key={k} className="rule-b">{r.map((c, j) => <td key={j} className={`py-3 pr-4 ${j === 0 ? "font-serif text-ink" : "text-ink-2"}`}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    }
    case "flow":
      return (
        <ol className="my-8 grid gap-px border border-rule bg-rule" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(8rem, 1fr))` }}>
          {b.items.map((x, k) => (
            <li key={k} className="motion-reveal bg-ground p-4" style={{ animationDelay: `${k * 110}ms` }}>
              <p className="coord">{String(k).padStart(2, "0")}</p>
              <p className="mt-1 font-serif text-lg">{x}{k < b.items.length - 1 && <span aria-hidden="true" className="ml-2 font-mono text-emerald">→</span>}</p>
            </li>
          ))}
        </ol>
      );
    case "code": return <pre tabIndex={0} className="machine machine-wrap my-6">{b.text}</pre>;
    case "c": return null;
    case "prompt":
      return (
        <figure className="my-6 border border-rule-strong">
          <figcaption className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2"><span className="label">prompt · copy it into any AI</span><CopyButton text={b.text} label="Copy prompt" /></figcaption>
          <pre tabIndex={0} className="machine machine-wrap !border-0 !text-[0.85rem] !text-ink">{b.text}</pre>
        </figure>
      );
    case "claim":
      return (
        <p className="my-4 grid gap-2 sm:grid-cols-[9.5rem_1fr]">
          <span><StatusBadge status={CLAIM_STATUS[b.status]} /></span>
          <span className="text-ink-2">{b.text} <span className="font-mono text-[0.68rem] text-ink-3">status asserted by the composer</span></span>
        </p>
      );
    case "choice":
      return (
        <figure className="my-8 rounded-2xl border border-gold/50 bg-gold-deep/30 p-5">
          <figcaption className="font-serif text-xl">{b.prompt}</figcaption>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label={b.prompt}>
            {b.options.map((o, k) => <li key={k}><a href={o.href.replace(/^\/x(?=\/)/, "/live")} className="cmd">{o.label} <span aria-hidden="true">→</span></a></li>)}
          </ul>
          <p className="mt-3 text-[0.75rem] text-ink-3">Each choice leads to another addressed object. Choosing never changes this Pearl.</p>
        </figure>
      );
    case "pearl":
      return (
        <p className="my-3 flex items-baseline gap-3 border-l border-gold/60 pl-4">
          <span aria-hidden="true" className="text-gold">◉</span>
          <a href={b.href.replace(/^\/x(?=\/)/, "/live")} className="font-serif text-lg">{b.label}</a>
          <span className="truncate font-mono text-[0.68rem] text-ink-3">{b.href.slice(0, 60)}</span>
        </p>
      );
    case "x": return <Computation address={b.address} />;
    case "research": return <ResearchCard id={b.id} />;
    case "link":
      return (
        <p className="my-5">
          <a href={b.href} rel="nofollow noopener noreferrer ugc" className="arrow-link">{b.label} ↗</a>
          <span className="ml-3 font-mono text-[0.72rem] text-ink-3">leaves this site · {b.host}</span>
        </p>
      );
  }
  void i;
  return null;
}

// ------------------------------------------------------------------ the Pearl view


type C = Extract<Block, { type: "c" }>;

export function PearlState({ s }: { s: PearlState }) {
  const st = PEARL_STATES[s];
  return (
    <span title={st.means} className={`inline-flex items-center gap-1.5 border px-1.5 py-0.5 font-mono text-[0.66rem] uppercase tracking-[0.1em] ${st.tone}`}>
      <span aria-hidden="true">{st.glyph}</span>{s}
    </span>
  );
}

/** The header every Pearl wears: what it is, its id, and what is and is not established about it. */
export function PearlHeader({ pearl, id, digest, states, source }: { pearl: Pearl; id: string; digest: string; states: PearlState[]; source: string }) {
  const info = TYPE_INFO[pearl.type];
  return (
    <div className="explore-only border-b border-gold/40 bg-raised">
      <div className="wrap flex flex-wrap items-center gap-x-5 gap-y-2 py-3 font-mono text-[0.72rem] text-ink-2">
        <span className="flex items-center gap-2 text-gold"><PearlGlyph /> PEARL · {info.label.toUpperCase()}</span>
        <span className="text-ink" title={`sha256:${digest}`}>{id}</span>
        {states.map((s) => <PearlState key={s} s={s} />)}
        <span className="text-ink-3">{source}</span>
        <span className="text-ink-3">composed by {pearl.by ?? "an unnamed composer"} (asserted) · not written or reviewed by Abed Kadaan</span>
      </div>
    </div>
  );
}

export function PearlGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="inline-block">
      <circle cx="8" cy="8" r="6.4" className="fill-none stroke-gold" strokeWidth="1.1" />
      <circle cx="6.2" cy="6" r="1.7" className="fill-ink" opacity="0.85" />
      <path d="M2.6 9.5 A6 6 0 0 0 13.4 9.5" className="fill-none stroke-gold" strokeWidth="0.7" opacity="0.6" />
    </svg>
  );
}

const SECTIONS: { key: string; title: string; kinds: C["kind"][] }[] = [
  { key: "context", title: "Context", kinds: ["ai", "human", "nuance", "mem", "said"] },
  { key: "vocabulary", title: "Vocabulary", kinds: ["nick", "lex"] },
  { key: "decisions", title: "Decisions", kinds: ["decision"] },
  { key: "threads", title: "Open threads", kinds: ["thread", "close"] },
  { key: "actions", title: "Next actions", kinds: ["action"] },
];
const KIND_LABEL: Record<string, string> = { ai: "AI is called", human: "Person is called", nuance: "Nuance", mem: "Memory", said: "Talked about", nick: "Nickname", lex: "Word", decision: "Decided", thread: "Open", close: "Closed", action: "Next" };

/** Continuity entries, organised for the next session. Everything here is what the composer asserted. */
export function ContinuityView({ pearl }: { pearl: Pearl }) {
  const cs = pearl.blocks.filter((b): b is C => b.type === "c");
  if (!cs.length) return null;
  const closed = new Set(cs.filter((c) => c.kind === "close").map((c) => c.text.toLowerCase()));
  return (
    <section aria-labelledby="cont-h" className="rule-t">
      <div className="wrap py-14">
        <p className="label mb-2">continuity · what the composing session wrote down for the next one</p>
        <h2 id="cont-h" className="title mb-8">What another AI needs to continue.</h2>
        <div className="grid gap-px border border-rule bg-rule md:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map((sec) => {
            const items = cs.filter((c) => sec.kinds.includes(c.kind) && !(c.kind === "thread" && closed.has(c.text.toLowerCase())));
            return (
              <section key={sec.key} aria-label={sec.title} className="bg-ground p-5">
                <h3 className="label mb-3">{sec.title}</h3>
                {items.length === 0 ? <p className="text-[0.85rem] text-ink-3">none written</p> : (
                  <ul className="space-y-2.5 text-[0.92rem]">
                    {items.map((c, i) => (
                      <li key={i} className="text-ink-2">
                        <span className="mr-2 font-mono text-[0.66rem] uppercase tracking-[0.08em] text-ink-3">{KIND_LABEL[c.kind]}</span>
                        {c.key ? <><span className="font-serif text-[1.05rem] text-ink">{c.key}</span>{c.text && <> — {c.text}</>}</> : c.text}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
          <section aria-label="Provenance" className="bg-ground p-5">
            <h3 className="label mb-3">Provenance</h3>
            <dl className="space-y-1.5 text-[0.88rem] text-ink-2">
              <div><dt className="inline text-ink-3">composed by </dt><dd className="inline">{pearl.by ?? "unnamed"} <span className="text-ink-3">(asserted)</span></dd></div>
              <div><dt className="inline text-ink-3">session </dt><dd className="inline font-mono text-[0.8rem]">{pearl.session ?? "unnamed"}</dd></div>
              {pearl.for && <div><dt className="inline text-ink-3">for </dt><dd className="inline">{pearl.for}</dd></div>}
              <div className="pt-2 text-[0.8rem] text-ink-3">These are the composer&apos;s statements. They are not verified, and they are not the model&apos;s memory: a Pearl carries only what was written into it.</div>
            </dl>
          </section>
        </div>
      </div>
    </section>
  );
}

/** A full Pearl page: header, title, content, continuity, research/work, actions. */
export function PearlView({ pearl, id, digest, states, source, links, warnings, notes, world }: {
  pearl: Pearl; id: string; digest: string; states: PearlState[]; source: string;
  links: { e: string; portable: string; compact: string }; warnings: string[]; notes?: string[]; world?: React.ReactNode;
}) {
  const display = pearl.blocks.filter((b) => b.type !== "c");
  return (
    <article>
      <PearlHeader pearl={pearl} id={id} digest={digest} states={states} source={source} />
      <header className="grid-paper border-b border-rule">
        <div className="wrap pb-12 pt-14 sm:pt-20">
          {pearl.for && <p className="label mb-6">for {pearl.for}</p>}
          <h1 className="display max-w-[16ch] !text-[clamp(2.4rem,6vw,5rem)]">{pearl.title}</h1>
          <p className="mt-6 max-w-[44rem] text-ink-2">{TYPE_INFO[pearl.type].does}{TYPE_INFO[pearl.type].support === "descriptive" ? " This type is descriptive on this site." : ""}</p>
        </div>
      </header>

      {pearl.blocks.length === 0 && (
        <section className="wrap py-12">
          <div className="card max-w-2xl p-6">
            <p className="font-serif text-2xl">This Pearl has a name and nothing else, yet.</p>
            <p className="mt-2 text-ink-2">It is valid, but there is nothing to experience. REMIX it (press <kbd className="kbd">r</kbd>) to add parts: words, a computation you can turn, choices that lead somewhere, other Pearls. Or ask the AI that made it to compose the parts.</p>
          </div>
        </section>
      )}

      {world}

      <PearlActions pearl={pearl} id={id} digest={digest} links={links} />

      <ContinuityView pearl={pearl} />

      {display.length > 0 && (
        <section aria-label={pearl.blocks.some((b) => b.type === "c") ? "Research and work" : "Content"} className="rule-t">
          <div className="wrap max-w-[48rem] py-14">
            {pearl.blocks.some((b) => b.type === "c") && <p className="label mb-6">research / work · the page the composer wrote</p>}
            {display.map((b, i) => <BlockView key={i} b={b} i={i} />)}
          </div>
        </section>
      )}

      <footer className="rule-t">
        <div className="wrap grid gap-10 py-14 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="label mb-3">How this page was made</p>
            <p className="text-ink-2">An AI composed this Pearl as a link to this site. This site parsed the link, rendered it, and resolved any computations. It stores nothing. The page is exactly what the link encodes.</p>
            <p className="mt-4 flex flex-wrap gap-5">
              <a href={`/compose?${links.e.split("?")[1] ?? ""}`} className="arrow-link">Edit or remix →</a>
              <a href={links.e.replace("/e?", "/e.json?")} className="arrow-link">This Pearl as JSON →</a>
              <Link href="/" className="arrow-link">Bring another Pearl →</Link>
            </p>
          </div>
          <details className="substrate">
            <summary>the canonical document · sha256:{digest.slice(0, 16)}…</summary>
            {[...(notes ?? []), ...warnings].length > 0 && <ul className="mt-2 space-y-1 font-mono text-[0.72rem] text-gold">{[...(notes ?? []), ...warnings].map((w, k) => <li key={k}>⚠ {w}</li>)}</ul>}
            <pre tabIndex={0} className="machine mt-2 max-h-80 text-[0.72rem]">{JSON.stringify(pearl, null, 1)}</pre>
          </details>
        </div>
      </footer>
    </article>
  );
}
