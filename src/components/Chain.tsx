/** A transition chain: Address → Program → State → Transition → Result. Server-rendered; motion is CSS only. */
export function Chain({ steps, caption }: { steps: { k: string; v: string }[]; caption?: string }) {
  return (
    <figure>
      <ol className="grid gap-px border border-rule bg-rule sm:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.k} className="motion-reveal relative bg-ground p-4" style={{ animationDelay: `${i * 110}ms` }}>
            <p className="coord">{String(i).padStart(2, "0")}</p>
            <p className="mt-1 font-serif text-xl">{s.k}</p>
            <p className="mt-2 break-words font-mono text-[0.74rem] leading-relaxed text-ink-2">{s.v}</p>
            {i < steps.length - 1 && <span aria-hidden="true" className="absolute right-2 top-4 font-mono text-emerald max-sm:hidden">→</span>}
          </li>
        ))}
      </ol>
      {caption && <figcaption className="mt-3 text-[0.82rem] text-ink-3">{caption}</figcaption>}
    </figure>
  );
}
