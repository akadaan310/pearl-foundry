import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXPERIENCES, experience } from "@/content/experiences";
import { ExperienceBuilder } from "@/components/pearl/ExperienceBuilder";
import { SubstrateLayer } from "@/components/Substrate";

export function generateStaticParams() { return EXPERIENCES.map((e) => ({ id: e.id })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const e = experience((await params).id);
  return e ? { title: e.name, description: e.pitch, alternates: { canonical: `/create/${e.id}` } } : {};
}

export default async function CreateOne({ params }: { params: Promise<{ id: string }> }) {
  const e = experience((await params).id);
  if (!e) notFound();
  return (
    <>
      <SubstrateLayer data={{ page: `/create/${e.id}`, experience: { id: e.id, name: e.name, type: e.type, action: e.action, research: e.research, fields: e.fields, prompt: e.prompt } }} />
      <header className="paper-glow border-b border-rule">
        <div className="wrap pb-10 pt-12 sm:pt-16">
          <nav aria-label="Breadcrumb" className="mb-6 text-[0.9rem] text-ink-3"><Link href="/create">Create</Link> / {e.name}</nav>
          <p className="eyebrow mb-3">{e.situation}</p>
          <h1 className="keynote !text-[clamp(2.4rem,6vw,4.6rem)]">{e.name}</h1>
          <p className="mt-4 max-w-[46ch] text-[1.1rem] text-ink-2">{e.pitch}</p>
          <dl className="explore-only mt-6 grid max-w-3xl gap-x-6 gap-y-1 text-[0.85rem] sm:grid-cols-[9rem_1fr]">
            <dt className="text-ink-3">Product action</dt><dd>{e.action}</dd>
            <dt className="text-ink-3">Research concept</dt><dd>{e.research}</dd>
          </dl>
        </div>
      </header>
      <div className="wrap py-10"><ExperienceBuilder def={e} /></div>
    </>
  );
}
