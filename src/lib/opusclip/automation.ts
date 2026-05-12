import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { saveOpusClipFailureArtifact } from "@/lib/opusclip/artifacts";
import { getOpusClipConfig, hasSavedOpusClipSession } from "@/lib/opusclip/config";
import { opusClipSelectors } from "@/lib/opusclip/selectors";
import type {
  DownloadedOpusClip,
  OpusClipAutomationInput,
  OpusClipAutomationResult,
  OpusClipAutomationSession,
  OpusClipGeneratedClip,
  OpusClipSource,
} from "@/lib/opusclip/types";

export async function openOpusClip(): Promise<OpusClipAutomationSession> {
  const config = getOpusClipConfig();
  const browser = await chromium.launch({
    headless: config.headless,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    ...(hasSavedOpusClipSession(config) ? { storageState: config.storageStatePath } : {}),
  });

  const page = await context.newPage();
  await page.goto(config.appUrl, {
    waitUntil: "domcontentloaded",
  });

  return {
    browser,
    context,
    page,
  };
}

export async function submitVideoToOpusClip(page: Page, source: OpusClipSource) {
  await page.bringToFront();

  if (process.env.OPUSCLIP_REQUIRE_SAVED_SESSION === "true" && !existsSync(getOpusClipConfig().storageStatePath)) {
    throw new Error("Missing OpusClip storageState. Run npm run opusclip:login before starting the worker.");
  }

  if (!source.sourceUrl && !source.sourceStoragePath) {
    throw new Error("No source URL or source storage path was provided for OpusClip submission.");
  }

  if (process.env.OPUSCLIP_ENABLE_REAL_SUBMIT === "true") {
    throw new Error(
      `Real OpusClip submit selectors are not implemented yet. Fill selectors in src/lib/opusclip/selectors.ts before enabling real submit. First TODO selector: ${opusClipSelectors.submitButton}`,
    );
  }

  return {
    submitted: false,
    reason: "Placeholder only. Real OpusClip submit selectors are TODO.",
  };
}

export async function waitForProcessingComplete(page: Page) {
  await page.waitForLoadState("domcontentloaded");

  if (process.env.OPUSCLIP_ENABLE_REAL_WAIT === "true") {
    throw new Error(
      `Real OpusClip completion selector is not implemented yet: ${opusClipSelectors.processingCompleteIndicator}`,
    );
  }

  const waitMs = Number(process.env.OPUSCLIP_PLACEHOLDER_WAIT_MS ?? "1000");
  await page.waitForTimeout(Number.isFinite(waitMs) && waitMs >= 0 ? waitMs : 1000);

  return {
    completed: true,
    simulated: true,
  };
}

export async function listGeneratedClips(_page: Page): Promise<OpusClipGeneratedClip[]> {
  if (process.env.OPUSCLIP_ENABLE_REAL_LIST === "true") {
    throw new Error(`Real generated clip selector is not implemented yet: ${opusClipSelectors.generatedClipCard}`);
  }

  return [];
}

export async function downloadClip(page: Page, clip: OpusClipGeneratedClip): Promise<DownloadedOpusClip> {
  if (process.env.OPUSCLIP_ENABLE_REAL_DOWNLOAD !== "true") {
    throw new Error("downloadClip is a placeholder. Enable only after real OpusClip download selectors are implemented.");
  }

  const config = getOpusClipConfig();
  await mkdir(config.downloadsDir, { recursive: true });

  const downloadPromise = page.waitForEvent("download");
  await page.locator(opusClipSelectors.clipDownloadButton).click();
  const download = await downloadPromise;
  const filePath = join(config.downloadsDir, download.suggestedFilename());
  await download.saveAs(filePath);

  return {
    clip,
    filePath,
  };
}

export async function runOpusClipAutomation(input: OpusClipAutomationInput): Promise<OpusClipAutomationResult> {
  let session: OpusClipAutomationSession | undefined;

  try {
    session = await openOpusClip();
    await submitVideoToOpusClip(session.page, input);
    await waitForProcessingComplete(session.page);
    const clips = await listGeneratedClips(session.page);
    const downloadedClips: DownloadedOpusClip[] = [];

    for (const clip of clips) {
      downloadedClips.push(await downloadClip(session.page, clip));
    }

    return {
      clips,
      downloadedClips,
      simulated: true,
    };
  } catch (error) {
    const artifact = await saveOpusClipFailureArtifact({
      page: session?.page,
      userId: input.userId,
      videoId: input.videoId,
      jobId: input.jobId,
      error,
    });

    const enrichedError = new Error(artifact.errorMessage);
    enrichedError.cause = artifact;
    throw enrichedError;
  } finally {
    await session?.context.close().catch(() => undefined);
    await session?.browser.close().catch(() => undefined);
  }
}
