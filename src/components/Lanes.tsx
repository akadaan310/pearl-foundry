import type { StoredEvent } from "@/lib/continuity/model";

/**
 * The continuity stack, observed: one lane per session, one mark per write,
 * a line for every hand-over between sessions. No interpretation is added.
 */
export function Lanes({ events, highlight }: { events: StoredEvent[]; highlight?: string | null }) {
  const shown = events.slice(-48);
  const sessions = [...new Set(shown.map((e) => e.body.session))];
  const W = 760, lane = 34, left = 150, top = 26;
  const step = Math.min(48, (W - left - 20) / Math.max(1, shown.length - 1 || 1));
  const H = top + sessions.length * lane + 18;
  const pos = (e: StoredEvent, i: number) => ({ x: left + i * step, y: top + sessions.indexOf(e.body.session) * lane + lane / 2 });
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${sessions.length} sessions writing ${shown.length} versions into one brain. Lanes are sessions; marks are writes; lines are hand-overs.`}>
        {sessions.map((s, k) => (
          <g key={s}>
            <line x1={left - 8} x2={W - 8} y1={top + k * lane + lane / 2} y2={top + k * lane + lane / 2} className="stroke-rule" strokeWidth={1} />
            <text x={0} y={top + k * lane + lane / 2 + 4} className={`font-mono text-[11px] ${s === highlight ? "fill-gold" : "fill-ink-2"}`}>{s.length > 20 ? s.slice(0, 19) + "…" : s}</text>
          </g>
        ))}
        {shown.map((e, i) => i > 0 && (() => { const a = pos(shown[i - 1], i - 1), b = pos(e, i); return <line key={`l${e.v}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-emerald/50" strokeWidth={1} />; })())}
        {shown.map((e, i) => { const p = pos(e, i); return (
          <g key={e.v}>
            <circle cx={p.x} cy={p.y} r={e.kind === "genesis" ? 6 : 4} className={e.kind === "genesis" ? "fill-gold" : e.body.session === highlight ? "fill-gold" : "fill-emerald"} />
            <text x={p.x} y={14} textAnchor="middle" className="fill-ink-3 font-mono text-[9px]">{shown.length <= 24 || e.v % 5 === 0 ? `v${e.v}` : ""}</text>
          </g>
        ); })}
      </svg>
      <figcaption className="mt-2 text-[0.8rem] text-ink-3">Observed, not interpreted: who wrote, in what order. Gold marks the first write{highlight ? ` and the session “${highlight}”` : ""}.{events.length > 48 ? ` Showing the last 48 of ${events.length} versions.` : ""}</figcaption>
    </figure>
  );
}
