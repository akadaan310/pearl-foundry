"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Affordance, Option } from "@/lib/living/record";

export interface Entry { a: Affordance; o?: Option; text: string }

const GROUPS: { id: Affordance["group"]; title: string }[] = [
  { id: "change", title: "Change it" },
  { id: "go", title: "Go" },
  { id: "understand", title: "Understand it" },
  { id: "make", title: "Make it yours" },
  { id: "carry", title: "Carry it" },
];

/** True when a key press belongs to a text field, not to the object. */
export function typing(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || !!t.closest("[role=dialog] input");
}

function entries(affs: Affordance[]): Entry[] {
  return affs.flatMap((a) => (a.options?.length && !a.href ? a.options.map((o) => ({ a, o, text: `${a.label} ${o.label} ${o.detail ?? ""}` })) : [{ a, text: `${a.label} ${a.does}` }, ...(a.options ?? []).filter((o) => o.href !== a.href).map((o) => ({ a, o, text: `${a.label} ${o.label}` }))]));
}

/**
 * The object's affordance map, as a palette. "/" opens it, "?" opens it with
 * the key list, Escape closes it. Single keys run commands directly when no
 * text field has focus. Only the commands in the object's living record exist.
 */
export function CommandPalette({ affordances, run, layer, setLayer, title }: {
  affordances: Affordance[];
  run: (a: Affordance, o?: Option) => void;
  layer?: string;
  setLayer?: (l: "surface" | "substrate" | "proof") => void;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const uid = useId();
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const all = useMemo(() => entries(affordances), [affordances]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? all.filter((e) => e.text.toLowerCase().includes(t)) : all;
  }, [all, q]);

  const show = useCallback((h = false) => { opener.current = document.activeElement as HTMLElement; setHelp(h); setQ(h ? "" : ""); setSel(0); setOpen(true); }, []);
  const close = useCallback(() => { setOpen(false); setTimeout(() => opener.current?.focus?.(), 0); }, []);
  const choose = useCallback((e: Entry) => { setOpen(false); run(e.a, e.o); }, [run]);

  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 0); }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
      if (open) return;
      if (e.key === "/") { e.preventDefault(); show(false); return; }
      if (e.key === "?") { e.preventDefault(); show(true); return; }
      if (setLayer && ["1", "2", "3"].includes(e.key)) { setLayer((["surface", "substrate", "proof"] as const)[Number(e.key) - 1]); return; }
      const a = affordances.find((x) => x.key && x.key === e.key);
      if (!a) return;
      e.preventDefault();
      if (a.href || !a.options?.length) run(a);
      else { opener.current = document.activeElement as HTMLElement; setHelp(false); setQ(a.label); setSel(0); setOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [affordances, open, run, show, setLayer]);

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(list.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setSel(0); }
    else if (e.key === "End") { e.preventDefault(); setSel(list.length - 1); }
    else if (e.key === "Enter" && list[sel]) { e.preventDefault(); choose(list[sel]); }
  };

  useEffect(() => { document.getElementById(`${uid}-opt-${sel}`)?.scrollIntoView({ block: "nearest" }); }, [sel, uid]);

  return (
    <>
      <button type="button" onClick={() => show(false)} className="palette-trigger" aria-haspopup="dialog" aria-keyshortcuts="/">
        <span>What can it do?</span><kbd>/</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-3 pt-[12vh] backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby={`${uid}-title`} className="palette w-full max-w-xl overflow-hidden" onKeyDown={onListKey}>
            <div className="border-b border-rule px-5 pb-3 pt-4">
              <p id={`${uid}-title`} className="eyebrow">What would you like to do? <span className="font-normal normal-case tracking-normal text-ink-3">· {title}</span></p>
              <label htmlFor={`${uid}-q`} className="sr-only">Filter commands</label>
              <input ref={input} id={`${uid}-q`} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Type a command…" autoComplete="off" spellCheck={false}
                role="combobox" aria-expanded="true" aria-controls={`${uid}-list`} aria-activedescendant={list[sel] ? `${uid}-opt-${sel}` : undefined}
                className="mt-2 w-full bg-transparent font-serif text-2xl outline-none placeholder:text-ink-3" />
            </div>
            <div id={`${uid}-list`} role="listbox" aria-label="Commands" className="max-h-[52vh] overflow-y-auto py-2">
              {list.length === 0 && <p className="px-5 py-3 text-ink-3">No command matches. This object only offers what it can actually do.</p>}
              {GROUPS.map((g) => {
                const items = list.map((e, i) => ({ e, i })).filter(({ e }) => e.a.group === g.id);
                if (!items.length) return null;
                return (
                  <div key={g.id} role="group" aria-labelledby={`${uid}-g-${g.id}`}>
                    <p id={`${uid}-g-${g.id}`} className="px-5 pb-1 pt-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-3">{g.title}</p>
                    {items.map(({ e, i }) => (
                      <div key={i} id={`${uid}-opt-${i}`} role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={() => choose(e)}
                        className={`mx-2 flex cursor-pointer items-baseline gap-3 rounded-lg px-3 py-2 ${i === sel ? "bg-emerald-deep text-ink" : "text-ink-2"}`}>
                        <span className="w-4 shrink-0 text-emerald" aria-hidden="true">{i === sel ? "›" : ""}</span>
                        <span className="min-w-0 flex-1">
                          <span className="font-mono text-[0.9rem] font-semibold tracking-wide text-ink">{e.a.label}</span>
                          {e.o && <>{" "}<span className="ml-1 font-mono text-[0.85rem]">{e.o.label}</span></>}
                          <span className="mt-0.5 block truncate text-[0.8rem] text-ink-3">{e.o?.detail ?? (help ? e.a.capability : e.a.does)}</span>
                        </span>
                        {e.a.key && !e.o && <kbd className="kbd">{e.a.key}</kbd>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-rule px-5 py-2.5 text-[0.75rem] text-ink-3">
              <span><kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> choose</span><span><kbd className="kbd">↵</kbd> run</span><span><kbd className="kbd">esc</kbd> close</span>
              {setLayer && <span><kbd className="kbd">1</kbd> <kbd className="kbd">2</kbd> <kbd className="kbd">3</kbd> surface · substrate · proof</span>}
              {layer && <span>now: {layer}</span>}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
