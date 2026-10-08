import type { LivingRecord } from "@/lib/living/record";
import type { Pearl } from "@/lib/pearl/model";
import { blockToLine } from "@/lib/pearl/serialize";

/** SUBSTRATE for a Pearl: the address anatomy, the parsed state, and the lineage. Server-rendered. */
export function PearlSubstrate({ pearl, record, links }: { pearl: Pearl; record: LivingRecord; links: { e: string; portable: string } }) {
  const params: [string, string][] = [["type", pearl.type], ["title", pearl.title]];
  if (pearl.by) params.push(["by", pearl.by]);
  if (pearl.session) params.push(["session", pearl.session]);
  if (pearl.for) params.push(["for", pearl.for]);
  if (pearl.from) params.push(["from", pearl.from]);
  const cont = (record.state.continuity ?? null) as { open_threads: string[]; closed_threads: string[]; next_actions: string[] } | null;
  return (
    <>
      <div>
        <p className="eyebrow mb-3">The address · URL → Pearl → typed blocks → rendering</p>
        <ol className="pipeline" aria-label="URL to rendering">
          {[["URL", `/e?${params.length + pearl.blocks.length} parameters · ${links.e.length} chars`], ["PEARL", `pearl/1 · ${pearl.type}`], ["BLOCKS", `${pearl.blocks.length} typed blocks`], ["ID", record.identity.id], ["PORTABLE", `/p/… · ${links.portable.length} chars`]].map(([k, v]) => (
            <li key={k} className="pipeline-step"><span className="eyebrow">{k}</span><span className="mt-1 block break-all font-mono text-[0.75rem]">{v}</span></li>
          ))}
        </ol>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <p className="eyebrow mb-3">Parameters and blocks, as parsed</p>
          <ol className="space-y-1 font-mono text-[0.75rem]">
            {params.map(([k, v]) => <li key={k} className="break-all"><span className="text-emerald">{k}=</span>{v}</li>)}
            {pearl.blocks.map((b, i) => <li key={i} className="break-all"><span className="text-emerald">b{i + 1}=</span>{blockToLine(b).slice(0, 220)}</li>)}
          </ol>
        </div>
        <div className="space-y-6">
          <div>
            <p className="eyebrow mb-3">State</p>
            <dl className="grid grid-cols-[8rem_1fr] gap-y-1 text-[0.88rem]">
              {Object.entries(record.state.by_kind as Record<string, number>).map(([k, n]) => <div key={k} className="contents"><dt className="font-mono text-ink-3">{k}</dt><dd>{n}</dd></div>)}
            </dl>
            {cont && (
              <div className="mt-4 text-[0.88rem]">
                <p><span className="text-ink-3">open threads</span> {cont.open_threads.length ? cont.open_threads.join(" · ") : "none"}</p>
                {cont.closed_threads.length > 0 && <p><span className="text-ink-3">closed</span> {cont.closed_threads.join(" · ")}</p>}
                {cont.next_actions.length > 0 && <p><span className="text-ink-3">next</span> {cont.next_actions.join(" · ")}</p>}
              </div>
            )}
          </div>
          <div>
            <p className="eyebrow mb-3">Lineage · history as topology</p>
            {record.history.length === 0 ? <p className="text-[0.88rem] text-ink-3">An original: no from=. Forks and remixes of it will name {record.identity.id} as their parent.</p> : (
              <p className="flex flex-wrap items-center gap-2 font-mono text-[0.78rem]">
                <a className="node" href={`/p/${record.history[0].from}`}>{record.history[0].from}</a><span className="text-emerald">—fork→</span><span className="node" aria-current="step">{record.identity.id}</span>
              </p>
            )}
            <p className="mt-2 text-[0.8rem] text-ink-3">Lineage is what the Pearl asserts with from=. It is not proof of authorship.</p>
          </div>
        </div>
      </div>
    </>
  );
}
