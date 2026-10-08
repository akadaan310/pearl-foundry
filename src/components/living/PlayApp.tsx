"use client";

import { useId, useState } from "react";
import { initialMachine, legal, step, VERBS, type Machine, type Verb, type Result } from "@/lib/living/sevenVerbs";
import { initialSurface, legalMoves, perform, status, control, PARTIES, SURFACE_VERBS, type Surface } from "@/lib/living/surface";
import type { Party } from "@/lib/goldenSync";
import { ORIGIN } from "@/config/origin";

const PHASES = ["IDLE", "BOUND", "WRITING", "COMMITTED", "BUILT"] as const;
const WRITES = ["h:A note from this address", "p:Rule 90 is Sierpiński's rule.", "choice:Where next?|Step>/x/map/eca/90/8/state/5/next|Perturb>/x/map/eca/90/8/state/5/flip/2", "link:http://not-allowed.example|an insecure link (BUILD will fail)"];

export function SevenVerbs() {
  const uid = useId();
  const [m, setM] = useState<Machine>(initialMachine);
  const [sid, setSid] = useState("s1");
  const [last, setLast] = useState<(Result & { verb: Verb; arg: string }) | null>(null);
  const [write, setWrite] = useState("");
  const [talk, setTalk] = useState("");
  const [bit, setBit] = useState("0");
  const s = m.sessions.find((x) => x.id === sid)!;
  const moves = legal(m, sid);
  const go = (verb: Verb, arg = "") => { const r = step(m, sid, verb, arg); setM(r.machine); setLast({ ...r, verb, arg }); };

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Session" className="layer-tabs">
        {m.sessions.map((x) => <button key={x.id} type="button" role="tab" aria-selected={x.id === sid} className={x.id === sid ? "is-on" : ""} onClick={() => setSid(x.id)}>{x.name} · {x.phase}</button>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="card p-5">
          <p className="eyebrow">Current state</p>
          <ol className="mt-3 flex flex-wrap items-center gap-1.5 font-mono text-[0.72rem]" aria-label="url-machine phases">
            {PHASES.map((p, i) => (
              <li key={p} className="flex items-center gap-1.5">
                <span className={`node ${s.phase === p || (p === "BUILT" && s.phase === "FAILED") ? "!border-emerald !bg-emerald-deep" : ""}`} aria-current={s.phase === p ? "step" : undefined}>{p === "BUILT" && s.phase === "FAILED" ? "FAILED" : p}</span>
                {i < PHASES.length - 1 && <span aria-hidden="true" className="text-ink-3">→</span>}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-[0.9rem] text-ink-2">Address: {s.url ? <a className="font-mono text-[0.8rem]" href={`/live${s.url}`}>{s.url}</a> : <span className="text-ink-3">none: a session knows nothing until START</span>}</p>
          {s.draft.length > 0 && <div className="mt-3"><p className="text-[0.8rem] text-ink-3">draft{s.committed ? ` · committed as ${s.committed.id}` : ""}</p><ol className="machine machine-wrap mt-1 !text-[0.7rem]">{s.draft.map((l, i) => <li key={i}>{l}</li>)}</ol></div>}
          {s.built && <p className="mt-3 text-[0.9rem]">BUILT → <a href={s.built.link.replace(ORIGIN, "")}>open the Pearl {s.built.id}</a></p>}
          {s.errors.length > 0 && <ul className="mt-3 text-[0.82rem] text-refuse">{s.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
          {s.inbox.length > 0 && <div className="mt-3"><p className="text-[0.8rem] text-ink-3">inbox (via the harness)</p><ul className="text-[0.88rem]">{s.inbox.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
        </div>
        <div className="card p-5">
          <p className="eyebrow">Legal moves from {s.phase}</p>
          <p className="mt-1 text-[0.8rem] text-ink-3">The grammar has seven verbs: {VERBS.join(" · ")}. Only the legal ones are offered.</p>
          <div className="mt-4 space-y-3">
            {moves.includes("START") && <button type="button" className="cmd" onClick={() => go("START")}>START /map/eca/90/8/state/5</button>}
            {moves.includes("SWITCH") && <button type="button" className="cmd" onClick={() => go("SWITCH")}>SWITCH → …/next</button>}
            {moves.includes("WRITE") && (
              <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); go("WRITE", write); setWrite(""); }}>
                <label htmlFor={`${uid}-w`} className="sr-only">A typed block to write</label>
                <input id={`${uid}-w`} list={`${uid}-wl`} className="field !w-auto min-w-0 flex-1 !rounded-full !font-mono !text-[0.78rem]" value={write} onChange={(e) => setWrite(e.target.value)} placeholder={`x:${s.url ?? ""}`} />
                <datalist id={`${uid}-wl`}>{WRITES.map((w) => <option key={w} value={w} />)}</datalist>
                <button type="submit" className="cmd">WRITE</button>
              </form>
            )}
            {moves.includes("COMMIT") && <button type="button" className="cmd" onClick={() => go("COMMIT")}>COMMIT the draft</button>}
            {moves.includes("BUILD") && <button type="button" className="cmd" onClick={() => go("BUILD")}>BUILD</button>}
            {moves.includes("PERTURB") && (
              <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); go("PERTURB", bit); }}>
                <label htmlFor={`${uid}-b`} className="text-[0.85rem]">bit</label>
                <select id={`${uid}-b`} className="rounded border border-rule bg-panel px-2 py-1" value={bit} onChange={(e) => setBit(e.target.value)}>{Array.from({ length: 8 }, (_, i) => <option key={i}>{i}</option>)}</select>
                <button type="submit" className="cmd">PERTURB</button>
              </form>
            )}
            {moves.includes("TALK") && (
              <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); go("TALK", talk); setTalk(""); }}>
                <label htmlFor={`${uid}-t`} className="sr-only">Message</label>
                <input id={`${uid}-t`} className="field !w-auto min-w-0 flex-1 !rounded-full !font-sans" value={talk} onChange={(e) => setTalk(e.target.value)} placeholder={`to ${m.sessions.find((x) => x.id !== sid)!.name}`} />
                <button type="submit" className="cmd">TALK</button>
              </form>
            )}
          </div>
        </div>
      </div>
      {last && (
        <div className="card p-5" aria-live="polite">
          <ol className="pipeline" aria-label="current state → legal move → result → next address">
            <li className="pipeline-step"><span className="eyebrow">state</span><span className="mt-1 block font-mono text-[0.8rem]">{last.before}</span></li>
            <li className="pipeline-step"><span className="eyebrow">move</span><span className="mt-1 block font-mono text-[0.8rem]">{last.verb}{last.arg ? ` ${last.arg.slice(0, 40)}` : ""}</span></li>
            <li className="pipeline-step"><span className="eyebrow">result</span><span className={`mt-1 block text-[0.82rem] ${last.refused ? "text-refuse" : ""}`}>{last.refused ?? last.result}</span></li>
            <li className="pipeline-step"><span className="eyebrow">next address</span><span className="mt-1 block break-all font-mono text-[0.75rem]">{last.next ? <a href={`/live${last.next}`}>{last.next}</a> : "—"} · {last.after}</span></li>
          </ol>
        </div>
      )}
      {m.log.length > 0 && (
        <details className="substrate" open>
          <summary>the harness log · every move is an envelope {"{from, to, op, url, payload, idstamp}"}</summary>
          <ol className="mt-2 max-h-56 space-y-0.5 overflow-y-auto font-mono text-[0.7rem]">{m.log.slice().reverse().map((e) => <li key={e.idstamp} className="break-all">{e.idstamp} {e.from}→{e.to} {e.op} {e.url ?? "—"} “{e.payload.slice(0, 60)}”</li>)}</ol>
        </details>
      )}
    </div>
  );
}

