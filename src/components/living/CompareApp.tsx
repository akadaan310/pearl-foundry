"use client";

import { useEffect, useState } from "react";
import { resolvePearl } from "@/lib/pearl/resolve";
import { diffPearls, type PearlDiff } from "@/lib/living/diff";
import { useWorkspace } from "@/components/pearl/useWorkspace";
import { pearlUrl } from "@/lib/pearl/serialize";
import { ORIGIN } from "@/config/origin";

const abs = (v: string) => (v.trim().startsWith("/") ? ORIGIN + v.trim() : v.trim());

/** COMPARE: any two Pearls, side by side. Everything is computed in this browser; nothing is fetched. */
export function CompareApp() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [diff, setDiff] = useState<PearlDiff | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { ws } = useWorkspace();

  const run = async (x = a, y = b) => {
    setErr(null); setDiff(null);
    const [ra, rb] = await Promise.all([resolvePearl(abs(x)), resolvePearl(abs(y))]);
    if (!ra.pearl || !rb.pearl) { setErr(`${!ra.pearl ? "A" : "B"} is not a Pearl this site can read (${(!ra.pearl ? ra : rb).status}). Paste a /e?… or /p/… link.`); return; }
    setDiff(diffPearls(ra.pearl, rb.pearl));
  };
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const qa = q.get("a") ?? "", qb = q.get("b") ?? "";
    setA(qa); setB(qb);
    if (qa && qb) void run(qa, qb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement>) => { const r = ws.pearls.find((p) => p.id === e.target.value); if (r) set(pearlUrl(r.pearl)); };

  return (
    <div className="space-y-8">
      <form className="grid gap-5 lg:grid-cols-2" onSubmit={(e) => { e.preventDefault(); history.replaceState(null, "", `?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`); void run(); }}>
        {([["A", a, setA], ["B", b, setB]] as const).map(([k, v, set]) => (
          <div key={k} className="card p-5">
            <label htmlFor={`cmp-${k}`} className="font-serif text-xl">Pearl {k}</label>
            <textarea id={`cmp-${k}`} rows={3} className="field mt-2 !rounded-lg !font-mono !text-[0.75rem]" value={v} onChange={(e) => set(e.target.value)} placeholder="Paste a Pearl link (/e?… or /p/…)" spellCheck={false} />
            {ws.pearls.length > 0 && (
              <label className="mt-2 block text-[0.82rem] text-ink-3">or from My Pearls{" "}
                <select className="ml-1 rounded border border-rule bg-panel px-1 py-0.5 text-ink" defaultValue="" onChange={pick(set)}>
                  <option value="" disabled>choose…</option>
                  {ws.pearls.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            )}
          </div>
        ))}
        <div className="lg:col-span-2"><button type="submit" className="btn-solid">Compare</button></div>
      </form>
      {err && <p role="alert" className="text-refuse">{err}</p>}
      {diff && (
        <div className="space-y-8" aria-live="polite">
          <div className="card p-5">
            <p className="eyebrow">Relation</p>
            <p className="mt-2 font-serif text-2xl">{diff.identical ? "The same object." : diff.relation === "b is derived from a" ? "B is derived from A." : diff.relation === "a is derived from b" ? "A is derived from B." : diff.relation === "siblings (same parent)" ? "Siblings: both derive from the same parent." : "Two separate objects."}</p>
            <p className="mt-1 font-mono text-[0.78rem] text-ink-2">A {diff.a.id} · B {diff.b.id}</p>
            <p className="mt-2 text-[0.85rem] text-ink-2">{diff.counts.same} blocks shared · <span className="text-emerald">{diff.counts.added} added</span> · <span className="text-refuse">{diff.counts.removed} removed</span> · <span className="text-gold">{diff.counts.changed} changed</span></p>
            <p className="mt-2 text-[0.78rem] text-ink-3">Lineage comes from from=, which the composer asserts. It is not proof of authorship.</p>
          </div>
          {diff.meta.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Metadata</p>
              <table className="w-full text-left text-[0.88rem]"><thead><tr><th scope="col" className="py-1 font-medium">field</th><th scope="col" className="font-medium">A</th><th scope="col" className="font-medium">B</th></tr></thead>
                <tbody>{diff.meta.map((m) => <tr key={m.field} className="border-t border-rule"><td className="py-1.5 font-mono text-ink-3">{m.field}</td><td>{m.a ?? "—"}</td><td>{m.b ?? "—"}</td></tr>)}</tbody></table>
            </div>
          )}
          {diff.computations.length > 0 && (
            <div>
              <p className="eyebrow mb-2">Computation transitions</p>
              <ul className="space-y-2 font-mono text-[0.78rem]">
                {diff.computations.map((c, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    {c.a ? <a className="node" href={`/live${c.a}`}>{c.a}{c.xA !== null ? ` · x=${c.xA}` : ""}</a> : <span className="text-ink-3">none</span>}
                    <span className="text-emerald">→</span>
                    {c.b ? <a className="node" href={`/live${c.b}`}>{c.b}{c.xB !== null ? ` · x=${c.xB}` : ""}</a> : <span className="text-ink-3">none</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(diff.continuity.closed.length + diff.continuity.opened.length + diff.continuity.decisions_added.length + diff.continuity.actions_added.length) > 0 && (
            <div>
              <p className="eyebrow mb-2">Continuity transitions</p>
              <ul className="space-y-1 text-[0.92rem]">
                {diff.continuity.closed.map((t) => <li key={"c" + t}><span className="font-mono text-[0.75rem] text-ink-3">thread → close</span> {t}</li>)}
                {diff.continuity.opened.map((t) => <li key={"o" + t}><span className="font-mono text-[0.75rem] text-ink-3">new thread</span> {t}</li>)}
                {diff.continuity.decisions_added.map((t) => <li key={"d" + t}><span className="font-mono text-[0.75rem] text-ink-3">decided</span> {t}</li>)}
                {diff.continuity.actions_added.map((t) => <li key={"a" + t}><span className="font-mono text-[0.75rem] text-ink-3">next action</span> {t}</li>)}
              </ul>
            </div>
          )}
          <div>
            <p className="eyebrow mb-2">Blocks</p>
            <ol className="space-y-1 font-mono text-[0.74rem]">
              {diff.blocks.map((o, i) => (
                <li key={i} className={o.op === "same" ? "text-ink-3" : o.op === "added" ? "text-emerald" : o.op === "removed" ? "text-refuse" : "text-gold"}>
                  <span aria-hidden="true">{o.op === "same" ? "  " : o.op === "added" ? "+ " : o.op === "removed" ? "− " : "~ "}</span>
                  <span className="sr-only">{o.op}: </span>
                  {o.op === "changed" ? <>{o.from} <span className="text-ink-3">→</span> {o.to}</> : o.line}
                </li>
              ))}
            </ol>
          </div>
          <p className="font-mono text-[0.75rem]"><a href={`/api/v1/pearl/diff?a=${encodeURIComponent(a.replace(ORIGIN, ""))}&b=${encodeURIComponent(b.replace(ORIGIN, ""))}`}>The same comparison as JSON (pearl.diff) →</a></p>
        </div>
      )}
    </div>
  );
}
