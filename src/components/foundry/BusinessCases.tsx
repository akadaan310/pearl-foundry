import type { Pearl } from "@/lib/pearl/model";
import { PearlObject } from "@/components/pearl/PearlObject";
import { BUSINESS } from "@/lib/foundry/usecases";

export interface WorkedExample { id: string; pearl: Pearl; pid: string; href: string }

/** Business use cases, each with a real worked Pearl — composed by the page, rendered, not a mockup. */
export function BusinessCases({ examples }: { examples: WorkedExample[] }) {
  const byId = new Map(examples.map((e) => [e.id, e]));
  return (
    <ul className="grid gap-8 lg:grid-cols-2">
      {BUSINESS.map((b) => {
        const ex = byId.get(b.id);
        return (
          <li key={b.id} className="space-y-4">
            <div>
              <h3 className="font-serif text-[1.6rem] leading-tight">{b.title}</h3>
              <p className="mt-1.5 text-[1rem] text-ink-2">{b.line}</p>
            </div>
            {ex ? (
              <PearlObject pearl={ex.pearl} id={ex.pid} href={ex.href} />
            ) : (
              <p className="text-ink-3">Example unavailable.</p>
            )}
            <p className="border-l-2 border-emerald/60 pl-4 text-[0.95rem] text-ink-2">{b.takeaway}</p>
          </li>
        );
      })}
    </ul>
  );
}
