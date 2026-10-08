import type { Metadata } from "next";
import Link from "next/link";
import { automaton } from "@/lib/v6/automata";
import { Automaton } from "@/components/v6/Automaton";
import { SubstrateLayer } from "@/components/Substrate";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ p?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try { const segs = (await params).p ?? []; const a = automaton("clock", segs); return { title: "A strange clock", alternates: { canonical: segs.length ? a.path : "/clock" } }; } catch { return { title: "clock", robots: { index: false } }; }
}

export default async function Page({ params }: Props) {
  let a;
  try { a = automaton("clock", (await params).p ?? []); } catch (e) {
    return (
      <section className="wrap py-24">
        <SubstrateLayer data={{ page: "/clock", error: (e as Error).message }} />
        <h1 className="font-serif text-[clamp(2rem,5vw,3.2rem)]">That one couldn&apos;t start.</h1>
        <p className="mt-3 text-ink-2">{(e as Error).message}. Rules go from 0 to 255, widths from 1 to 16, and the seed must fit the width.</p>
        <Link href="/clock" className="btn-glow mt-6">Start a fresh one</Link>
      </section>
    );
  }
  return (
    <>
      <SubstrateLayer data={{ page: a.path, computation: a.x, rule: a.rule, cells: a.n, seed: a.seed, value_sha256: a.hash, machine: "/x" + a.x }} />
      <section className="wrap py-10 sm:py-14"><Automaton a={a} /></section>
    </>
  );
}
