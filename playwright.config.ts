import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const executablePath = process.env.PW_CHROMIUM ?? undefined;

export default defineConfig({
  testDir: "tests/browser",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"], ["json", { outputFile: "test-results/browser-results.json" }]],
  use: { baseURL: process.env.BASE_URL ?? `http://localhost:${PORT}`, launchOptions: { executablePath } },
  webServer: process.env.NO_SERVER ? undefined : { command: `npx next start -p ${PORT}`, port: PORT, reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
