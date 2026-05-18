import "dotenv/config";
import { existsSync } from "node:fs";
import { chromium, type Page } from "playwright";
import { getOpusClipConfig } from "../src/lib/opusclip/config";

async function hasVisibleLoginPrompt(page: Page) {
  try {
    await page
      .getByText(/continue with google|continue with apple|continue with email|finish signing up|sign in|log in/i)
      .first()
      .waitFor({
        state: "visible",
        timeout: 2_000,
      });
    return true;
  } catch {
    return false;
  }
}

async function waitForUrlToSettle(page: Page) {
  let previousUrl = page.url();

  for (let index = 0; index < 4; index += 1) {
    await page.waitForTimeout(2_500);
    const currentUrl = page.url();

    if (currentUrl === previousUrl) {
      continue;
    }

    previousUrl = currentUrl;
  }
}

async function main() {
  const config = getOpusClipConfig();
  const sessionTarget = config.usePersistentContext ? config.userDataDir : config.storageStatePath;

  if (!existsSync(sessionTarget)) {
    console.log(`TODO OpusClip Session: missing session at ${sessionTarget}`);
    process.exitCode = 1;
    return;
  }

  const context = config.usePersistentContext
    ? await chromium.launchPersistentContext(config.userDataDir, {
        headless: config.headless,
      })
    : await chromium
        .launch({
          headless: config.headless,
        })
        .then((browser) =>
          browser.newContext({
            storageState: config.storageStatePath,
          }),
        );
  const page = context.pages()[0] ?? (await context.newPage());

  await page.goto(config.appUrl, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
  await waitForUrlToSettle(page);

  const currentUrl = page.url();
  const isAuthRoute = /\/auth\/|\/login|signin|sign-in/i.test(currentUrl);
  const hasLoginPrompt = await hasVisibleLoginPrompt(page);
  const browser = context.browser();

  await context.close();
  await browser?.close().catch(() => undefined);

  if (isAuthRoute || hasLoginPrompt) {
    console.log(`TODO OpusClip Session: saved session is not logged in. Current URL: ${currentUrl}`);
    console.log(
      config.usePersistentContext
        ? "Run npm run opusclip:login and save only after the real dashboard is visible."
        : "Set OPUSCLIP_USE_PERSISTENT_CONTEXT=true in .env, then run npm run opusclip:login again.",
    );
    process.exitCode = 1;
    return;
  }

  console.log(`OK OpusClip Session: saved session opens the dashboard. Current URL: ${currentUrl}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
