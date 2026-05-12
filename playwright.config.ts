import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const storageStatePath = process.env.OPUSCLIP_STORAGE_STATE_PATH ?? "./playwright/.auth/opusclip.json";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: process.env.OPUSCLIP_BASE_URL ?? "https://www.opus.pro",
    browserName: "chromium",
    screenshot: {
      mode: "only-on-failure",
      fullPage: true,
    },
    trace: "retain-on-failure",
    ...(existsSync(storageStatePath) ? { storageState: storageStatePath } : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
