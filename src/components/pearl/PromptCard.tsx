import type { LabPrompt } from "@/content/prompts";
import { CopyButton } from "@/components/CopyPrompt";
import { TYPE_INFO } from "@/lib/pearl/model";
import type { PearlTypeName } from "@/lib/experience";

/** A prompt is an artifact: its purpose, the exact text, what comes back, and how to check it. */
export function PromptCard({ p, open = false }: { p: LabPrompt; open?: boolean }) {
  const info = TYPE_INFO[p.type as PearlTypeName];
  return (
    <article id={`prompt-${p.id}`} className="flex scroll-mt-20 flex-col border border-rule bg-panel" aria-labelledby={`prompt-${p.id}-h`}>
      <div className="flex-1 p-5">
        <p className="coord">{String(p.n).padStart(2, "0")} · {info ? info.label : p.type} Pearl</p>
        <h3 id={`prompt-${p.id}-h`} className="mt-2 font-serif text-xl">{p.title}</h3>
        <p className="mt-2 text-[0.9rem] text-ink-2">{p.explain}</p>
        <p className="mt-3 text-[0.8rem] text-ink-3"><span className="text-ink-2">Returns:</span> {p.output}</p>
        <details className="mt-3" open={open}>
          <summary className="text-[0.82rem] text-ink-3 hover:text-ink">Show the full prompt</summary>
          <pre tabIndex={0} className="machine machine-wrap mt-2 max-h-72 !text-[0.72rem]">{p.prompt}</pre>
        </details>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-rule px-5 py-3">
        <CopyButton text={p.prompt} label="Copy prompt" />
        <a href={p.verify} className="arrow-link text-[0.82rem]">{p.verify.startsWith("/#bring") ? "Bring back the result →" : "Verify it →"}</a>
      </div>
    </article>
  );
}
