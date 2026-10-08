"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { hashJson, type Json } from "@/lib/canonical";

const PRESETS = [
  { label: "one transition", address: "/map/eca/90/8/state/5/next" },
  { label: "a trace", address: "/map/eca/30/16/state/256/trace/24" },
  { label: "perturb, then step", address: "/map/eca/90/8/state/5/flip/0/next" },
  { label: "an orbit", address: "/map/eca/110/12/state/1/orbit" },
];

interface Doc {
  kind: string;
  address: string;
  value: Record<string, Json>;
  identity: { value_sha256: string };
  derivation: { address: string; operation: string; kind: string }[];
  epistemic_status: string[];
  error?: { status: number; code: string; message: string };
}

function Cells({ bits, size = 10 }: { bits: string; size?: number }) {
  return (
    <svg width={bits.length * size} height={size} className="block" aria-hidden="true">
      {[...bits].map((b, i) => (
        <rect key={i} x={i * size + 0.5} y={0.5} width={size - 1} height={size - 1} className={b === "1" ? "fill-emerald" : "fill-transparent stroke-rule-strong"} />
      ))}
    </svg>
  );
}

function Spacetime({ states, n }: { states: number[]; n: number }) {
  const s = Math.max(4, Math.min(10, Math.floor(360 / n)));
  return (
    <svg width={n * s} height={states.length * s} className="block max-w-full" role="img" aria-label={`Space-time diagram: ${states.length} states of ${n} cells, time downward`}>
      {states.map((x, t) =>
        Array.from({ length: n }, (_, i) => {
          const bit = (x >> (n - 1 - i)) & 1;
          return bit ? <rect key={`${t}-${i}`} x={i * s} y={t * s} width={s - 0.5} height={s - 0.5} className="fill-emerald" /> : null;
        }),
      )}
    </svg>
  );
}

export function AddressConsole({ initial = PRESETS[0].address, origin = "" }: { initial?: string; origin?: string }) {
  const [input, setInput] = useState(initial);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [local, setLocal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fieldId = useId();

  const run = useCallback(async (address: string) => {
    setBusy(true); setErr(null);
    try {
      const a = address.startsWith("/") ? address : "/" + address;
      const res = await fetch(`/x${a}`, { headers: { Accept: "application/json" } });
      const d = (await res.json()) as Doc;
      setStatus(res.status);
      setDoc(d);
      setLocal(d.value ? hashJson(d.value as Json) : null);
    } catch {
      setErr("The resolver could not be reached.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void run(initial); }, [initial, run]);

  const v = doc?.value;
  const n = (v?.n_bits as number) ?? (doc?.address ? Number(doc.address.split("/")[4]) : 0);
  const stages: { k: string; body: React.ReactNode }[] = doc && !doc.error ? [
    { k: "Address", body: <code className="break-all text-ink">{origin}/x{doc.address}</code> },
    { k: "Program", body: <ol className="space-y-0.5">{doc.derivation.map((s, i) => <li key={i}><span className="text-ink-3">{String(i + 1).padStart(2, "0")}</span> {s.operation.replace("substrate.", "")} <span className="text-ink-3">→ {s.kind}</span></li>)}</ol> },
    {
      k: "State",
      body: typeof v?.x === "number"
        ? <div className="space-y-1.5"><Cells bits={v.bits_msb_first as string} /><div>x = {v.x as number} · {v.bits_msb_first as string}</div></div>
        : <div>x₀ = {v?.x0 as number} · {(v?.states as number[])?.length} states</div>,
    },
    {
      k: "Transition",
      body: v?.transition
        ? <div>{(v.transition as Record<string, number>).src} → {(v.transition as Record<string, number>).dst} <span className="text-ink-3">(Δ xor {(v.transition as Record<string, number>).delta_xor})</span></div>
        : Array.isArray(v?.states)
          ? <div className="space-y-2"><Spacetime states={v!.states as number[]} n={n} />{"tail_length" in (v ?? {}) && <div>tail {v!.tail_length as number} · cycle {v!.cycle_length as number}</div>}</div>
          : v?.intervention ? <div className="text-gold">flip: SIMULATED intervention on a model</div> : <div className="text-ink-3">no transition at this address</div>,
    },
    {
      k: "Result",
      body: (
        <div className="space-y-1 break-all">
          <div><span className="text-ink-3">server  </span>{doc.identity.value_sha256}</div>
          <div><span className="text-ink-3">browser </span>{local}</div>
          <div className={local === doc.identity.value_sha256 ? "text-emerald" : "text-refuse"}>
            {local === doc.identity.value_sha256 ? "✓ identical, recomputed in your browser" : "✗ mismatch"}
          </div>
        </div>
      ),
    },
  ] : [];

  return (
    <div className="panel">
      <form
        className="flex flex-col gap-2 border-b border-rule p-4 sm:flex-row"
        onSubmit={(e) => { e.preventDefault(); void run(input.trim()); }}
      >
        <label htmlFor={fieldId} className="sr-only">Computational address</label>
        <span className="hidden self-center font-mono text-[0.8rem] text-ink-3 sm:block">/x</span>
        <input id={fieldId} className="field" value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoComplete="off" inputMode="url" />
        <button type="submit" className="btn btn-primary shrink-0" disabled={busy}>{busy ? "Resolving…" : "Resolve"}</button>
      </form>
      <div className="flex flex-wrap gap-2 border-b border-rule px-4 py-3">
        {PRESETS.map((p) => (
          <button key={p.address} type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" onClick={() => { setInput(p.address); void run(p.address); }}>
            {p.label}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="p-4">
        {err && <p className="text-refuse">{err}</p>}
        {doc?.error && (
          <p className="font-mono text-[0.85rem] text-refuse">
            HTTP {status} · {doc.error.code}: {doc.error.message}
            <span className="mt-1 block text-ink-3">Refusals are part of the protocol: the address is well-formed or not, within limits or not, and the reason is stated.</span>
          </p>
        )}
        {stages.length > 0 && (
          <ol className="grid gap-px bg-rule font-mono text-[0.78rem] text-ink-2 lg:grid-cols-5">
            {stages.map((s, i) => (
              <li key={`${doc?.address}-${s.k}`} className="motion-reveal bg-panel p-3" style={{ animationDelay: `${i * 90}ms` }}>
                <p className="label mb-2 !text-emerald">{String(i + 1).padStart(2, "0")} {s.k}</p>
                {s.body}
              </li>
            ))}
          </ol>
        )}
        {doc && !doc.error && (
          <p className="mt-3 text-[0.8rem] text-ink-3">
            Epistemic status: {doc.epistemic_status.join(" · ")}. Open <a href={`/x${doc.address}`}>/x{doc.address}</a> directly; a browser gets HTML, and <code>Accept: application/json</code> gets the same document as JSON.
          </p>
        )}
      </div>
    </div>
  );
}
