"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readTrail, type TrailEntry } from "@/lib/v6/trail";
import { makeHandoff } from "@/lib/v6/handoff";
import { copyText } from "@/components/living/parts";
import { play } from "@/lib/v6/sound";
import { record } from "@/lib/v6/trail";
import { useToast } from "./Actions";

/** "You were here": the place remembers this browser before it remembers a person. */
export function YouWereHere() {
  const [last, setLast] = useState<TrailEntry | null>(null);
  const [count, setCount] = useState(0);
  useEffect(() => { try { const t = readTrail(localStorage); setLast(t.at(-1) ?? null); setCount(new Set(t.map((x) => x.url)).size); } catch { /* no storage */ } }, []);
  if (!last) return null;
  return (
    <p className="glass motion-reveal inline-flex flex-wrap items-center gap-x-3 gap-y-1 !rounded-full px-5 py-2.5 text-[0.92rem]">
      <span className="text-ink">You were here.</span>
      <Link href={last.url} className="text-emerald underline decoration-dotted">Pick up “{last.title}”</Link>
      {count > 1 && <Link href="/garden" className="text-ink-3 hover:text-ink">{count} things in your garden</Link>}
    </p>
  );
}

const IDEAS = ["a little game where I keep a moon alive", "a study card for the planets", "a calm breathing exercise", "a riddle with three doors"];

/** WHAT SHOULD WE MAKE? The site has no model of its own: your AI makes it, and you bring it back. */
export function MakeBox() {
  const [wish, setWish] = useState("");
  const [copied, setCopied] = useState(false);
  const { say, node } = useToast();
  const go = async () => {
    const ok = await copyText(makeHandoff(wish));
    play("copy"); setCopied(ok);
    say(ok ? "Copied for your AI. Paste it there; bring back the link it makes." : "Couldn't copy.");
    if (ok) record({ kind: "gave", url: "/#make", title: `“${wish.trim().slice(0, 40)}”` });
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (wish.trim()) void go(); }} className="space-y-4">
      <label htmlFor="make-wish" className="block font-serif text-[clamp(1.8rem,4vw,2.6rem)] leading-tight">What should we make?</label>
      <div className="glass flex flex-col gap-2 !rounded-[2rem] p-2 sm:flex-row">
        <input id="make-wish" value={wish} onChange={(e) => { setWish(e.target.value); setCopied(false); }} maxLength={300} placeholder="A little game where I have to keep a moon alive" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[1.05rem] text-ink outline-none placeholder:text-ink-3" />
        <button type="submit" className="btn-glow" disabled={!wish.trim()}>Copy for my AI</button>
      </div>
      <div className="flex flex-wrap gap-2">{IDEAS.map((i) => <button key={i} type="button" className="chip hover:text-ink" onClick={() => setWish(i)}>{i}</button>)}</div>
      <p className="text-[0.88rem] text-ink-3">{copied ? "Now paste it into any AI. When it gives you a link, bring it back below." : "Your AI makes it, as a Pearl. This site doesn't have a model of its own; it gives the thing your AI makes a place to live."}</p>
      {node}
    </form>
  );
}
