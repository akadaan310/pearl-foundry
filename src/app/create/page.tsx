import type { Metadata } from "next";
import Link from "next/link";
import { EXPERIENCES } from "@/content/experiences";
import { TYPE_INFO } from "@/lib/pearl/model";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = {
  title: "Create",
  description: "Things you can make with Pearls: keep a conversation, organise research, a creative studio, recipes, study notes, a project handoff, workflows and computations.",
  alternates: { canonical: "/create" },
};

export default function Create() {
  return (
    <>
      <SubstrateLayer data={{ page: "/create", experiences: EXPERIENCES.map((e) => ({ id: e.id, name: e.name, type: e.type, action: e.action, research: e.research })) }} />
      <header className="paper-glow border-b border-rule">
        <div className="wrap act !pb-12">
          <p className="eyebrow mb-5">Create</p>
          <h1 className="keynote max-w-[14ch]">One language. Many useful things.</h1>
          <p className="mt-6 max-w-[40ch] text-[1.2rem] text-ink-2">Every experience below makes the same kind of object: a Pearl. Make it yourself in a form, or ask your AI to make it, then keep it and carry it anywhere.</p>
        </div>
      </header>
      <section className="wrap grid gap-5 py-14 sm:grid-cols-2 xl:grid-cols-4" aria-label="Experiences">
        {EXPERIENCES.map((e) => (
          <Link key={e.id} href={`/create/${e.id}`} className="card card-lift group flex flex-col overflow-hidden no-underline">
            <div className={`h-2 ${e.accent}`} aria-hidden="true" />
            <div className="flex flex-1 flex-col p-5">
              <p className="text-[0.85rem] font-medium text-emerald">{e.situation}</p>
              <h2 className="mt-2 font-serif text-2xl">{e.name}</h2>
              <p className="mt-2 flex-1 text-[0.95rem] text-ink-2">{e.pitch}</p>
              <p className="mt-4 text-[0.82rem] text-ink-3"><span className="simple-only">Start →</span><span className="explore-only font-mono">{TYPE_INFO[e.type].label} Pearl · {e.research}</span></p>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
