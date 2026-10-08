"use client";

import { useState } from "react";
import { initial, issue, deliver, resend, setLink, phoneChange, classify, converged, hashOf, type World, type Party, type Tab } from "@/lib/goldenSync";

const PARTY: Record<Party, { name: string; glyph: string; seat: string }> = {
  abed: { name: "Abed", glyph: "A", seat: "pilot · phone · the only fingers" },
  r: { name: "ر", glyph: "ر", seat: "operator · relay & twin" },
  n: { name: "ن", glyph: "ن", seat: "counsel seat · via relay" },
};

const SITES = ["https://arxiv.org/", "https://github.com/akadaan310/purl", "https://en.wikipedia.org/wiki/Cellular_automaton", "https://example.org/notes"];

function Replica({ title, sub, tabs, active, rev, hash }: { title: string; sub: string; tabs: Tab[]; active: string | null; rev: string; hash: string }) {
  return (
    <div className="panel-raised min-w-0 p-4">
      <p className="label">{sub}</p>
      <p className="font-serif text-xl">{title}</p>
      <p className="mt-1 font-mono text-[0.72rem] text-ink-3">{rev} · structural hash {hash.slice(7, 19)}…</p>
      <ul className="mt-3 space-y-1.5">
        {tabs.map((t) => (
          <li key={t.id} className={`flex items-center gap-2 border px-2 py-1.5 font-mono text-[0.74rem] ${t.id === active ? "border-emerald/60" : "border-rule"}`}>
            <span className="grid h-5 w-5 shrink-0 place-items-center border border-rule-strong text-[0.7rem] text-ink" title={`owner: ${PARTY[t.owner].name}`} aria-label={`owner ${PARTY[t.owner].name}`}>{PARTY[t.owner].glyph}</span>
            <span className="text-ink-3">{t.id}</span>
            <span className="truncate text-ink-2">{t.url.replace(/^https?:\/\//, "")}</span>
          </li>
        ))}
        {!tabs.length && <li className="font-mono text-[0.74rem] text-ink-3">no tabs</li>}
      </ul>
    </div>
  );
}

/** Golden Surface's sync model, operable. See src/lib/goldenSync.ts for the rules. */
export function GoldenSyncModel() {
  const [w, setW] = useState<World>(initial);
  const [k, setK] = useState(2);
  const classes = classify(w);
  const ok = converged(w);
  const loud = classes.some((c) => c !== "op-in-flight");
  const pick = <T,>(xs: T[]) => xs[(k * 7) % xs.length];
  const rTab = [...w.T.tabs].reverse().find((t) => t.owner !== "abed");

  const act = (f: (w: World) => World) => { setW(f); setK((x) => x + 1); };

  return (
    <div className="panel">
      <div
        role="status"
        className={`flex flex-wrap items-center gap-3 border-b px-4 py-3 font-mono text-[0.78rem] ${loud ? "border-refuse/60 bg-[#2a1712] text-refuse" : ok ? "border-emerald/40 text-emerald" : "border-rule text-ink-2"}`}
      >
        <strong className="font-medium">{loud ? "OUT OF SYNC WITH THE TWIN" : ok ? "CONVERGED" : "CONVERGING"}</strong>
        <span>{classes.length ? classes.join(" · ") : "link up ∧ no pending ops ∧ hash(T) = hash(P)"}</span>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto_1fr]">
        <Replica title="P · phone" sub="replica: truth for what is displayed" tabs={w.P.tabs} active={w.P.active} rev={`ack ${w.P.ack} · phone_rev ${w.P.phoneRev}`} hash={hashOf(w.P)} />
        <div className="flex flex-col items-center justify-center gap-2 px-2 font-mono text-[0.72rem] text-ink-3" aria-label="Channel">
          <span>{w.link === "up" ? "websocket up" : "link down"}</span>
          <div className={`flex min-h-10 min-w-24 flex-row-reverse flex-wrap items-center justify-center gap-1 border px-2 py-1 lg:flex-col ${w.link === "up" ? "border-rule-strong" : "border-dashed border-refuse/60"}`}>
            {w.channel.length ? w.channel.map((m) => <span key={m.rev} className="motion-reveal border border-emerald/50 px-1.5 text-emerald">op {m.rev}</span>) : <span>∅</span>}
          </div>
          <span>← ops · state →</span>
        </div>
        <Replica title="T · twin" sub="replica: driven by ر and ن through the relay" tabs={w.T.tabs} active={w.T.active} rev={`twin_rev ${w.T.twinRev} · pending ${w.T.pending.filter((m) => m.rev > w.P.ack).map((m) => m.rev).join(",") || "∅"}`} hash={hashOf(w.T)} />
      </div>

      <div className="grid gap-4 border-t border-rule p-4 md:grid-cols-2">
        <fieldset>
          <legend className="label mb-2">Operations (POST /cmd at the twin)</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" onClick={() => act((x) => issue(x, { cmd: "newtab", tab: `t${x.seq + x.T.twinRev + 1}`, owner: pick<Party>(["r", "n"]), url: pick(SITES) }))}>newtab</button>
            <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" disabled={!rTab} onClick={() => rTab && act((x) => issue(x, { cmd: "open", tab: rTab.id, url: pick(SITES) }))}>open</button>
            <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" disabled={!rTab} onClick={() => rTab && act((x) => issue(x, { cmd: "closetab", tab: rTab.id }))}>closetab</button>
            <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" onClick={() => act((x) => phoneChange(x, { cmd: "newtab", tab: `p${x.P.phoneRev + 1}`, owner: "abed", url: pick(SITES) }))}>Abed opens a tab on the phone</button>
          </div>
        </fieldset>
        <fieldset>
          <legend className="label mb-2">Network and test hooks</legend>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary !min-h-9 !py-1 text-[0.8rem]" disabled={!w.channel.length || w.link === "down"} onClick={() => act(deliver)}>deliver next</button>
            <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" onClick={() => act((x) => ({ ...x, dropNext: true }))} disabled={w.dropNext}>{w.dropNext ? "next op will drop" : "desync: drop next op"}</button>
            <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" onClick={() => act((x) => setLink(x, x.link === "up" ? "down" : "up"))}>{w.link === "up" ? "take link down" : "reconnect"}</button>
            <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" onClick={() => act((x) => resend(x, "Resync (replay twin)"))} disabled={w.link === "down"}>Resync (replay)</button>
            <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" onClick={() => { setW(initial()); }}>reset</button>
          </div>
        </fieldset>
      </div>

      <ol className="max-h-56 overflow-y-auto border-t border-rule p-4 font-mono text-[0.72rem] leading-relaxed" aria-label="Event log">
        {[...w.log].reverse().map((l, i) => (
          <li key={w.log.length - i} className={i === 0 ? "text-ink" : "text-ink-3"}>
            <span className={l.kind === "nack" || l.kind === "desync" || l.kind === "sync.conflict" || l.kind === "link-down" ? "text-refuse" : "text-emerald"}>{l.kind.padEnd(13)}</span> {l.detail}
          </li>
        ))}
      </ol>
      <p className="border-t border-rule px-4 py-3 text-[0.8rem] text-ink-3">
        A model of the rules declared in <a href="https://github.com/akadaan310/golden-surface/blob/b11371878e8bda63b45848d42d41351fdaa273a8/docs/SYNC.md">docs/SYNC.md</a>, running in your browser. It does not connect to any relay or phone. Time thresholds (op-in-flight after 10 s, link-down after 30 s) are replaced by explicit steps. The class session-mirror-only, for sites that challenge sessions from a server, needs a real browser session and is not modelled.
      </p>
    </div>
  );
}
