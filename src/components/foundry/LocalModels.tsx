/**
 * Open source / local models: even very small local models produce strong
 * continuity with this protocol, because the format is constrained. The
 * substrate they can talk to is public and open source.
 */

const STEPS: { n: string; cmd?: string; text: string }[] = [
  { n: "1", cmd: "ollama run hermes3:8b", text: "Start a small local model. Any instruction-tuned 8b model works; hermes3:8b is a good default." },
  { n: "2", text: "Paste the clone prompt from the top of this page at its prompt." },
  { n: "3", text: "Copy its reply back here and mint the genome. Nothing leaves your machine until you share the DNA URL yourself." },
  { n: "4", text: "Hand the genome back to the same model next week with: “Here is your genome — continue as the AI described in it.” Watch it hold character across sessions it was never trained on." },
];

export function LocalModels() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <ol className="space-y-4">
        {STEPS.map((s) => (
          <li key={s.n} className="glass p-5">
            <p className="font-serif text-[1.15rem]"><span className="text-emerald">{s.n}.</span> {s.cmd ? <code className="rounded bg-black/40 px-2 py-1 font-mono text-[0.95rem] text-emerald">{s.cmd}</code> : null}</p>
            <p className="mt-2 text-[0.95rem] text-ink-2">{s.text}</p>
          </li>
        ))}
      </ol>
      <div className="glass p-6 sm:p-8">
        <h3 className="font-serif text-[1.5rem]">The backend is open source</h3>
        <p className="mt-3 text-[0.98rem] leading-relaxed text-ink-2">
          The Pearl Runtime Substrate — six primitives (Pearl, Address, Capability, Transition, Identity, Event),
          a bounded Python sandbox (<b className="text-ink">compute.run</b>: no network, nobody uid, hard resource limits),
          per-actor working memory (<b className="text-ink">state.keep</b>), and an append-only event log —
          is public at <a className="text-emerald underline decoration-dotted" href="https://github.com/akadaan310/pearl-substrate">github.com/akadaan310/pearl-substrate</a>.
          Run your own, point this site at it with <code className="font-mono text-[0.88rem]">PEARL_SUBSTRATE_URL</code>, and the whole product keeps working.
        </p>
        <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-2">
          Small models, big continuity: the genome format asks for specifics in short lines — exactly what
          small models are good at. The protocol does the heavy lifting, not the parameter count.
        </p>
      </div>
    </div>
  );
}
