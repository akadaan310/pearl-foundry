import type { Metadata } from "next";
import { SpacesApp } from "@/components/pearl/SpacesApp";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = {
  title: "Spaces",
  description: "Places for Pearls that belong together. Kept in this browser; export, import, or carry a whole space as one collection Pearl.",
  alternates: { canonical: "/spaces" },
};

export default function Spaces() {
  return (
    <>
      <SubstrateLayer data={{ page: "/spaces", storage: "browser-local (localStorage key pearls.workspace.v1)", cloud: false, composes: "collection Pearls (pearl: references, never expanded recursively)", export_format: "pearl-export v1" }} />
      <header className="paper-glow border-b border-rule">
        <div className="wrap act !pb-12">
          <p className="eyebrow mb-5">Spaces</p>
          <h1 className="keynote max-w-[16ch]">A place for the things you keep.</h1>
          <p className="mt-6 max-w-[42ch] text-[1.2rem] text-ink-2">Put Pearls that belong together in a space: your life, your kitchen, a course, a project. Then carry the whole space as one Pearl.</p>
        </div>
      </header>
      <div className="wrap py-12">
        <SpacesApp />
      </div>
    </>
  );
}
