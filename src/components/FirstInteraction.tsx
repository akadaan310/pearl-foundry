"use client";

import { useEffect, useState } from "react";

interface Frame { user: string; surface: string; protocol: string; result: string }

/**
 * The first interaction. Nothing appears until the visitor acts. Then a small
 * strip shows the layer underneath the section they are looking at: what they
 * did, the address that resolves it, its machine representation, and where
 * that representation lives in /research.json.
 */
export function FirstInteraction() {
  const [frame, setFrame] = useState<Frame | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem("substrate-trace") === "closed") { setClosed(true); return; } } catch {}
    let started = false;
    let current: Element | null = null;
    let last = "arrived";

    const describe = (el: Element | null) => {
      if (!el) return;
      const d = (el as HTMLElement).dataset;
      setFrame({
        user: last,
        surface: d.address ?? location.pathname,
        protocol: d.substrate ?? "page",
        result: d.pointer ?? "/research.json",
      });
    };

    const begin = (what: string) => {
      last = what;
      if (!started) { started = true; describe(current ?? document.querySelector("[data-substrate]")); }
      else describe(current);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { current = e.target; if (started) describe(current); }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    document.querySelectorAll("section[data-substrate]").forEach((s) => io.observe(s));

    const onScroll = () => { if (window.scrollY > 160) begin("scrolled"); };
    const onKey = (e: KeyboardEvent) => begin(e.key === "Tab" ? "moved focus" : "pressed a key");
    const onPointer = () => begin("pointed");
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  if (closed || !frame) return null;

  const rows: [string, string, string][] = [
    ["USER", "asks", frame.user],
    ["SURFACE", "resolves", frame.surface],
    ["PROTOCOL", "transitions", frame.protocol],
    ["RESULT", "returns", frame.result],
  ];

  return (
    <aside
      aria-label="Substrate trace: the machine layer under the section in view"
      className="explore-only no-print motion-reveal fixed bottom-3 left-3 z-30 hidden max-w-[min(30rem,calc(100vw-1.5rem))] border border-rule-strong bg-ground/95 p-3 font-mono text-[0.7rem] leading-relaxed text-ink-2 shadow-[0_0_0_1px_#0c0d0c] sm:block"
    >
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <span className="text-ink-3">substrate layer · this page has a second representation</span>
        <button
          type="button"
          onClick={() => { setClosed(true); try { sessionStorage.setItem("substrate-trace", "closed"); } catch {} }}
          className="px-1 text-ink-3 hover:text-ink"
          aria-label="Close substrate trace"
        >
          ×
        </button>
      </div>
      <dl className="grid grid-cols-[5.5rem_5.5rem_1fr] gap-x-2">
        {rows.map(([k, v, x]) => (
          <div key={k} className="contents">
            <dt className="text-emerald">{k}</dt>
            <dd className="text-ink-3">→ {v}</dd>
            <dd className="truncate text-ink" title={x}>{x}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
