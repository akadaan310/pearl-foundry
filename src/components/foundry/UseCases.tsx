"use client";

import { EVERYDAY, type EverydayCase } from "@/lib/foundry/usecases";
import { copyText } from "@/components/living/parts";
import { play } from "@/lib/v6/sound";
import { useToast } from "@/components/v6/Actions";

function CaseCard({ c }: { c: EverydayCase }) {
  const { say, node } = useToast();
  const go = async () => {
    const ok = await copyText(c.prompt);
    play("copy");
    say(ok ? "Prompt copied — paste it into your AI." : "Couldn't copy. Select the text instead.");
  };
  return (
    <li className="glass flex h-full flex-col p-6">
      <h3 className="font-serif text-[1.45rem] leading-tight">{c.title}</h3>
      <p className="mt-1.5 text-[0.95rem] text-ink-2">{c.line}</p>
      <p className="mt-4 text-[0.88rem] text-ink-3"><b className="font-medium text-ink-2">The DNA URL carries:</b> {c.carries}</p>
      <div className="mt-auto pt-5">
        <button type="button" onClick={go} className="btn-glass !min-h-10 !py-1.5 text-[0.9rem]">Try this prompt</button>
      </div>
      {node}
    </li>
  );
}

/** Five concrete, simple cards. Each copies a ready-made prompt for the person's AI. */
export function EverydayCases() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {EVERYDAY.map((c) => <CaseCard key={c.id} c={c} />)}
    </ul>
  );
}
