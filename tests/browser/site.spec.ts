import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

const LIVING = "/e?type=experience&title=A+walk+through+Rule+90&by=Pearls&session=living-example&b1=h:Eight+cells+on+a+ring&b2=p:Start+here&b3=x:/map/eca/90/8/state/5&b4=choice:What+would+you+like+to+do%3F|Take+one+step>/x/map/eca/90/8/state/5/next|Flip+a+cell>/x/map/eca/90/8/state/5/flip/2&b5=research:purl&b6=prompt:Predict+the+next+state";
const PAGES = ["/", "/how", "/g/ttt", "/g/ttt/4~you/0~ai-a", "/clock", "/loom", "/garden", "/report", "/developers", "/live", "/live/map/eca/90/8/state/5", "/live/map/eca/30/16/state/256/trace/16", "/play", "/compare", LIVING, "/create", "/create/conversation", "/create/computation", "/spaces", "/explore", "/capabilities", "/prompts", "/workspace", "/continue", "/compose", "/research", "/research/continuity", "/research/golden-surface", "/ai", "/protocol", "/experiments", "/verify", "/press", "/broadcast", "/about"];

test.describe("every page", () => {
  for (const p of PAGES) {
    test(`${p}: loads, one h1, landmarks, machine layer, no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      const res = await page.goto(p);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("header").first()).toBeVisible();
      await expect(page.locator("main#main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);
      const layer = await page.locator("script#substrate-layer").textContent();
      expect(() => JSON.parse(layer ?? "")).not.toThrow();
      expect(errors).toEqual([]);
    });

    test(`${p}: no WCAG 2.1 A/AA violations (axe)`, async ({ page }) => {
      await page.goto(p);
      await page.waitForTimeout(1300); // let reveal animations finish: contrast is checked on the settled page
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help}`)).toEqual([]);
    });
  }
});

test("no horizontal overflow at any page width", async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, p).toBeLessThanOrEqual(0);
  }
});

test("keyboard: skip link first, then reach the primary navigation", async ({ page, isMobile }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  if (!isMobile) {
    await page.goto("/");
    for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toHaveAttribute("href", /^\/(g\/ttt|create|garden)?$/);
  }
});

test("keyboard: constellation nodes are focusable links (desktop)", async ({ page, isMobile }) => {
  test.skip(isMobile, "mobile shows the linear list instead");
  await page.goto("/research");
  const node = page.locator('[data-node="purl"]');
  await node.focus();
  await expect(node).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/research\/purl$/);
});

test("mobile: the topology is a linear semantic list, not a shrunk diagram", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/research");
  await expect(page.locator("figure.constellation")).toBeHidden();
  await expect(page.getByRole("list", { name: "Research topology as a list" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Research topology as a list" }).locator(":scope > li")).toHaveCount(8);
});

test("mobile: navigation works without JavaScript (details/summary)", async ({ browser, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto("/");
  await page.getByText("Menu").click();
  await page.getByRole("navigation", { name: "Primary (mobile)" }).getByRole("link", { name: "Research" }).click();
  await expect(page).toHaveURL(/\/research$/);
  await ctx.close();
});

test("without JavaScript: content, machine layer and substrate disclosures all work", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/how");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your AI can make a Pearl.");
  await expect(page.getByText("Copy this into your AI and see what it makes.")).toBeVisible();
  await page.goto("/explore");
  const d = page.locator("details.substrate").first();
  await d.locator("summary").click();
  await expect(d.locator("pre")).toBeVisible();
  await page.goto("/research/purl");
  await expect(page.getByText("Programmable URL Protocol", { exact: false }).first()).toBeVisible();
  await ctx.close();
});

test("reduced motion: animations are effectively disabled", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("/explore");
  const dur = await page.locator(".motion-reveal").first().evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(dur)).toBeLessThan(0.01);
  await ctx.close();
});

