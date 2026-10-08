import type { Metadata } from "next";
import Link from "next/link";
import { PearlView } from "@/components/ExperienceView";
import { SubstrateLayer } from "@/components/Substrate";
import { LocalPearl } from "@/components/pearl/LocalPearl";
import { decodePortable, splitPortable } from "@/lib/pearl/portable";
import { parseExperience, parseQueryString } from "@/lib/experience";
import { RESEARCH_IDS } from "@/lib/experience-request";
import { pearlPage } from "@/lib/pearl/server";
import { livingPearl } from "@/lib/living/pearl";
import { LivingPearl } from "@/components/living/LivingPearl";
import { PearlWorld } from "@/components/living/PearlWorld";
import { PearlSubstrate } from "@/components/living/PearlSubstrate";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ ref: string }> };

export const metadata: Metadata = { title: { absolute: "Pearl" }, robots: { index: false, follow: false } };

function Problem({ title, detail, id }: { title: string; detail: string; id?: string }) {
  return (
    <section className="wrap py-24">
      <SubstrateLayer data={{ page: "/p", kind: "pearl", status: "unavailable", id: id ?? null, detail }} />
      <p className="label mb-6">pearl{id ? ` · ${id}` : ""} · <span className="text-refuse">unavailable</span></p>
      <h1 className="title max-w-[22ch]">{title}</h1>
      <p className="measure mt-6 text-ink-2">{detail}</p>
      <p className="mt-8"><Link href="/#bring" className="arrow-link">Bring a Pearl →</Link></p>
    </section>
  );
}

export default async function PortablePearl({ params }: Props) {
  const { ref } = await params;
  const parts = splitPortable(ref);
  if (!parts) return <Problem title="This is not a Pearl id." detail="Pearl links look like /p/p_ followed by sixteen characters, then a dot and the payload." />;
  if (!parts.token) {
    // An id alone names content; it does not carry it. This browser's library may still have it.
    return <LocalPearl id={parts.id} />;
  }
  let q: string;
  try { q = await decodePortable(parts.token); } catch (e) {
    return <Problem id={parts.id} title="This Pearl's payload cannot be read." detail={`${(e as Error).message}. The link may have been cut short or altered when it was copied.`} />;
  }
  const r = parseExperience(parseQueryString(q), RESEARCH_IDS, q.length);
  if (r.errors.length) return <Problem id={parts.id} title="This Pearl does not validate." detail={r.errors.join(" ")} />;
  const page = await pearlPage(r.doc, { verifiedId: true });
  if (page.id !== parts.id) return <Problem id={parts.id} title="This Pearl's content does not match its id." detail={`The payload hashes to ${page.id}, not ${parts.id}. The link is corrupted or was edited; nothing from it is shown.`} />;
  const record = livingPearl(page.pearl, { id: page.id, digest: page.digest, link: page.links.compact });
  return (
    <>
      <SubstrateLayer data={{ page: "/p", kind: "pearl", id: page.id, digest: "sha256:" + page.digest, pearl: page.pearl, links: page.links, integrity: "payload hashes to its id", living: record }} />
      <LivingPearl record={record} pearl={page.pearl} links={page.links} substrate={<PearlSubstrate pearl={page.pearl} record={record} links={page.links} />}>
        <PearlView {...page} source="from a portable link · payload hashes to its id" warnings={r.warnings} world={<PearlWorld related={record.related} title={page.pearl.title} id={page.id} />} />
      </LivingPearl>
    </>
  );
}
