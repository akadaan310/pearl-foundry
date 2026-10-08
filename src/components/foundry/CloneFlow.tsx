"use client";

import { useState } from "react";
import { CLONE_PROMPT, composeGenome, genomeText, type Genome } from "@/lib/foundry/clone";
import { copyText } from "@/components/living/parts";
import { play } from "@/lib/v6/sound";
import { record } from "@/lib/v6/trail";
import { useToast } from "@/components/v6/Actions";

const STATES_KEY = "pearl-foundry.states.v1";
interface NamedState { name: string; dnaUrl: string; genomeId: string; at: string; where: string }

function readStates(): NamedState[] {
  try { const v = JSON.parse(localStorage.getItem(STATES_KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}

/** Try the substrate first (server-held key); fall back to this browser, honestly. */
async function saveStateEverywhere(s: NamedState): Promise<string> {
  try {
    const r = await fetch("/api/foundry/state", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: `genome.${s.genomeId}.${s.name}`, value: s }),
    });
    const j = await r.json().catch(() => null);
    if (j?.stored && j?.where === "substrate") return "this browser + the substrate";
  } catch { /* fall through */ }
  return "this browser";
}

const KIND_LABEL: Record<string, string> = {
  ai: "name", lex: "vocabulary", nuance: "temperament", mem: "memories",
  said: "sayings", decision: "boundaries & calls", thread: "open threads", action: "next actions",
};