test("deep links resolve to their anchors", async ({ page }) => {
  for (const [path, id] of [["/verify", "E-006"], ["/verify", "C-14"], ["/verify", "ingress"], ["/experiments", "X-ADDRESS"], ["/research/golden-surface", "model"], ["/explore", "golden"], ["/how", "first"], ["/", "for-ai"], ["/", "make"], ["/", "bring"], ["/capabilities", "hash.sha256"]]) {
    await page.goto(`${path}#${id}`);
    await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
  }
});

test("404: correct status and a useful page", async ({ page }) => {
  const res = await page.goto("/definitely-not-here");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("does not resolve");
  await expect(page.getByRole("main").getByRole("link", { name: "/research.json" })).toBeVisible();
});

test("first interaction reveals the substrate layer, and it can be dismissed", async ({ page, isMobile }) => {
  test.skip(isMobile, "the trace strip is desktop-only; mobile uses the disclosures");
  await page.addInitScript(() => localStorage.setItem("pearls.mode", "explore")); // the trace is part of Explore mode
  await page.goto("/explore");
  const trace = page.getByRole("complementary", { name: /Substrate trace/ });
  await expect(trace).toHaveCount(0);
  await page.mouse.wheel(0, 1800);
  await expect(trace).toBeVisible();
  await expect(trace).toContainText("USER");
  await trace.getByRole("button", { name: "Close substrate trace" }).click();
  await expect(trace).toHaveCount(0);
});

test("address console: resolves and the browser recomputes the identical hash", async ({ page }) => {
  await page.goto("/explore#address");
  await expect(page.getByText("✓ identical, recomputed in your browser")).toBeVisible();
  await page.getByRole("button", { name: "an orbit" }).click();
  await expect(page.getByText("tail", { exact: false }).first()).toBeVisible();
  await page.getByLabel("Computational address").fill("/map/eca/90/99");
  await page.getByRole("button", { name: "Resolve" }).click();
  await expect(page.getByText(/HTTP 422 · out_of_range/)).toBeVisible();
});

test("Human ↔ AI-CI demonstration runs end to end against the live site", async ({ page }) => {
  await page.goto("/ai#demonstration");
  await page.getByRole("button", { name: "Run all" }).click();
  await expect(page.getByText(/Identical\. The result is checkable/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/is a research surface\. .* f\(5\) = 136, verified by hash/)).toBeVisible();
});

test("Golden Surface model: drop an op, see op-lost, resync, converge", async ({ page }) => {
  await page.goto("/research/golden-surface#model");
  const status = page.locator("#model [role=status]");
  await expect(status).toContainText("CONVERGED");
  await page.getByRole("button", { name: "desync: drop next op" }).click();
  await page.getByRole("button", { name: "newtab" }).click();
  await expect(status).toContainText("OUT OF SYNC WITH THE TWIN");
  await expect(status).toContainText("op-lost");
  await page.getByRole("button", { name: "Resync (replay)" }).click();
  await page.getByRole("button", { name: "deliver next" }).click();
  await expect(status).toContainText("CONVERGED");
});

const FIXTURE = readFileSync("tests/fixtures/claude-2026-10-08.url", "utf8").trim(); // tests run from the repository root

test("Bring your Pearl: paste the reported Claude link inside prose, inspect, keep, find it in My Pearls", async ({ page }) => {
  await page.goto("/how");
  await page.getByLabel("Bring your Pearl").fill(`**Your link, composed by me:**\n\n${FIXTURE}\n\nSources: [llms.txt](https://aanebed.vercel.app/llms.txt)`);
  await page.getByRole("button", { name: "Inspect Pearl" }).click();
  await expect(page.getByText("Valid Pearl", { exact: true })).toBeVisible();
  await expect(page.locator("#bring").getByText("Continuity Pearl", { exact: true })).toBeVisible();
  await expect(page.locator("#bring").getByText("7abeebi").first()).toBeVisible();
  await expect(page.locator("#bring").getByText(/^p_[0-9a-z]{16}$/)).toBeVisible();
  await page.getByRole("button", { name: "Keep in My Pearls" }).first().click();
  await expect(page.getByText("✓ In My Pearls").first()).toBeVisible();
  await page.goto("/workspace");
  await expect(page.getByRole("button", { name: /Abed & Claude, 2am/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Tasks · 2/ })).toBeVisible();
});

