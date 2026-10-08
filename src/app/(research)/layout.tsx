/**
 * Research and Explore views keep the dark editorial theme: the laboratory is
 * the engine under the product, and it should look like one.
 */
export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return <div className="surface-research bg-ground text-ink">{children}</div>;
}