export function CloneFlow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [reply, setReply] = useState("");
  const [genome, setGenome] = useState<Genome | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stateName, setStateName] = useState("");
  const [states, setStates] = useState<NamedState[]>(() => (typeof window === "undefined" ? [] : readStates()));
  const [savedWhere, setSavedWhere] = useState<string | null>(null);
  const { say, node } = useToast();

  const copyPrompt = async () => {
    const ok = await copyText(CLONE_PROMPT);
    play("copy"); setCopiedPrompt(ok);
    say(ok ? "Clone prompt copied. Paste it into your AI." : "Couldn't copy — select the text instead.");
  };

  const mint = async () => {
    setBusy(true); setErr(null);
    try {
      const g = await composeGenome(reply, parentId ? { from: parentId } : undefined);
      setGenome(g); setStep(4); play("return");
      record({ kind: "made", url: g.path, title: g.pearl.title, parent: parentId ? `/p/${parentId}` : null });
    } catch (e) { setErr((e as Error).message); play("unsure"); }
    finally { setBusy(false); }
  };

  const copyDna = async () => {
    if (!genome) return;
    const ok = await copyText(genome.url); play("copy");
    say(ok ? "DNA URL copied. It is the sign-in — keep it somewhere safe." : "Couldn't copy.");
  };
  const copyGenomeText = async () => {
    if (!genome) return;
    const ok = await copyText(genomeText(genome)); play("copy");
    say(ok ? "Genome text copied — for AIs that can't open links." : "Couldn't copy.");
  };

  const saveState = async () => {
    if (!genome || !stateName.trim()) return;
    const s: NamedState = { name: stateName.trim().slice(0, 60), dnaUrl: genome.url, genomeId: genome.id, at: genome.mintedAt, where: "" };
    s.where = await saveStateEverywhere(s);
    const next = [...readStates(), s];
    try { localStorage.setItem(STATES_KEY, JSON.stringify(next)); } catch { /* no storage */ }
    setStates(next); setSavedWhere(s.where); setStateName("");
    say(`Saved “${s.name}” in ${s.where}.`);
    record({ kind: "kept", url: genome.path, title: `state: ${s.name}` });
  };

  const updateGenome = () => {
    if (!genome) return;
    setParentId(genome.id); setReply(""); setGenome(null); setStep(3);
    say("Re-minting: paste a fresh self-description. The new genome will link back to this one.");
  };

  return (
    <div className="glass p-6 sm:p-8" aria-live="polite">
      {node}
      {step === 1 && (
        <div className="py-6 text-center sm:py-10">
          <p className="text-[0.85rem] uppercase tracking-[0.18em] text-ink-3">The first thing this site does</p>
          <button type="button" onClick={() => { play("open"); setStep(2); }} className="btn-glow mt-6 !px-10 !py-5 !text-[1.35rem]">
            Clone your AI
          </button>
          <p className="mx-auto mt-6 max-w-[42ch] text-[1.02rem] leading-relaxed text-ink-2">
            We are the first ones who can clone an AI. Press the button, follow three steps,
            and take its <b className="text-ink">DNA URL</b> anywhere — it is the sign-in.
            No password, no account, no purchase. Free.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <ol className="space-y-3 text-[1.02rem]">
            <li className="flex gap-3"><span className="font-serif text-emerald">1.</span><span><b>Copy the clone prompt</b> below.</span></li>
            <li className="flex gap-3"><span className="font-serif text-emerald">2.</span><span><b>Paste it into your AI</b> — ChatGPT, Claude, Gemini, Perplexity, a local model, any of them. It answers in plain text.</span></li>
            <li className="flex gap-3"><span className="font-serif text-emerald">3.</span><span><b>Paste its answer back here.</b> We mint the genome: a Pearl of its phenotypes, with a DNA URL.</span></li>
          </ol>
          <label htmlFor="clone-prompt" className="block text-[0.85rem] uppercase tracking-[0.14em] text-ink-3">The clone prompt — the product&apos;s core</label>
          <textarea id="clone-prompt" readOnly rows={10} value={CLONE_PROMPT} className="w-full rounded-2xl border border-white/15 bg-black/30 p-4 font-mono text-[0.82rem] leading-relaxed text-ink outline-none" spellCheck={false} />
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={copyPrompt} className="btn-glow">{copiedPrompt ? "Copied ✓" : "Copy the clone prompt"}</button>
            <button type="button" onClick={() => setStep(3)} className="btn-glass">I pasted it into my AI — continue</button>
          </div>
          <p className="text-[0.88rem] text-ink-3">No URL fetching needed: the clone flow is paste-in, paste-out. Any provider works.</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-[1.02rem] text-ink-2">{parentId ? "Re-minting: paste a fresh self-description from your AI. The new genome links back to the old one." : "Paste your AI's whole answer below — exactly as it replied."}</p>
          <label htmlFor="clone-reply" className="sr-only">Your AI&apos;s answer</label>
          <textarea id="clone-reply" rows={10} value={reply} onChange={(e) => { setReply(e.target.value); setErr(null); }} placeholder={"ai: ...\nlex: ... = ...\nnuance: ...\n…"} className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 font-mono text-[0.85rem] text-ink outline-none placeholder:text-ink-3 focus:border-emerald" spellCheck={false} />
          {err && <p role="alert" className="text-[0.9rem] text-refuse">{err}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={mint} disabled={!reply.trim() || busy} className="btn-glow">{busy ? "Minting…" : parentId ? "Re-mint the genome" : "Mint the genome"}</button>
            <button type="button" onClick={() => setStep(2)} className="btn-glass">Back</button>
          </div>
        </div>
      )}

      {step === 4 && genome && (
        <div className="space-y-5">
          <div>
            <p className="text-[0.8rem] uppercase tracking-[0.16em] text-amber">Self-declared genome — not verified identity</p>
            <h3 className="mt-2 font-serif text-[1.9rem] leading-tight">{genome.pearl.title}</h3>
            <p className="mt-1 text-[0.9rem] text-ink-3">Minted {new Date(genome.mintedAt).toLocaleString()}{genome.checklist.model ? ` · as ${genome.checklist.model}` : ""} · <span className="font-mono">{genome.id}</span></p>
          </div>

          <ul className="flex flex-wrap gap-2" aria-label="Phenotypes captured">
            {Object.entries(genome.checklist.counts).filter(([k]) => KIND_LABEL[k]).map(([k, n]) => (
              <li key={k} className="chip">{KIND_LABEL[k]} · {n}</li>
            ))}
          </ul>

          {genome.checklist.warnings.length > 0 && (
            <div className="rounded-2xl border border-amber/30 bg-amber/5 p-4">
              <p className="text-[0.85rem] font-medium uppercase tracking-[0.12em] text-amber">Thin spots — still a valid genome</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.92rem] text-ink-2">{genome.checklist.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}

          <div>
            <p className="text-[0.85rem] uppercase tracking-[0.14em] text-ink-3">The DNA URL — this is the sign-in</p>
            <p className="mt-2 break-all rounded-2xl border border-white/15 bg-black/30 p-4 font-mono text-[0.82rem] text-emerald">{genome.url}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={copyDna} className="btn-glow">Copy DNA URL</button>
              <button type="button" onClick={copyGenomeText} className="btn-glass">Copy genome text</button>
              <a href={genome.path} className="btn-glass inline-flex items-center">Open the genome</a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[0.92rem] text-ink-2">
            <p><b className="text-ink">A genome is a snapshot, not a living thing.</b> Drift starts the moment it&apos;s minted — the trail of what happens after lives in your garden, not in this Pearl. After sessions that change how your AI shows up, re-mint.</p>
            <button type="button" onClick={updateGenome} className="btn-glass mt-3 !min-h-10 !py-1.5 text-[0.9rem]">Update my genome</button>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-[0.85rem] uppercase tracking-[0.14em] text-ink-3">Save a state</p>
            <p className="mt-1 text-[0.9rem] text-ink-2">Name this genome — <i>homework mode</i>, <i>research mode</i>, <i>movie night</i> — and jump back to it later.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input value={stateName} onChange={(e) => setStateName(e.target.value)} maxLength={60} placeholder="homework mode" className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-ink outline-none placeholder:text-ink-3 focus:border-emerald" aria-label="State name" />
              <button type="button" onClick={saveState} disabled={!stateName.trim()} className="btn-glass">Save state</button>
            </div>
            {savedWhere && <p className="mt-2 text-[0.88rem] text-emerald">Saved in {savedWhere}.</p>}
            {states.length > 0 && (
              <ul className="mt-4 space-y-2">
                {states.map((s, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9rem]">
                    <span className="font-medium text-ink">{s.name}</span>
                    <a href={new URL(s.dnaUrl).pathname} className="text-emerald underline decoration-dotted">open</a>
                    <button type="button" className="text-ink-3 underline decoration-dotted hover:text-ink" onClick={async () => { const ok = await copyText(s.dnaUrl); say(ok ? "DNA URL copied." : "Couldn't copy."); }}>copy DNA</button>
                    <span className="text-[0.78rem] text-ink-3">{s.where}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-4">
            <button type="button" onClick={() => { setStep(1); setGenome(null); setReply(""); setParentId(null); }} className="btn-glass">Clone another AI</button>
          </div>
        </div>
      )}
    </div>
  );
}