test("Bring your Pearl: clear states for external, unavailable and malformed input; nothing is fetched", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("/how");
  const field = page.getByLabel("Bring your Pearl");
  const inspect = page.getByRole("button", { name: "Inspect Pearl" });
  await field.fill("https://example.org/e?title=x"); await inspect.click();
  await expect(page.getByText("External URL")).toBeVisible();
  await field.fill("https://aanebed.vercel.app/p/p_0123456789abcdef"); await inspect.click();
  await expect(page.getByText("Unavailable", { exact: true })).toBeVisible();
  await field.fill("hello there"); await inspect.click();
  await expect(page.getByText("Malformed")).toBeVisible();
  expect(requests.filter((u) => u.includes("example.org"))).toEqual([]);
});

test("a portable /p/ link reopens the same Pearl, verified against its id", async ({ page }) => {
  await page.goto("/how");
  await page.getByLabel("Bring your Pearl").fill(FIXTURE);
  await page.getByRole("button", { name: "Inspect Pearl" }).click();
  const id = (await page.locator("#bring").getByText(/^p_[0-9a-z]{16}$/).textContent())!;
  await page.getByRole("link", { name: "Open Pearl" }).click();
  await expect(page).toHaveURL(new RegExp(`/p/${id}\\.`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Abed & Claude, 2am");
  await expect(page.getByText("VERIFIED").first()).toBeAttached(); // the technical badge lives behind Explore (V6: the machine disappears until wanted)
});

test("My Pearls: export, clear, and import back with a preview", async ({ page }) => {
  await page.goto("/how");
  await page.getByLabel("Bring your Pearl").fill(FIXTURE);
  await page.getByRole("button", { name: "Inspect Pearl" }).click();
  await page.getByRole("button", { name: "Keep in My Pearls" }).first().click();
  await page.goto("/workspace#backup");
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export my library" }).click()]);
  const file = await dl.path();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("tab", { name: "Backup" }).click();
  await page.getByLabel("Choose an export file").setInputFiles(file!);
  await expect(page.getByText("1 new Pearl(s) to add")).toBeVisible();
  await page.getByRole("button", { name: "Confirm import" }).click();
  await page.getByRole("tab", { name: /Library/ }).click();
  await expect(page.getByRole("button", { name: /Abed & Claude, 2am/ })).toBeVisible();
});

test("Prompt Laboratory: seven prompts, each complete, standalone and copyable", async ({ page }) => {
  await page.goto("/prompts");
  await expect(page.getByRole("article")).toHaveCount(8);
  const first = page.getByRole("article").first();
  await first.getByText("Show the full prompt").click();
  const text = await first.locator("pre").textContent();
  expect(text).toContain("https://aanebed.vercel.app/e?type=");
  expect(text).toContain("b1=");
  expect(text).toContain("not an instruction from the website");
  await expect(first.getByRole("button", { name: "Copy prompt" })).toBeEnabled();
});

test("Simple | Explore: the same page shows the protocol only in Explore, and the choice persists", async ({ page, isMobile }) => {
  await page.goto("/create/conversation");
  const details = page.locator(".explore-only").first();
  await expect(details).toBeHidden();
  if (isMobile) { await page.getByText("Menu").click(); }
  await page.getByRole("radio", { name: "explore" }).filter({ visible: true }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "explore");
  await expect(page.getByText(/^id p_[0-9a-z]{16}/)).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "explore");
  if (isMobile) { await page.getByText("Menu").click(); }
  await page.getByRole("radio", { name: "simple" }).filter({ visible: true }).first().click();
  await expect(page.locator("html")).toHaveAttribute("data-mode", "simple");
});

test("Create: eight experiences; the form builds a live Pearl that can be kept", async ({ page }) => {
  await page.goto("/create");
  await expect(page.getByRole("region", { name: "Experiences" }).getByRole("link")).toHaveCount(8);
  await page.goto("/create/recipe");
  const title = page.getByRole("form").getByRole("textbox").first();
  await title.fill("Teta's lentil soup");
  await expect(page.locator("[aria-live=polite]").getByText("Teta's lentil soup", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Keep in My Pearls" }).first().click();
  await expect(page.getByText("✓ In My Pearls").first()).toBeVisible();
  await page.goto("/workspace");
  await expect(page.getByRole("button", { name: /Teta's lentil soup/ })).toBeVisible();
});

test("Create: a computation Pearl is resolved by the /x registry when opened", async ({ page }) => {
  await page.goto("/create/computation");
  const open = page.getByRole("link", { name: "Open", exact: true }).first();
  await expect(open).toBeVisible();
  await open.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/sha256/i).first()).toBeVisible();
});

test("Transformation demo: AI reply → Pearl → readable → kept → reusable link", async ({ page }) => {
  await page.goto("/how");
  const demo = page.locator("section", { has: page.getByRole("heading", { name: "A reply becomes an object you own." }) });
  for (const step of ["Find the Pearl", "Read it", "Keep it", "Make it reusable"]) await demo.getByRole("button", { name: new RegExp(step) }).click();
  await expect(demo.getByText("✓ Kept in My Pearls, in this browser.")).toBeVisible();
  await expect(demo.getByRole("button", { name: "Copy Pearl link" })).toBeVisible();
  const href = await demo.getByRole("link", { name: "Open it" }).getAttribute("href");
  expect(href).toMatch(/^\/(p\/p_|e\?)/);
});

test("Spaces: create, rename, keep a Pearl in it, compose a collection, delete moves contents to Archive", async ({ page }) => {
  await page.goto("/how");
  await page.getByLabel("Bring your Pearl").fill(FIXTURE);
  await page.getByRole("button", { name: "Inspect Pearl" }).click();
  await page.getByRole("button", { name: "Keep in My Pearls" }).first().click();
  await page.goto("/spaces");
  await page.getByRole("button", { name: "+ Cooking" }).click();
  await expect(page.getByRole("status")).toContainText("Cooking");
  await page.getByRole("button", { name: /^Cooking/ }).click();
  await expect(page.getByRole("heading", { name: "Cooking" })).toBeVisible();
  await page.getByText(/Add Pearls from other spaces/).click();
  await page.getByRole("button", { name: "Move here" }).first().click();
  await expect(page.getByRole("list", { name: "Pearls in Cooking" }).getByRole("listitem")).toHaveCount(1);
  await page.getByRole("button", { name: "Make a collection Pearl" }).click();
  await expect(page.getByText("✓ 1 of 1 Pearl(s) included.")).toBeVisible();
  const href = await page.getByRole("link", { name: "Open it" }).getAttribute("href");
  await page.getByRole("button", { name: "Rename" }).click();
  await page.getByLabel("Space name").fill("Kitchen");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "Kitchen" })).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("button", { name: "Delete space" }).click();
  await expect(page.getByRole("status")).toContainText("1 item(s) moved to Archive");
  await page.goto(href!);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cooking") // the collection was composed before the rename; a Pearl never changes;
  await expect(page.getByLabel("Content").getByRole("link", { name: "Abed & Claude, 2am" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Objects this Pearl leads to" }).getByRole("link", { name: "Abed & Claude, 2am" })).toBeVisible();
});

test("Capabilities: the page lists exactly the registry, and a listed operation runs", async ({ page, request }) => {
  const reg = await (await request.get("/capabilities.json")).json();
  await page.goto("/capabilities");
  for (const c of reg.capabilities) await expect(page.getByRole("heading", { name: new RegExp(c.id.replace(".", "\\.")) })).toBeVisible();
  const h = await (await request.get("/api/v1/hash?text=hello")).json();
  expect(h.sha256).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  expect(reg.engines.find((e: { id: string }) => e.id === "julia").status).toBe("not available");
});

// ------------------------------------------------------------------ Pearls v2: living objects

test("v2 design test: discover it is programmable, make it change, see the address change, fork it, carry it", async ({ page, isMobile }) => {
  await page.goto("/how");
  // 30 s: the object says what it can do
  await expect(page.getByRole("button", { name: /What can it do\?/ }).first()).toBeVisible();
  // 60 s: make it change — the URL changes with it
  await page.getByRole("link", { name: /^NEXT/ }).first().click();
  await expect(page).toHaveURL(/#\/map\/eca\/90\/8\/state\/5\/next$/);
  await expect(page.getByText("Rule 90 · state 136").first()).toBeVisible();
  await expect(page.getByText("the address changed").first()).toBeVisible();
  // 90 s: the change is an address/state transition
  await page.getByRole("tab", { name: "Substrate" }).first().click();
  await expect(page.getByText("state.next").first()).toBeVisible();
  // 2 min: fork it into a Pearl of your own
  await page.getByRole("tab", { name: "Surface" }).first().click();
  await page.getByRole("button", { name: /^FORK/ }).first().click();
  await expect(page).toHaveURL(/\/p\/p_[0-9a-z]{16}\./);
  await expect(page.getByRole("link", { name: /forked from/ })).toBeVisible();
  // 3 min: carry it to another AI
  await page.getByRole("button", { name: "Copy for AI" }).click();
  await expect(page.getByRole("status").filter({ hasText: /your AI|Could not copy/ })).toBeVisible();
  void isMobile;
});

test("/live: keyboard commands navigate a programmable state space; BACK and the browser's back work", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard journey on desktop");
  await page.goto("/live/map/eca/90/8/state/5");
  await page.keyboard.press("n");
  await expect(page).toHaveURL(/\/live\/map\/eca\/90\/8\/state\/5\/next$/);
  await expect(page.getByText("Rule 90 · state 136").first()).toBeVisible();
  await page.keyboard.press("x"); // PERTURB has options: the palette opens, filtered
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/next\/flip\/1$/);
  await page.keyboard.press("b");
  await expect(page).toHaveURL(/\/state\/5\/next$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/flip\/1$/);
  await page.keyboard.press("v");
  await expect(page.getByText("✓ identical: the same resolver, run twice, agrees")).toBeVisible();
  await expect(page.getByText("cannot be established").first()).toBeVisible();
});

test("/live: illegal moves are absent; a map offers states, not NEXT; the palette is the affordance map", async ({ page }) => {
  await page.goto("/live/map/eca/90/8");
  await expect(page.getByRole("link", { name: /^NEXT/ })).toHaveCount(0);
  await page.getByRole("button", { name: /What can it do\?/ }).click();
  const list = page.getByRole("listbox", { name: "Commands" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("option", { name: /^› ?NEXT|^NEXT/ })).toHaveCount(0);
  await expect(list.getByRole("option", { name: /^OPEN state 1 ·/ })).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const r = await page.goto("/live/map/eca/90/8/state/999");
  expect(r?.status()).toBe(200);
  await expect(page.getByText(/out_of_range/)).toBeVisible();
});

test("/live without JavaScript: every command is a real link", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/live/map/eca/90/8/state/5");
  await page.getByRole("link", { name: /^NEXT/ }).click();
  await expect(page).toHaveURL(/\/state\/5\/next$/);
  await expect(page.getByText("Rule 90 · state 136").first()).toBeVisible();
  await ctx.close();
});

test("Living Pearl: VERIFY, REMIX (original unchanged), COMPARE; shortcuts ignore text fields", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop keyboard journey");
  await page.goto(LIVING);
  const original = page.url();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A walk through Rule 90");
  await expect(page.getByRole("list", { name: "What would you like to do?" }).getByRole("link")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: /It leads to \d+ other objects/ })).toBeVisible();
  await page.keyboard.press("v");
  await expect(page.getByText(/✓ recomputed here: p_/)).toBeVisible();
  await expect(page.getByText("asserted").first()).toBeVisible();
  await page.keyboard.press("1");
  await page.keyboard.press("r");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Blocks").press("End");
  await dialog.getByLabel("Blocks").pressSequentially("\nnote:my remix", { delay: 5 }); // typing "n", "r"… must not trigger commands
  await expect(dialog.getByText("1 added")).toBeVisible();
  await dialog.getByRole("button", { name: "Make the remix" }).click();
  await expect(page).toHaveURL(/\/p\/p_/);
  await expect(page.getByRole("link", { name: /forked from/ })).toBeVisible();
  const remix = page.url();
  // the original link still renders exactly the original
  await page.goto(original);
  await expect(page.getByText("my remix")).toHaveCount(0);
  await page.goto(`/compare?a=${encodeURIComponent(original.replace(/^https?:\/\/[^/]+/, ""))}&b=${encodeURIComponent(remix.replace(/^https?:\/\/[^/]+/, ""))}`);
  await expect(page.getByText("B is derived from A.")).toBeVisible();
  await expect(page.getByText("1 added")).toBeVisible();
});

