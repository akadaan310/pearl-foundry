/** The human rendering of a resolution. The JSON document is embedded verbatim. */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderAddressHtml(address: string, doc: object, status: number): string {
  const json = JSON.stringify(doc, null, 2);
  const d = doc as { next?: { rel: string; href: string }[]; identity?: { value_sha256: string }; derivation?: { address: string; operation: string }[] };
  const nav = (d.next ?? []).map((l) => `<a href="${esc(l.href)}">${esc(l.rel)}</a>`).join(" · ");
  const chain = (d.derivation ?? []).map((s) => `<li><code>${esc(s.address)}</code> <span>${esc(s.operation)}</span></li>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(address === "/" ? "/x" : "/x" + address)} · computational address</title>
<link rel="alternate" type="application/json" href="?format=json">
<meta name="robots" content="noindex">
<style>
:root{color-scheme:dark}body{margin:0;background:#0c0d0c;color:#eeeae1;font:15px/1.6 ui-sans-serif,system-ui,sans-serif}
main{max-width:56rem;margin:0 auto;padding:2rem 1rem}h1{font:400 1.6rem/1.2 Georgia,serif;margin:.2rem 0 1rem;word-break:break-all}
.l{font:12px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:#8f8b81}a{color:#74c39c}
pre{background:#0a0b0a;border:1px solid #262a27;padding:1rem;overflow:auto;font:12.5px/1.55 ui-monospace,monospace;color:#bdb8ac}
ol{padding-left:1.2rem;color:#bdb8ac}code{color:#eeeae1}ol span{color:#8f8b81;font-size:.85em}.h{font:13px ui-monospace,monospace;color:#74c39c;word-break:break-all}
</style></head><body><main>
<p class="l">computational address · HTTP ${status} · <a href="/">Pearls</a> · <a href="/x">registry</a> · <a href="/experiments#X-ADDRESS">what is this?</a></p>
<h1>/x${esc(address === "/" ? "" : address)}</h1>
${d.identity ? `<p class="l">value_sha256</p><p class="h">${esc(d.identity.value_sha256)}</p>` : ""}
${chain ? `<p class="l">derivation: address → program → state → transition → result</p><ol>${chain}</ol>` : ""}
${nav ? `<p class="l">next addresses</p><p>${nav}</p>` : ""}
<p class="l">machine representation (identical to ?format=json)</p>
<pre id="document">${esc(json)}</pre>
<script type="application/json" id="substrate-layer">${json.replace(/</g, "\\u003c")}</script>
</main></body></html>`;
}
