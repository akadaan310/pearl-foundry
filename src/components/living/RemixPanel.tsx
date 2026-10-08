"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { parseExperience } from "@/lib/experience";
import { RESEARCH_IDS } from "@/lib/pearl/resolve";
import { blockToLine } from "@/lib/pearl/serialize";
import { toPearl, pearlId, type Pearl } from "@/lib/pearl/model";
import { forkPearl } from "@/lib/living/pearl";
import { diffPearls } from "@/lib/living/diff";

/**
 * REMIX: ORIGINAL · REMIX · DIFF. The remix is written in the Pearl grammar,
 * one block per line, parsed by the same parser as every Pearl. Making it
 * produces a new Pearl with from= naming the original; the original is never edited.
 */
export function RemixPanel({ pearl, id, close, make }: { pearl: Pearl; id: string; close: () => void; make: (p: Pearl) => void }) {
  const uid = useId();
  const [title, setTitle] = useState(pearl.title);
  const [text, setText] = useState(pearl.blocks.map(blockToLine).join("\n"));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector("input")?.focus(); }, []);

  const result = useMemo(() => {
    const q = new URLSearchParams({ title, type: pearl.type, by: "a person, on Pearls" });
    text.split("\n").filter((l) => l.trim()).forEach((l, i) => q.append(`b${i + 1}`, l));
    const r = parseExperience(q, new Set(RESEARCH_IDS), q.toString().length);
    if (r.errors.length) return { errors: r.errors, warnings: r.warnings };
    const base = toPearl(r.doc);
    const next = forkPearl(pearl, id, { title: base.title, blocks: base.blocks }, { session: `remix-${id.slice(2, 8)}` });
    return { pearl: next, id: pearlId(next), diff: diffPearls(pearl, next), warnings: r.warnings, errors: [] as string[] };
  }, [title, text, pearl, id]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/30 px-3 py-8 backdrop-blur-[2px]" onKeyDown={(e) => { if (e.key === "Escape") close(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={`${uid}-h`} className="palette mx-auto max-w-6xl p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id={`${uid}-h`} className="font-serif text-3xl">Remix “{pearl.title}”</h2>
          <button type="button" className="btn-soft !min-h-9 !py-1" onClick={close}>Close</button>
        </div>
        <p className="mt-1 text-[0.9rem] text-ink-2">Change the composition. The original stays exactly as it is; the remix is a new Pearl that names {id} as its parent.</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <section aria-label="Original">
            <p className="eyebrow mb-2">Original · {id}</p>
            <ol className="machine machine-wrap max-h-[50vh] overflow-y-auto !text-[0.72rem]">{pearl.blocks.map((b, i) => <li key={i}>{blockToLine(b)}</li>)}</ol>
          </section>
          <section aria-label="Remix">
            <p className="eyebrow mb-2">Remix · one block per line</p>
            <label htmlFor={`${uid}-t`} className="text-[0.85rem] font-medium">Title</label>
            <input id={`${uid}-t`} className="field mt-1 !rounded-lg !font-sans" value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} />
            <label htmlFor={`${uid}-b`} className="mt-3 block text-[0.85rem] font-medium">Blocks</label>
            <textarea id={`${uid}-b`} className="field mt-1 min-h-64 !rounded-lg !font-mono !text-[0.75rem]" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
            <p className="mt-1 text-[0.75rem] text-ink-3">kind:text — h, p, note, list, steps, x, choice, pearl, prompt, claim, thread, close, decision, action… (<a href="/compose" target="_blank">grammar</a>)</p>
          </section>
          <section aria-label="Diff" aria-live="polite">
            <p className="eyebrow mb-2">Diff</p>
            {result.errors.length > 0 ? <ul className="text-[0.85rem] text-refuse">{result.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : "diff" in result && result.diff ? (
              <>
                <p className="text-[0.85rem] text-ink-2">{result.diff.counts.same} same · <span className="text-emerald">{result.diff.counts.added} added</span> · <span className="text-refuse">{result.diff.counts.removed} removed</span> · <span className="text-gold">{result.diff.counts.changed} changed</span></p>
                <ol className="mt-2 max-h-[40vh] space-y-1 overflow-y-auto font-mono text-[0.7rem]">
                  {result.diff.blocks.filter((o) => o.op !== "same").map((o, i) => (
                    <li key={i} className={o.op === "added" ? "text-emerald" : o.op === "removed" ? "text-refuse line-through" : "text-gold"}>
                      {o.op === "changed" ? <>~ {o.from} <br />→ {o.to}</> : `${o.op === "added" ? "+" : "−"} ${o.line}`}
                    </li>
                  ))}
                  {result.diff.meta.filter((m) => m.field === "title").map((m) => <li key="t" className="text-gold">~ title: {m.a} → {m.b}</li>)}
                </ol>
                {result.warnings.length > 0 && <ul className="mt-2 text-[0.75rem] text-gold">{result.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul>}
                <p className="mt-3 font-mono text-[0.75rem] text-ink-3">new id {result.id} · from={id}</p>
                <button type="button" className="btn-solid mt-4" onClick={() => make(result.pearl!)}>Make the remix</button>
              </>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
