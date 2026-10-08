import type { Metadata } from "next";
import { registry } from "@/lib/capabilities";
import { SubstrateLayer } from "@/components/Substrate";
import { CopyButton } from "@/components/CopyPrompt";

export const metadata: Metadata = {
  title: "Capabilities",
  description: "Every operation this site performs by URL: pure GET requests with inputs, outputs, limits and errors. Operations not listed do not exist.",
  alternates: { canonical: "/capabilities" },
};

export default function Capabilities() {
  const r = registry();
  return (
    <>
      <SubstrateLayer data={{ page: "/capabilities", registry: "/capabilities.json", capabilities: r.capabilities.map((c) => c.id) }} />
      <header className="border-b border-rule" data-substrate="url → capability → pure function → result → hash" data-address="/capabilities" data-pointer="/capabilities.json">
        <div className="wrap pb-14 pt-14 sm:pt-20">
          <p className="label mb-8">§ capabilities · what this site can do for an AI</p>
          <h1 className="title max-w-[22ch] !text-[clamp(2.2rem,5vw,4rem)]">Operations you can call by URL.</h1>
          <p className="lede measure mt-6 text-ink-2">{r.note}</p>
          <p className="mt-6 font-mono text-[0.85rem]"><a href="/capabilities.json">/capabilities.json</a></p>
        </div>
      </header>
      <div className="wrap space-y-12 py-16">
        {r.capabilities.map((c) => (
          <section key={c.id} id={c.id} aria-labelledby={`cap-${c.id}`} className="border-t border-rule pt-8">
            <h2 id={`cap-${c.id}`} className="font-mono text-xl">{c.id} <span className="text-[0.8rem] text-ink-3">v{c.version} · {c.method} · {c.mode} · side effects: {c.side_effects}</span></h2>
            <p className="measure mt-3 text-ink-2">{c.purpose}</p>
            <dl className="mt-5 grid gap-x-8 gap-y-2 text-[0.9rem] sm:grid-cols-[8rem_1fr]">
              <dt className="text-ink-3">URL</dt><dd className="break-all font-mono text-[0.82rem]">{c.url}</dd>
              <dt className="text-ink-3">Input</dt><dd className="break-all font-mono text-[0.78rem]">{JSON.stringify(c.input)}</dd>
              <dt className="text-ink-3">Output</dt><dd className="break-all font-mono text-[0.78rem]">{JSON.stringify(c.output)}</dd>
              <dt className="text-ink-3">Limits</dt><dd className="break-all font-mono text-[0.78rem]">{JSON.stringify(c.limits)}</dd>
              <dt className="text-ink-3">Errors</dt><dd className="font-mono text-[0.78rem]">{Object.entries(c.errors).map(([k, v]) => <span key={k} className="block">{k}: {v}</span>)}</dd>
              <dt className="text-ink-3">Engine</dt><dd>{c.engine}</dd>
              <dt className="text-ink-3">Example</dt><dd className="flex flex-wrap items-center gap-3"><a className="break-all font-mono text-[0.8rem]" href={c.example.replace(/^https?:\/\/[^/]+/, "")}>{c.example}</a><CopyButton text={c.example} label="Copy" /></dd>
            </dl>
          </section>
        ))}
        <section aria-labelledby="engines" className="border-t border-rule pt-8">
          <h2 id="engines" className="label mb-4">Engines</h2>
          <ul className="space-y-2">{r.engines.map((e) => <li key={e.id}><span className="font-mono">{e.id}</span> — {e.status}{"note" in e && e.note ? <span className="text-ink-2">. {e.note}</span> : null}</li>)}</ul>
        </section>
        <section aria-labelledby="not" className="border-t border-rule pt-8">
          <h2 id="not" className="label mb-4">Not available here</h2>
          <ul className="space-y-2 text-ink-2">
            {r.requires_user_action.map((u) => <li key={u.action}><b className="font-medium text-ink">{u.action}</b>: {u.note}</li>)}
            {r.requires_backend.map((u) => <li key={u.feature}><b className="font-medium text-ink">{u.feature}</b>: {u.status}</li>)}
          </ul>
        </section>
      </div>
    </>
  );
}
