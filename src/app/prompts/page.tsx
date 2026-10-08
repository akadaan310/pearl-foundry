import type { Metadata } from "next";
import Link from "next/link";
import { PROMPTS } from "@/content/prompts";
import { PromptCard } from "@/components/pearl/PromptCard";
import { SubstrateLayer } from "@/components/Substrate";
import { LIFE_EXAMPLE } from "@/content/compose";
import { ORIGIN } from "@/config/origin";

export const metadata: Metadata = {
  title: "Prompt Laboratory",
  description: "Copy-and-paste prompts that make any AI compose a Pearl: a continuity checkpoint, a project handoff, a research note, a workflow, a computation, or a report on this site.",
  alternates: { canonical: "/prompts" },
};

export default function Prompts() {
  return (
    <>
      <SubstrateLayer data={{ page: "/prompts", prompts: PROMPTS.map((p) => ({ id: p.id, title: p.title, type: p.type, output: p.output, prompt: p.prompt })) }} />
      <header className="grid-paper border-b border-rule" data-substrate="prompt → ai → pearl → bring it back" data-address="/prompts" data-pointer="/prompts#prompt-first-pearl">
        <div className="wrap pb-12 pt-14 sm:pt-20">
          <p className="label mb-8">§ prompt laboratory</p>
          <h1 className="title max-w-[20ch] !text-[clamp(2.2rem,5vw,4rem)]">Prompts that come back as Pearls.</h1>
          <p className="lede measure mt-6 text-ink-2">Copy a prompt and paste it into any AI. It names its goal, what the AI should look at, what it may do, and the exact link it should return. Then bring the link back here.</p>
          <p className="measure mt-4 text-[0.9rem] text-ink-3">The prompts are an interface, not control over the AI. Different assistants follow them differently, and some cannot open links at all. Whatever comes back, <Link href="/#bring">Bring your Pearl</Link> will tell you what it actually contains.</p>
        </div>
      </header>
      <section className="wrap grid gap-4 py-12 md:grid-cols-2 xl:grid-cols-3" aria-label="Prompts">
        {PROMPTS.map((p) => <PromptCard key={p.id} p={p} />)}
      </section>
      <section className="wrap py-10" aria-labelledby="ex-h">
        <h2 id="ex-h" className="label mb-3">What a returned Pearl looks like</h2>
        <pre tabIndex={0} className="machine machine-wrap !text-[0.72rem]">{LIFE_EXAMPLE}</pre>
        <p className="mt-3 text-[0.88rem] text-ink-2"><a href={LIFE_EXAMPLE.replace(ORIGIN, "")} className="arrow-link">Open this example →</a> <Link href="/compose" className="arrow-link ml-4">The full grammar →</Link></p>
      </section>
    </>
  );
}
