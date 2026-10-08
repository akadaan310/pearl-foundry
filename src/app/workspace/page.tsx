import type { Metadata } from "next";
import { WorkspaceApp } from "@/components/pearl/WorkspaceApp";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = {
  title: "My Pearls",
  description: "Your Pearl library, spaces, projects, notes and tasks, kept in this browser. Export and import are validated.",
  alternates: { canonical: "/workspace" },
};

export default function Workspace() {
  return (
    <>
      <SubstrateLayer data={{ page: "/workspace", storage: "browser-local (localStorage key pearls.workspace.v1)", cloud: false, export_format: "pearl-export v1", schema: "/schemas/pearl-export.schema.json" }} />
      <header className="border-b border-rule" data-substrate="workspace → library → spaces → projects → tasks" data-address="/workspace" data-pointer="/schemas/pearl-export.schema.json">
        <div className="wrap pb-10 pt-14 sm:pt-20">
          <p className="label mb-6">§ pearl workspace · stored in this browser</p>
          <h1 className="title !text-[clamp(2.2rem,5vw,4rem)]">My Pearls.</h1>
          <p className="measure mt-4 text-ink-2">Your library lives in this browser&apos;s local storage. It is not an account and it does not sync: another device won&apos;t see it, and clearing site data removes it. Export a backup whenever it matters.</p>
        </div>
      </header>
      <div className="wrap py-10">
        <WorkspaceApp />
      </div>
    </>
  );
}
