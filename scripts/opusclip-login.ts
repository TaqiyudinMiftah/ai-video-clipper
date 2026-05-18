import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { getOpusClipConfig } from "../src/lib/opusclip/config";

type LoginBrowser = {
  browser?: Browser | null;
  context: BrowserContext;
  page: Page;
};

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

async function checkLoggedIn(page: Page, appUrl: string) {
  await page.goto(appUrl, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => undefined);
  await waitForUrlToSettle(page);

  const currentUrl = page.url();
  const isAuthRoute = /\/auth\/|\/login|signin|sign-in/i.test(currentUrl);
  const hasLoginPrompt = await hasVisibleLoginPrompt(page);

  return {
    ok: !isAuthRoute && !hasLoginPrompt,
    currentUrl,
  };
}

async function openLoginBrowser(): Promise<LoginBrowser> {
  const config = getOpusClipConfig();

  if (config.usePersistentContext) {
    await mkdir(config.userDataDir, { recursive: true });
    const context = await chromium.launchPersistentContext(config.userDataDir, {
      acceptDownloads: true,
      headless: false,
    });
    const page = context.pages()[0] ?? (await context.newPage());

    return {
      browser: context.browser(),
      context,
      page,
    };
  }

  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext({
    acceptDownloads: true,
  });
  const page = await context.newPage();

  return {
    browser,
    context,
    page,
  };
}

async function closeLoginBrowser({ browser, context }: LoginBrowser) {
  await context.close().catch(() => undefined);
  await browser?.close().catch(() => undefined);
}

async function saveStorageState(context: BrowserContext, storageStatePath: string) {
  await mkdir(dirname(storageStatePath), { recursive: true });
  await context.storageState({
    path: storageStatePath,
    indexedDB: true,
  });
}

async function verifySavedSession() {
  const config = getOpusClipConfig();

  if (config.usePersistentContext) {
    const context = await chromium.launchPersistentContext(config.userDataDir, {
      headless: false,
    });
    const page = context.pages()[0] ?? (await context.newPage());
    const check = await checkLoggedIn(page, config.appUrl);
    await context.close();
    return check;
  }

  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext({
    storageState: config.storageStatePath,
  });
  const page = await context.newPage();
  const check = await checkLoggedIn(page, config.appUrl);

  await context.close();
  await browser.close();

  return check;
}

async function main() {
  const config = getOpusClipConfig();
  await mkdir(dirname(config.storageStatePath), { recursive: true });

  const loginBrowser = await openLoginBrowser();
  const { context, page } = loginBrowser;

  console.log("Opening OpusClip login page for a manual, user-owned session.");
  console.log("Do not bypass CAPTCHA, rate limits, or security prompts. Complete only the normal login flow.");
  console.log(`Session mode: ${config.usePersistentContext ? "persistent browser profile" : "storageState JSON"}`);
  console.log(`Session will be saved to: ${config.usePersistentContext ? config.userDataDir : config.storageStatePath}`);

  await page.goto(config.loginUrl, {
    waitUntil: "domcontentloaded",
  });

  const rl = createInterface({ input, output });

  while (true) {
    await rl.question("After you finish logging in normally and can see the OpusClip dashboard, press Enter here to verify the session...");
    const check = await checkLoggedIn(page, config.appUrl);

    if (!check.ok) {
      console.log(`The session still looks unauthenticated. Current URL: ${check.currentUrl}`);
      console.log("Please finish the normal login/signup flow in the browser. Do not press Enter until the dashboard is visible.");
      const answer = await rl.question("Press Enter to check again, or type q then Enter to quit without saving...");

      if (answer.trim().toLowerCase() === "q") {
        rl.close();
        await closeLoginBrowser(loginBrowser);
        console.log("OpusClip session was not saved.");
        return;
      }

      continue;
    }

    await saveStorageState(context, config.storageStatePath);
    await closeLoginBrowser(loginBrowser);

    const freshCheck = await verifySavedSession();

    if (freshCheck.ok) {
      rl.close();
      console.log(`Saved OpusClip session successfully. Verified URL: ${freshCheck.currentUrl}`);
      return;
    }

    console.log(`The session looked logged in, but it was not reusable in a fresh browser. Current URL: ${freshCheck.currentUrl}`);

    if (!config.usePersistentContext) {
      console.log("Set OPUSCLIP_USE_PERSISTENT_CONTEXT=true in .env, then run npm run opusclip:login again.");
    }

    rl.close();
    process.exitCode = 1;
    return;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
