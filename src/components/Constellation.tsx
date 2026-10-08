import Link from "next/link";
import { NODES, RELATIONS } from "@/content/research";

const KIND: Record<string, string> = { thesis: "thesis", protocol: "protocol", instrument: "instrument", surface: "surface", notebook: "notebook" };

/**
 * The research topology. Desktop: a positioned constellation whose edges
 * light up when a node is hovered or focused (CSS :has(), no JavaScript).
 * Mobile: the same graph as a linear, semantic list. Both are generated from
 * NODES and RELATIONS, the records /research.json is built from.
 */
export function Constellation({ compact = false }: { compact?: boolean }) {
  const pos = Object.fromEntries(NODES.map((n) => [n.id, n.position]));
  const highlight = NODES.map(
    (n) =>
      `.constellation:has([data-node="${n.id}"]:is(:hover,:focus-visible)) line[data-ends~="${n.id}"]{stroke:var(--color-emerald);stroke-opacity:1}` +
      `.constellation:has([data-node="${n.id}"]:is(:hover,:focus-visible)) [data-node]:not([data-node="${n.id}"]):not([data-near~="${n.id}"]){opacity:.35}`,
  ).join("");
  const near = (id: string) =>
    RELATIONS.filter((r) => r.from === id || r.to === id).map((r) => (r.from === id ? r.to : r.from)).join(" ");

  return (
    <div>
      <style>{highlight}</style>
      <figure
        className={`constellation grid-paper relative hidden border border-rule md:block ${compact ? "aspect-[16/8]" : "aspect-[16/10]"}`}
        aria-labelledby="constellation-caption"
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {RELATIONS.map((r, i) => (
            <line
              key={i}
              data-ends={`${r.from} ${r.to}`}
              x1={pos[r.from].x} y1={pos[r.from].y} x2={pos[r.to].x} y2={pos[r.to].y}
              className="edge transition-[stroke] duration-200"
              strokeOpacity={0.9}
            />
          ))}
        </svg>
        {NODES.map((n) => (
          <Link
            key={n.id}
            href={`/research/${n.id}`}
            data-node={n.id}
            data-near={near(n.id)}
            className="group absolute -translate-x-1/2 -translate-y-1/2 bg-ground/90 px-3 py-2 text-center no-underline transition-opacity duration-200"
            style={{ left: `${n.position.x}%`, top: `${n.position.y}%` }}
          >
            <span className="mx-auto mb-1 block h-2 w-2 rotate-45 border border-emerald bg-ground group-hover:bg-emerald group-focus-visible:bg-emerald" aria-hidden="true" />
            <span className={`block font-serif leading-none ${n.id === "ai-ci" ? "text-[1.6rem]" : "text-[1.15rem]"}`}>{n.name}</span>
            <span className="coord mt-1 block">
              {KIND[n.kind]} · {n.position.x.toFixed(0).padStart(2, "0")},{n.position.y.toFixed(0).padStart(2, "0")}
            </span>
          </Link>
        ))}
        <figcaption id="constellation-caption" className="coord absolute bottom-2 right-3">
          {NODES.length} nodes · {RELATIONS.length} relations · each relation cites the file that states it
        </figcaption>
      </figure>

      {/* The semantic linear representation: always present for assistive technology, visible on small screens. */}
      <ol className="md:sr-only" aria-label="Research topology as a list">
        {NODES.map((n) => {
          const out = RELATIONS.filter((r) => r.from === n.id);
          return (
            <li key={n.id} className="rule-t py-5">
              <Link href={`/research/${n.id}`} className="font-serif text-xl no-underline">{n.name}</Link>
              <span className="coord ml-2">{KIND[n.kind]}</span>
              <p className="mt-1 text-[0.92rem] text-ink-2">{n.line}</p>
              {out.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-l border-rule pl-4 text-[0.85rem] text-ink-2">
                  {out.map((r, i) => (
                    <li key={i}>
                      <span className="font-mono text-emerald">→ {NODES.find((x) => x.id === r.to)!.name}</span>: {r.label}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function RelationsTable() {
  const name = (id: string) => NODES.find((n) => n.id === id)!.name;
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
      <table className="w-full min-w-[40rem] border-collapse text-left text-[0.88rem]">
        <caption className="sr-only">Every relation in the research topology, with the source that states it</caption>
        <thead>
          <tr className="label">
            <th scope="col" className="rule-b py-2 pr-4 font-normal">From</th>
            <th scope="col" className="rule-b py-2 pr-4 font-normal">To</th>
            <th scope="col" className="rule-b py-2 pr-4 font-normal">Relation</th>
            <th scope="col" className="rule-b py-2 font-normal">Stated in</th>
          </tr>
        </thead>
        <tbody>
          {RELATIONS.map((r, i) => (
            <tr key={i} className="rule-b align-top">
              <td className="py-3 pr-4 font-serif">{name(r.from)}</td>
              <td className="py-3 pr-4 font-serif">{name(r.to)}</td>
              <td className="py-3 pr-4 text-ink-2">{r.label}</td>
              <td className="py-3 font-mono text-[0.75rem] text-ink-3">{r.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
