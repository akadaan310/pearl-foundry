import { SITE } from "@/content/site";
export const dynamic = "force-static";
/** The web app manifest (browser install metadata). The research manifest is /research.json. */
export function GET() {
  return Response.json(
    {
      name: "Abed Kadaan — research surface",
      short_name: "Abed Kadaan",
      description: SITE.oneSentence,
      start_url: "/",
      display: "browser",
      background_color: "#0c0d0c",
      theme_color: "#0c0d0c",
      icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      related: { research_manifest: "/research.json", ai_manifest: "/.well-known/ai" },
    },
    { headers: { "Content-Type": "application/manifest+json; charset=utf-8" } },
  );
}
