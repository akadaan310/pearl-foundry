import type { NextConfig } from "next";

// Security headers. Inline scripts are limited to Next's own bootstrap and
// JSON data blocks (application/json, application/ld+json), which browsers do not execute.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const dev = process.env.NODE_ENV !== "production";
    return [
      { source: "/e", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/c/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
      {
        source: "/:path*",
        headers: [
          ...(dev ? [] : [{ key: "Content-Security-Policy", value: csp }]),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Link", value: '</research.json>; rel="describedby"; type="application/json", </.well-known/ai>; rel="alternate"; type="application/json"; title="AI manifest", </llms.txt>; rel="alternate"; type="text/markdown"' },
        ],
      },
    ];
  },
};

export default config;
