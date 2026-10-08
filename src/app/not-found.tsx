import Link from "next/link";
import { SubstrateLayer } from "@/components/Substrate";

export default function NotFound() {
  return (
    <section className="wrap py-24" data-substrate="address → unresolved" data-address="404" data-pointer="/research.json">
      <SubstrateLayer data={{ status: 404, kind: "unresolved-address", try: ["/", "/research", "/research.json", "/.well-known/ai", "/x"] }} />
      <p className="label mb-6">HTTP 404 · unresolved address</p>
      <h1 className="title max-w-[18ch]">This address does not resolve.</h1>
      <p className="measure mt-6 text-ink-2">Not computed is not the same as does-not-exist, but here it is both: nothing is published at this path. These do resolve:</p>
      <ul className="mt-8 space-y-2 font-mono text-[0.9rem]">
        <li><Link href="/">/</Link> <span className="text-ink-3">the surface</span></li>
        <li><Link href="/research">/research</Link> <span className="text-ink-3">the research map</span></li>
        <li><a href="/research.json">/research.json</a> <span className="text-ink-3">the record, for machines</span></li>
        <li><a href="/.well-known/ai">/.well-known/ai</a> <span className="text-ink-3">the AI manifest</span></li>
        <li><a href="/x">/x</a> <span className="text-ink-3">computational addresses</span></li>
      </ul>
    </section>
  );
}