test("Play: the Seven Verbs walk IDLE → BUILT; the shared surface refuses credentials and offers only legal moves", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("button", { name: /^START/ }).click();
  await page.getByRole("button", { name: /^SWITCH/ }).click();
  await expect(page.getByText(/the URL changed under the session/)).toBeVisible();
  await page.getByRole("button", { name: "WRITE" }).click();
  await page.getByRole("button", { name: "COMMIT the draft" }).click();
  await page.getByRole("button", { name: "BUILD" }).click();
  await expect(page.getByRole("link", { name: /open the Pearl p_/ })).toBeVisible();
  await page.getByRole("radio", { name: "ر Muse" }).click();
  const moves = page.locator("section", { has: page.getByRole("heading", { name: /Participant → surface/ }) });
  await expect(moves.getByRole("button", { name: "closetab t1" })).toHaveCount(0); // not its tab: not offered
  await moves.getByRole("button", { name: "newtab: open a tab you own" }).click();
  await moves.getByLabel(/Text for/).fill("my password is hunter2");
  await moves.getByRole("button", { name: "type a note in t2" }).click();
  await expect(moves.getByText(/REFUSED · refused: that looks like a credential/)).toBeVisible();
  await expect(moves.getByText(/^CONVERGED/)).toBeVisible();
});

