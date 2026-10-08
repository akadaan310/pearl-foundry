import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
// Self-hosted fonts (public/fonts/): no build-time fetch to Google Fonts,
// so cold builds (Vercel) never depend on the font pipeline or the network.
import "./globals.css";
import { Header, Footer } from "@/components/Chrome";
import { JsonLd } from "@/components/Substrate";
import { FirstInteraction } from "@/components/FirstInteraction";
import { MODE_BOOT } from "@/components/ModeSwitch";
import { SITE } from "@/content/site";
import { REPOSITORIES } from "@/content/repositories";

const serif = localFont({
  src: "../../public/fonts/sourceserif4-400.woff2",
  variable: "--font-source-serif",
  display: "swap",
  weight: "400 700",
});
const sans = localFont({
  src: [
    { path: "../../public/fonts/ibmplexsans-400.woff2", weight: "400" },
    { path: "../../public/fonts/ibmplexsans-500.woff2", weight: "500" },
    { path: "../../public/fonts/ibmplexsans-600.woff2", weight: "600" },
  ],
  variable: "--font-plex-sans",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "../../public/fonts/ibmplexmono-400.woff2", weight: "400" },
    { path: "../../public/fonts/ibmplexmono-500.woff2", weight: "500" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: { default: "Pearls — your AI can make a Pearl", template: "%s · Pearls" },
  description: `${SITE.oneSentence} A public research surface for AI-CI: Artificial Intelligence ↔ Computer Interaction.`,
  applicationName: "Abed Kadaan — research surface",
  authors: [{ name: SITE.name, url: SITE.origin }],
  alternates: {
    canonical: "/",
    types: { "application/json": "/research.json", "text/markdown": "/llms.txt", "text/plain": "/ai.txt" },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Abed Kadaan — The web is becoming programmable",
    description: SITE.oneSentence,
    url: SITE.origin,
    locale: "en",
  },
  twitter: { card: "summary_large_image", title: "Abed Kadaan — The web is becoming programmable", description: SITE.oneSentence },
  manifest: "/manifest.json",
  other: { "ai-manifest": "/.well-known/ai", "research-manifest": "/research.json" },
};

export const viewport: Viewport = { themeColor: "#0b0d18", colorScheme: "dark", width: "device-width", initialScale: 1 };

const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.origin}/#website`,
      url: SITE.origin,
      name: SITE.name,
      description: SITE.oneSentence,
      inLanguage: "en",
      author: { "@id": `${SITE.origin}/#person` },
      version: SITE.version,
      dateModified: SITE.updated,
    },
    {
      "@type": "Person",
      "@id": `${SITE.origin}/#person`,
      name: SITE.name,
      url: SITE.origin,
      jobTitle: "Software engineer, architect and independent researcher",
      email: `mailto:${SITE.contact}`,
      sameAs: [SITE.github],
      knowsAbout: ["Human–computer interaction", "Programmable web", "Agent continuity protocols", "React Native", "Next.js", "Distributed systems", "Developer tooling"],
    },
    {
      "@type": "Dataset",
      "@id": `${SITE.origin}/#research-manifest`,
      name: "Abed Kadaan research manifest",
      description: "Research topology, claims with evidence status, reproduction records and limitations.",
      url: `${SITE.origin}/research.json`,
      creator: { "@id": `${SITE.origin}/#person` },
      dateModified: SITE.updated,
      distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${SITE.origin}/research.json` }],
    },
    ...REPOSITORIES.filter((r) => r.id !== "site").map((r) => ({
      "@type": "SoftwareSourceCode",
      name: r.slug.split("/")[1],
      codeRepository: r.url,
      author: { "@id": `${SITE.origin}/#person` },
      version: r.commit,
    })),
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        <link rel="alternate" type="application/json" href="/.well-known/ai" title="AI manifest" />
        <link rel="describedby" type="application/json" href="/research.json" />
        <script dangerouslySetInnerHTML={{ __html: MODE_BOOT }} />
        <JsonLd data={graph} />
      </head>
      <body className="surface-world world-bg text-ink">
        <Header />
        <main id="main" tabIndex={-1} className="focus:outline-none">{children}</main>
        <Footer />
        <FirstInteraction />
      </body>
    </html>
  );
}
