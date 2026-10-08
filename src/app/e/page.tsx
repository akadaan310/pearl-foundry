import type { Metadata } from "next";
import Link from "next/link";
import { PearlView } from "@/components/ExperienceView";
import { SubstrateLayer } from "@/components/Substrate";
import { HashRecovery } from "@/components/pearl/HashRecovery";
import { parseRequest } from "@/lib/experience-request";
import { pearlPage } from "@/lib/pearl/server";
import { livingPearl } from "@/lib/living/pearl";
import { LivingPearl } from "@/components/living/LivingPearl";
import { PearlWorld } from "@/components/living/PearlWorld";
import { PearlSubstrate } from "@/components/living/PearlSubstrate";
import { LIFE_EXAMPLE } from "@/content/compose";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { parsed } = await parseRequest(await searchParams);
  const t = parsed.errors.length ? "Pearl" : `${parsed.doc.title} · Pearl`;
  return {
    title: { absolute: t },
    description: `A Pearl composed as a URL by ${parsed.doc.by ?? "an AI"}, rendered by ${new URL(ORIGIN).host}. Not written or reviewed by Abed Kadaan.`,
    robots: { index: false, follow: false },
    openGraph: { title: t, description: `A Pearl composed by ${parsed.doc.by ?? "an AI"} · rendered from its URL alone` },
  };
}

export default async function ExperiencePage({ searchParams }: Props) {
  const { parsed } = await parseRequest(await searchParams);
  if (parsed.errors.length) {
    return (
      <section className="wrap py-24">
        <HashRecovery />
        <SubstrateLayer data={{ page: "/e", kind: "pearl", errors: parsed.errors, grammar: "/compose" }} />
        <p className="label mb-6">pearl · not rendered</p>
        <h1 className="title max-w-[20ch]">This link does not encode a Pearl yet.</h1>
        <ul className="mt-6 space-y-1 font-mono text-[0.85rem] text-refuse">{parsed.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        <p className="measure mt-8 text-ink-2">A Pearl lives entirely in its link: a title, then numbered blocks such as <code>b1=h:Heading</code> and <code>b2=p:Text</code>. The grammar is at <Link href="/compose">/compose</Link>. If an AI gave you this link, paste the whole message into <Link href="/#bring">Bring your Pearl</Link>; it can often recover what a browser cut off.</p>
        <p className="mt-4"><a href={LIFE_EXAMPLE.replace(ORIGIN, "")} className="arrow-link break-all">Open an example Pearl →</a></p>
      </section>
    );
  }
  const page = await pearlPage(parsed.doc, {});
  const record = livingPearl(page.pearl, { id: page.id, digest: page.digest, link: page.links.compact });
  return (
    <>
      <HashRecovery />
      <SubstrateLayer data={{ page: "/e", kind: "pearl", id: page.id, digest: "sha256:" + page.digest, pearl: page.pearl, warnings: parsed.warnings, links: page.links, living: record }} />
      <LivingPearl record={record} pearl={page.pearl} links={page.links} substrate={<PearlSubstrate pearl={page.pearl} record={record} links={page.links} />}>
        <PearlView {...page} source="rendered from the link itself" warnings={parsed.warnings} world={<PearlWorld related={record.related} title={page.pearl.title} id={page.id} />} />
      </LivingPearl>
    </>
  );
}
