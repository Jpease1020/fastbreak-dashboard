import { defineConfig, devices } from "@playwright/test";

const PORT = 3007;
const baseURL = `http://127.0.0.1:${PORT}`;
const E2E_SECRET = "fastbreak-e2e-secret";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: `FASTBREAK_E2E_MOCK=1 E2E_SECRET=${E2E_SECRET} npm run dev -- --hostname 127.0.0.1 --port ${PORT}`,
    url: `${baseURL}/login`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
