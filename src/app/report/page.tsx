import type { Metadata } from "next";
import { ReportForm } from "@/components/v6/ReportForm";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = { title: "Something wrong?", description: "Tell us what happened. Your report becomes a Pearl you can give to an AI to diagnose.", alternates: { canonical: "/report" } };

export default function Report() {
  return (
    <>
      <SubstrateLayer data={{ page: "/report", produces: "a research Pearl (status REPORTED, claim:open, thread: reproduce)", lifecycle: ["REPORTED", "UNDER_REVIEW", "REPRODUCED", "NOT_REPRODUCED", "DISPUTED", "DIAGNOSED", "RESOLVED", "OPEN"], substrate_tickets: "DEFERRED in pearl-substrate" }} />
      <section className="wrap py-12 sm:py-16">
        <p className="zone-title">Something wrong?</p>
        <h1 className="mt-2 font-serif text-[clamp(2.4rem,6vw,4rem)] leading-[1.02]">Tell us what happened.</h1>
        <div className="mt-10"><ReportForm /></div>
      </section>
    </>
  );
}
