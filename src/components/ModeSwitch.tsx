"use client";

import { useEffect, useState } from "react";

type Mode = "simple" | "explore";

/** Simple | Explore: the same Pearls, presented in everyday language or with the protocol showing. */
export function ModeSwitch() {
  const [mode, setMode] = useState<Mode>("simple");
  useEffect(() => {
    setMode(document.documentElement.dataset.mode === "explore" ? "explore" : "simple");
  }, []);
  const set = (m: Mode) => {
    setMode(m);
    document.documentElement.dataset.mode = m;
    try { localStorage.setItem("pearls.mode", m); } catch { /* the choice just won't persist */ }
  };
  return (
    <div role="radiogroup" aria-label="Presentation mode" className="inline-flex rounded-full border border-rule-strong p-0.5 text-[0.82rem]">
      {(["simple", "explore"] as Mode[]).map((m) => (
        <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => set(m)}
          title={m === "simple" ? "Everyday language" : "Show types, ids, blocks, digests and capabilities"}
          className={`rounded-full px-3 py-1 capitalize transition-colors ${mode === m ? "bg-ink text-ground" : "text-ink-2 hover:text-ink"}`}>
          {m}
        </button>
      ))}
    </div>
  );
}

/** Runs before first paint so Explore readers don't see Simple flash first. */
export const MODE_BOOT = `try{if(localStorage.getItem("pearls.mode")==="explore")document.documentElement.dataset.mode="explore"}catch(e){}`;
