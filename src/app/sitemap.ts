import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";
import { NODES } from "@/content/research";
import { EXPERIENCES } from "@/content/experiences";

export const PAGES = ["/", "/g/ttt", "/clock", "/loom", "/garden", "/report", "/how", "/developers", "/live", "/play", "/compare", "/create", "/spaces", "/explore", "/capabilities", "/prompts", "/workspace", "/continue", "/compose", "/research", "/ai", "/protocol", "/experiments", "/verify", "/press", "/broadcast", "/about"];
export const FILES = ["/llms.txt", "/ai.txt", "/.well-known/ai", "/research.json", "/verify/ingress.json", "/capabilities.json", "/schemas/research-manifest.schema.json", "/schemas/pearl.schema.json", "/schemas/pearl-export.schema.json"];

export default function sitemap(): MetadataRoute.Sitemap {
  const at = new Date(SITE.updated + "T00:00:00Z");
  return [...PAGES, ...EXPERIENCES.map((e) => `/create/${e.id}`), ...NODES.map((n) => `/research/${n.id}`), ...FILES].map((p) => ({ url: SITE.origin + p, lastModified: at }));
}
