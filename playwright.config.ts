import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const widths = [360, 768, 1280] as const;
const schemes = ["light", "dark"] as const;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  // Every page is checked at 360, 768 and 1280 wide, in light and dark.
  projects: widths.flatMap((width) =>
    schemes.map((colorScheme) => ({
      name: `${width}-${colorScheme}`,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width, height: 900 },
        colorScheme,
      },
    })),
  ),
  // Tests run against a production build so the real CSP applies.
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
