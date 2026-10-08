import Link from "next/link";
import type { Related } from "@/lib/living/record";
import { decodePortable, splitPortable } from "@/lib/pearl/portable";
import { parseExperience, parseQueryString } from "@/lib/experience";
import { RESEARCH_IDS } from "@/lib/experience-request";
import { toPearl, pearlId, TYPE_INFO } from "@/lib/pearl/model";
import { livingAddress } from "@/lib/living/address";

interface Star { kind: Related["kind"]; label: string; href: string; sub: string }

/** What a related object is, read from its own address. Nothing is fetched: links carry their content. */
async function describe(r: Related): Promise<Star> {
  const human = r.href.replace(/^\/x(?=\/)/, "/live");
  try {
    if (r.href.startsWith("/p/")) {
      const parts = splitPortable(r.href.slice(3));
      if (parts?.token) {
        const q = await decodePortable(parts.token);
        const d = parseExperience(parseQueryString(q), RESEARCH_IDS, q.length);
        if (!d.errors.length) { const p = toPearl(d.doc); if (pearlId(p) === parts.id) return { kind: r.kind, label: r.label, href: r.href, sub: `${TYPE_INFO[p.type].label} Pearl · ${p.title} · ${parts.id}` }; }
      }
      return { kind: r.kind, label: r.label, href: r.href, sub: parts?.token ? "a portable Pearl that does not verify" : `a Pearl id (${parts?.id ?? "?"}): content not carried` };
    }
    if (r.href.startsWith("/e?")) {
      const d = parseExperience(parseQueryString(r.href.slice(3)), RESEARCH_IDS, r.href.length);
      if (!d.errors.length) { const p = toPearl(d.doc); return { kind: r.kind, label: r.label, href: r.href, sub: `${TYPE_INFO[p.type].label} Pearl · ${pearlId(p)}` }; }
    }
    const a = r.href.replace(/^\/(x|live)(?=\/)/, "");
    if (a.startsWith("/map/")) { const rec = livingAddress(a); return { kind: r.kind, label: r.kind === "address" ? rec.title : r.label, href: `/live${a}`, sub: `computation · ${rec.type} · ${rec.identity.hash.slice(0, 10)}…` }; }
  } catch { /* described below */ }
  return { kind: r.kind, label: r.label, href: human, sub: r.kind === "research" ? "research node · this site's record" : r.detail ?? r.kind };
}

const COLOR: Record<Related["kind"], string> = { pearl: "var(--color-gold)", address: "var(--color-emerald)", research: "var(--color-ink-2)", choice: "var(--color-gold)", parent: "var(--color-ink-3)", link: "var(--color-ink-3)" };

/**
 * A Pearl's world: the separately addressed objects it points to, drawn as a
 * constellation around it. Each satellite is a link to its own address; this
 * is a topology of immutable objects, not one mutable page.
 */
export async function PearlWorld({ related, title, id }: { related: Related[]; title: string; id: string }) {
  const rs = related.filter((r) => r.kind !== "link").slice(0, 16);
  if (!rs.length) return null;
  const stars = await Promise.all(rs.map(describe));
  const W = 640, H = stars.length > 8 ? 420 : 340, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.38;
  return (
    <section aria-labelledby="world-h" className="rule-t">
      <div className="wrap py-12">
        <p className="eyebrow mb-2">This Pearl&apos;s world</p>
        <h2 id="world-h" className="title mb-6">{stars.length === 1 ? "It leads to one other object." : `It leads to ${stars.length} other objects.`}</h2>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,40rem)_1fr]">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true" focusable="false" data-title={title}>
            {stars.map((s, i) => {
              const a = -Math.PI / 2 + (i * 2 * Math.PI) / stars.length;
              return <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(a)} y2={cy + R * Math.sin(a)} stroke={COLOR[s.kind]} strokeOpacity="0.45" strokeDasharray={s.kind === "parent" ? "3 4" : undefined} />;
            })}
            <circle cx={cx} cy={cy} r={34} fill="url(#world-pearl)" />
            <defs><radialGradient id="world-pearl" cx="38%" cy="34%" r="70%"><stop offset="0%" stopColor="var(--pearl-hi)" /><stop offset="45%" stopColor="var(--pearl-mid)" /><stop offset="100%" stopColor="var(--pearl-lo)" /></radialGradient></defs>
            <text x={cx} y={cy + 56} textAnchor="middle" className="fill-ink font-mono" fontSize="11">{id}</text>
            {stars.map((s, i) => {
              const a = -Math.PI / 2 + (i * 2 * Math.PI) / stars.length;
              const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
              return (
                <a key={i} href={s.href} tabIndex={-1}>
                  <circle cx={x} cy={y} r={s.kind === "address" ? 11 : 13} fill="var(--color-panel)" stroke={COLOR[s.kind]} strokeWidth="2" className="world-node" />
                  <text x={x} y={y + (y > cy ? 30 : -20)} textAnchor="middle" className="fill-ink" fontSize="12">{s.label.length > 26 ? s.label.slice(0, 24) + "…" : s.label}</text>
                </a>
              );
            })}
          </svg>
          <ul className="space-y-3" aria-label="Objects this Pearl leads to">
            {stars.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2" style={{ borderColor: COLOR[s.kind] }} />
                <span className="min-w-0"><Link href={s.href} className="font-medium">{s.label}</Link><span className="block truncate text-[0.82rem] text-ink-3">{s.sub}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-6 text-[0.82rem] text-ink-3">Each object is separate: it has its own address and its own identity, and opening it never changes this Pearl.</p>
      </div>
    </section>
  );
}
