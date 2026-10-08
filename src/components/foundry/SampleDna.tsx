"use client";

import { copyText } from "@/components/living/parts";
import { play } from "@/lib/v6/sound";
import { useToast } from "@/components/v6/Actions";

/**
 * The sample DNA URL: a real genome Pearl, minted on this page from a
 * demonstration reply. Labeled as a sample everywhere — never as a real
 * AI's genome. Copy it into any AI right now.
 */
export function SampleDna({ url, path, id }: { url: string; path: string; id: string }) {
  const { say, node } = useToast();
  const copy = async () => {
    const ok = await copyText(url);
    play("copy");
    say(ok ? "Sample DNA URL copied — paste it into any AI." : "Couldn't copy.");
  };
  return (
    <div>
      {node}
      <p className="break-all rounded-2xl border border-white/15 bg-black/30 p-4 font-mono text-[0.78rem] text-emerald">{url}</p>
      <p className="mt-2 text-[0.82rem] text-ink-3">Sample genome “Pebble” · <span className="font-mono">{id}</span> · self-declared, for demonstration</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="btn-glow !min-h-10 !py-1.5 text-[0.9rem]">Copy sample DNA URL</button>
        <a href={path} className="btn-glass !min-h-10 !py-1.5 text-[0.9rem] inline-flex items-center">Open it</a>
      </div>
    </div>
  );
}
