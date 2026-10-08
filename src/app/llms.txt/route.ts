import { llmsTxt } from "@/lib/manifest";
export const dynamic = "force-static";
export function GET() {
  return new Response(llmsTxt(), { headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