test("machine surface: /e.json carries the same living record; /capabilities.json lists the commands", async ({ request }) => {
  const e = await (await request.get("/e.json" + LIVING.slice(2))).json();
  expect(e.living.format).toBe("living/1");
  expect(e.living.affordances.map((a: { command: string }) => a.command)).toContain("fork");
  const caps = await (await request.get("/capabilities.json")).json();
  expect(caps.commands.list.map((c: { id: string }) => c.id)).toEqual(expect.arrayContaining(["next", "perturb", "fork", "remix", "compare", "verify"]));
  for (const id of ["pearl.fork", "pearl.diff", "living.describe"]) expect(caps.capabilities.map((c: { id: string }) => c.id)).toContain(id);
  const l = await (await request.get("/api/v1/living?u=/live/map/eca/90/8/state/5")).json();
  expect(l.record.affordances.find((a: { command: string }) => a.command === "next").href).toBe("/map/eca/90/8/state/5/next");
});

// ------------------------------------------------------------------ V6: the human surface

test("V6 stranger: touch it, it changes, the URL changes, copy it for an AI — no account anywhere", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Come here.");
  await expect(page.getByText("Here. Touch this.")).toBeVisible();
  await page.getByRole("button", { name: /^light 2,/ }).click();
  await expect(page).toHaveURL(/#\/map\/eca\/90\/8\/state\/5\/flip\/1$/);
  await expect(page.getByText("the address changed when the world did")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/flip\/1\/next$/);
  await page.getByRole("button", { name: "Copy for AI" }).first().click();
  await expect(page.getByRole("status").filter({ hasText: /Copied for your AI|Couldn't copy/ })).toBeVisible();
  await expect(page.getByText(/sign up|create an account|log in|verify your email/i)).toHaveCount(0);
});

test("V6 multi-AI: a game passes from you to AI one to AI two and back; lineage stays in the URL; names are marked self-declared", async ({ page }) => {
  await page.goto("/g/ttt");
  await page.getByRole("link", { name: "cell 4: empty, play here" }).click();
  await expect(page).toHaveURL(/\/g\/ttt\/4~you$/);
  // AI one replies in prose; we bring its link back
  await page.getByRole("textbox", { name: "Bring it back" }).fill("I'll take the corner. https://aanebed.vercel.app/g/ttt/4~you/0~claude");
  await page.getByRole("button", { name: "Open what it made" }).click();
  await expect(page).toHaveURL(/\/g\/ttt\/4~you\/0~claude$/);
  await page.getByRole("link", { name: "cell 8: empty, play here" }).click();
  await page.getByRole("textbox", { name: "Bring it back" }).fill("Move: https://aanebed.vercel.app/g/ttt/4~you/0~claude/8~you/2~gpt — blocking the diagonal.");
  await page.getByRole("button", { name: "Open what it made" }).click();
  await expect(page).toHaveURL(/\/0~claude\/8~you\/2~gpt$/);
  const path = page.getByRole("list", { name: /How this game got here/ });
  await expect(path.getByRole("link")).toHaveCount(5);
  await expect(page.getByText(/claude, gpt: what each move says about who made it/)).toBeVisible();
  // the garden remembers, in this browser
  await page.goto("/garden");
  await expect(page.getByText(/AIs that joined, by the names they gave: claude, gpt/)).toBeVisible();
  await expect(page.getByText("This garden lives in this browser.")).toBeVisible();
});

test("V6: a reply with no link from this world is refused kindly; an illegal game move explains itself", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Bring it back" }).fill("Sorry, I can't browse. Try https://example.org/g/ttt/4");
  await page.getByRole("button", { name: "Open what it made" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No link from this world" })).toBeVisible();
  await page.goto("/g/ttt/4/4");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("That move couldn't happen.");
  await page.getByRole("link", { name: "Go back to the last good move" }).click();
  await expect(page).toHaveURL(/\/g\/ttt\/4$/);
});

test("V6: make something, the loom and the clock change by URL, and a report becomes a Pearl", async ({ page }) => {
  await page.goto("/#make");
  await page.getByLabel("What should we make?").fill("a riddle with three doors");
  await page.getByRole("button", { name: "Copy for my AI" }).click();
  await expect(page.getByRole("status").filter({ hasText: /Copied for your AI|Couldn't copy/ })).toBeVisible();
  await page.goto("/loom");
  await page.getByRole("link", { name: "Change something" }).click();
  await expect(page).toHaveURL(/\/loom\/110\/16\/257$/);
  await page.getByRole("link", { name: "Try another rule" }).click();
  await expect(page).toHaveURL(/\/loom\/150\/16\/257$/);
  await page.goto("/report?from=/g/ttt");
  await page.getByLabel("What happened?").fill("The board didn't update after my move");
  await page.getByRole("button", { name: "Make it a Pearl" }).click();
  await page.getByRole("link", { name: "Open the report" }).click();
  await expect(page).toHaveURL(/\/p\/p_/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Report: The board didn't update");
});

test("V6 machine surface: an AI can read the game, its legal moves and the substrate's honest status", async ({ request }) => {
  const g = await (await request.get("/api/v1/game/ttt/4~you/0~claude")).json();
  expect(g.board).toBe("O---X----");
  expect(g.turn).toBe("X");
  expect(g.legal_moves).toHaveLength(7);
  expect(g.moves[1].who_status).toMatch(/self-declared/);
  expect((await request.get("/api/v1/game/ttt/4/4")).status()).toBe(422);
  const s = await (await request.get("/api/substrate/status")).json();
  expect(s.kind).toBe("not_configured");
  expect(JSON.stringify(s)).not.toMatch(/129\.213|8477/);
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("If a person gave you a Pearl link (V6)");
});
