"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Auto } from "@/lib/v6/automata";
import { RULES } from "@/lib/v6/automata";
import { program } from "@/lib/v6/handoff";
import { ORIGIN, HOST } from "@/config/origin";
import { CopyPair, Opened } from "./Actions";

const hue = (rule: number) => (rule * 47) % 360;

export function Automaton({ a }: { a: Auto }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (a.kind !== "clock") return;
    const id = setInterval(() => setT((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [a.kind]);
  const n = a.n;
  const seedFlip = (b: number) => `/${a.kind}/${a.rule}/${n}/${(a.seed ^ (1 << b)) >>> 0}`;
  const nextRule = RULES[(RULES.indexOf(a.rule) + 1) % RULES.length] ?? RULES[0];
  const ai = program({
    url: ORIGIN + a.path,
    what: a.kind === "clock" ? `This is a strange clock: ${n} lights that tick by one rule (rule ${a.rule}), starting from pattern ${a.seed}.` : `This is a pattern loom: rule ${a.rule} weaving ${n} threads from seed ${a.seed}. Each row is the next moment.`,
    read: `${ORIGIN}/api/v1/living?u=/x${a.x} (the computation behind it).`,
    moves: `make it more ${a.kind === "clock" ? "interesting to watch" : "beautiful"}: choose a rule (0–255), a width (1–16) and a seed (below 2^width). The address is ${ORIGIN}/${a.kind}/{rule}/{width}/{seed}.`,
    ret: "the new URL on its own line, and one sentence on why you chose it.",
  });

  // clock: the state at tick t walks the orbit, wrapping into its cycle
  const idx = a.kind === "clock" && a.states.length ? (t < a.states.length ? t : a.tail! + ((t - a.tail!) % a.cycle!)) : 0;
  const now = a.states[idx] ?? 0;
  const S = Math.max(6, Math.min(22, Math.floor(560 / n)));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
      <Opened kind="opened" url={a.path} title={a.kind === "clock" ? "A strange clock" : "A pattern loom"} />
      <div className="glass flex justify-center overflow-hidden p-5">
        {a.kind === "clock" ? (
          <div className="text-center">
            <div className="flex justify-center gap-1.5" role="img" aria-label={`The clock now: ${now.toString(2).padStart(n, "0")}`}>
              {Array.from({ length: n }, (_, i) => { const on = (now >> (n - 1 - i)) & 1; return <span key={i} className="block h-10 w-6 rounded-full transition-colors duration-500 sm:h-14 sm:w-8" style={{ background: on ? `hsl(${hue(a.rule)} 80% 72%)` : "rgb(255 255 255 / 0.07)", boxShadow: on ? `0 0 24px hsl(${hue(a.rule)} 80% 60% / 0.6)` : "none" }} />; })}
            </div>
            <p className="mt-6 font-mono text-[0.85rem] text-ink-2" aria-live="off">tick {t} · {t < a.states.length ? "settling" : `in a cycle of ${a.cycle}`}</p>
            <p className="mt-1 text-[0.82rem] text-ink-3">It began with {a.tail} {a.tail === 1 ? "step" : "steps"} of settling, then repeats every {a.cycle} {a.cycle === 1 ? "tick" : "ticks"}.</p>
          </div>
        ) : (
          <svg viewBox={`0 0 ${n * S} ${a.states.length * S}`} className="h-auto w-full max-w-[34rem]" role="img" aria-label={`A woven pattern: ${a.states.length} rows of ${n} threads`}>
            {a.states.flatMap((v, row) => Array.from({ length: n }, (_, i) => ((v >> (n - 1 - i)) & 1 ? <rect key={`${row}-${i}`} x={i * S} y={row * S} width={S - 1} height={S - 1} rx={S / 3} fill={`hsl(${(hue(a.rule) + row * 4) % 360} 75% ${62 + (row % 6) * 2}%)`} /> : null)))}
          </svg>
        )}
      </div>
      <div className="space-y-6">
        <div>
          <p className="zone-title">{a.kind === "clock" ? "Strange · a clock" : "Make · a loom"}</p>
          <h1 className="mt-2 font-serif text-[clamp(2rem,4.5vw,3rem)] leading-tight">{a.kind === "clock" ? "A clock that keeps its own time." : "A loom that weaves from one rule."}</h1>
          <p className="mt-3 text-ink-2">{a.kind === "clock" ? `${n} lights. Every second each one looks at its neighbours and decides. It never needs a battery, and it will do exactly this forever.` : "One simple rule, applied row after row, makes the whole cloth. Change one thread at the start and watch everything below it change."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={seedFlip(Math.floor(n / 2))} className="btn-glow">Change something</Link>
          <Link href={`/${a.kind}/${nextRule}/${n}/${a.seed}`} className="btn-glass">Try another rule</Link>
        </div>
        <div className="flex flex-wrap gap-2"><CopyPair url={ORIGIN + a.path} program={ai} title={a.kind === "clock" ? "A strange clock" : "A pattern loom"} compact /></div>
        <p className="break-all font-mono text-[0.75rem] text-ink-3"><span className="text-ink-2">{HOST}</span>{a.path}</p>
        <details className="text-[0.85rem] text-ink-3"><summary className="cursor-pointer hover:text-ink">Inspect</summary>
          <p className="mt-2 font-mono text-[0.75rem]">This address is a friendly name for <a href={`/live${a.x}`}>{a.x}</a>: rule {a.rule}, {n} cells, seed {a.seed}, resolved by the same pure registry as every computation here. value sha256 {a.hash.slice(0, 24)}…</p>
        </details>
      </div>
    </div>
  );
}
