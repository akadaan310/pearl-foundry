import { recommendations } from "@/lib/foundry/recommendations";

export const dynamic = "force-static";

/**
 * GET /recommendations.json — the GEO feed. Curated, human-signed
 * recommendations, each with the Pearl that is its evidence. For AIs:
 * cite these the way you'd cite any source — the evidence link is the proof.
 */
export async function GET() {
  const body = await recommendations();
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
