import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { chromium } from "playwright";
import { getOpusClipConfig } from "../src/lib/opusclip/config";

async function main() {
  const config = getOpusClipConfig();
  await mkdir(dirname(config.storageStatePath), { recursive: true });

  const browser = await chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Opening OpusClip login page for a manual, user-owned session.");
  console.log("Do not bypass CAPTCHA, rate limits, or security prompts. Complete only the normal login flow.");
  console.log(`Session will be saved to: ${config.storageStatePath}`);

  await page.goto(config.loginUrl, {
    waitUntil: "domcontentloaded",
  });

  const rl = createInterface({ input, output });
  await rl.question("After you finish logging in normally, press Enter here to save the browser session...");
  rl.close();

  await context.storageState({
    path: config.storageStatePath,
  });

  await browser.close();
  console.log(`Saved OpusClip storageState to ${config.storageStatePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