export function SharedSurface() {
  const uid = useId();
  const [s, setS] = useState<Surface>(initialSurface);
  const [actor, setActor] = useState<Party>("abed");
  const [note, setNote] = useState("");
  const st = status(s);
  const moves = legalMoves(s, actor);
  const act = (verb: typeof SURFACE_VERBS[number], tab: string | null) => setS((x) => perform(x, actor, verb, tab, note));
  const tabsOf = (side: "T" | "P") => s.world[side].tabs;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" aria-label="Participant" className="layer-tabs">
          {PARTIES.map((p) => <button key={p.id} type="button" role="radio" aria-checked={actor === p.id} className={actor === p.id ? "is-on" : ""} onClick={() => setActor(p.id)}>{p.name}</button>)}
        </div>
        <p className="text-[0.85rem] text-ink-3">{PARTIES.find((p) => p.id === actor)!.role}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-5">
          <p className="eyebrow">The surface · two copies that must converge</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {(["P", "T"] as const).map((side) => (
              <div key={side}>
                <p className="text-[0.8rem] font-medium">{side === "P" ? "phone (P) · the pilot's" : "twin (T) · on the server"}</p>
                <ul className="mt-2 space-y-1.5">
                  {tabsOf(side).map((t) => (
                    <li key={t.id} className={`rounded-lg border px-2.5 py-1.5 text-[0.78rem] ${s.world[side].active === t.id ? "border-emerald" : "border-rule"}`}>
                      <span className="font-mono">{t.id}</span> · owner <b className="font-medium">{PARTIES.find((p) => p.id === t.owner)?.name}</b>
                      <span className="block break-all font-mono text-[0.68rem] text-ink-3">{t.url.replace(ORIGIN, "")}</span>
                      {side === "P" && (s.notes[t.id] ?? []).map((n, i) => <span key={i} className="block text-[0.72rem] text-ink-2">✎ {PARTIES.find((p) => p.id === n.by)?.name}: {n.text}</span>)}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 break-all font-mono text-[0.65rem] text-ink-3">hash {(side === "P" ? st.phone : st.twin).slice(0, 18)}…</p>
              </div>
            ))}
          </div>
          <p className={`mt-4 font-mono text-[0.8rem] ${st.converged ? "text-emerald" : "text-refuse"}`} role="status">{st.converged ? "CONVERGED · hash(T) = hash(P), nothing pending" : `NOT CONVERGED · ${st.divergence.join(", ")} · ${st.pending} pending`}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[0.8rem]">
            <button type="button" className="cmd" onClick={() => setS((x) => control(x, "drop"))}>drop the next op</button>
            <button type="button" className="cmd" onClick={() => setS((x) => control(x, x.world.link === "up" ? "down" : "up"))}>link {s.world.link === "up" ? "down" : "up"}</button>
            <button type="button" className="cmd" onClick={() => setS((x) => control(x, "resync"))}>resync (replay)</button>
          </div>
        </div>
        <div className="card p-5">
          <p className="eyebrow">What {PARTIES.find((p) => p.id === actor)!.name} may do</p>
          <p className="mt-1 text-[0.8rem] text-ink-3">Operations outside this participant&apos;s authority are not offered. Vocabulary: {SURFACE_VERBS.join(" · ")}.</p>
          <label htmlFor={`${uid}-n`} className="mt-3 block text-[0.82rem]">Text for <span className="font-mono">type</span> (a note; never a credential)</label>
          <input id={`${uid}-n`} className="field mt-1 !rounded-full !font-sans" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Looks like a cycle of length 2" />
          <ul className="mt-3 flex flex-wrap gap-2">{moves.map((m) => <li key={m.verb + (m.tab ?? "")}><button type="button" className="cmd" onClick={() => act(m.verb, m.tab)}>{m.label}</button></li>)}</ul>
        </div>
      </div>
      {s.log.length > 0 && (
        <ol className="space-y-1 font-mono text-[0.72rem]" aria-label="Surface log">
          {s.log.slice().reverse().slice(0, 12).map((e, i) => <li key={i} className={e.allowed ? "text-ink-2" : "text-refuse"}>{PARTIES.find((p) => p.id === e.actor)!.name} · {e.verb}{e.tab ? ` ${e.tab}` : ""} · {e.allowed ? "allowed" : "REFUSED"} · {e.output}</li>)}
        </ol>
      )}
    </div>
  );
}
