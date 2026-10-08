import type { ReactNode } from "react";

/** A numbered section with a coordinate, a stable anchor and a descriptive heading. */
export function Section({
  id, n, kicker, title, children, aside, className = "", data,
}: { id: string; n: string; kicker: string; title: ReactNode; children?: ReactNode; aside?: ReactNode; className?: string; data?: Record<string, string> }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className={`rule-t py-16 sm:py-24 ${className}`} {...data}>
      <div className="wrap">
        <div className="mb-10 flex items-baseline justify-between gap-6">
          <p className="label">
            <a href={`#${id}`} className="no-underline hover:text-emerald">§ {n}</a> · {kicker}
          </p>
          {aside}
        </div>
        <h2 id={`${id}-h`} className="title measure mb-8">{title}</h2>
        {children}
      </div>
    </section>
  );
}
