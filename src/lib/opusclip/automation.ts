import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { chromium, type Locator, type Page } from "playwright";
import { saveOpusClipFailureArtifact } from "@/lib/opusclip/artifacts";
import { isOpusClipApiEnabled, runOpusClipApiProcessing } from "@/lib/opusclip/api";
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
import { getStorageService } from "@/lib/storage";

type LocatorScope = Page | Locator;

type PreparedSource = {
  localFilePath?: string;
  sourceUrl?: string | null;
};

function isEnabled(name: string) {
  return process.env[name] === "true";
}

function isConfiguredSelector(selector: string | undefined) {
  return Boolean(selector?.trim());
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getSourceExtension(sourceStoragePath: string) {
  const extension = extname(sourceStoragePath).toLowerCase();
  return [".mp4", ".mov", ".webm"].includes(extension) ? extension : ".mp4";
}

function makeLocator(scope: LocatorScope, selector: string) {
  return scope.locator(selector).first();
}

async function firstVisibleLocator(candidates: Locator[], timeoutMs: number) {
  for (const candidate of candidates) {
    try {
      await candidate.waitFor({
        state: "visible",
        timeout: timeoutMs,
      });
      return candidate;
    } catch {
      // Try the next fallback selector.
    }
  }

  return null;
}

async function clickFirstVisible(candidates: Locator[], timeoutMs: number) {
  const locator = await firstVisibleLocator(candidates, timeoutMs);

  if (!locator) {
    return false;
  }

  await locator.click({
    timeout: timeoutMs,
  });
  return true;
}

async function safeText(locator: Locator) {
  try {
    const text = await locator.innerText({
      timeout: 1_000,
    });
    return text.trim() || null;
  } catch {
    return null;
  }
}

function newProjectLocators(page: Page) {
  return [
    ...(isConfiguredSelector(opusClipSelectors.newProjectButton)
      ? [page.locator(opusClipSelectors.newProjectButton).first()]
      : []),
    page.getByRole("button", { name: /new project|create project|create|import|start/i }).first(),
    page.getByRole("link", { name: /new project|create project|create|import|start/i }).first(),
    page.getByText(/new project|create project|start clipping|get clips/i).first(),
  ];
}

function uploadButtonLocators(page: Page) {
  return [
    ...(isConfiguredSelector(opusClipSelectors.uploadButton) ? [page.locator(opusClipSelectors.uploadButton).first()] : []),
    page.getByRole("button", { name: /upload|choose file|select file|browse|local file|files/i }).first(),
    page.getByRole("link", { name: /upload|choose file|select file|browse|local file|files/i }).first(),
    page.getByText(/upload files|upload file|choose file|select file|browse files|local file/i).first(),
  ];
}

function urlInputLocators(page: Page) {
  return [
    ...(isConfiguredSelector(opusClipSelectors.urlInput) ? [page.locator(opusClipSelectors.urlInput).first()] : []),
    page.getByPlaceholder(/url|link|youtube|video|paste/i).first(),
    page.getByLabel(/url|link|youtube|video/i).first(),
    page.locator('input[type="url"]').first(),
    page.locator('input[placeholder*="http"], textarea[placeholder*="http"]').first(),
    page.locator('input[name*="url"], textarea[name*="url"]').first(),
  ];
}

function submitButtonLocators(page: Page) {
  return [
    ...(isConfiguredSelector(opusClipSelectors.submitButton) ? [page.locator(opusClipSelectors.submitButton).first()] : []),
    page.getByRole("button", { name: /get clips|create clips|generate clips|submit|continue|next|start|import/i }).first(),
    page.getByText(/get clips|create clips|generate clips|submit|continue|next|start|import/i).first(),
  ];
}

function downloadButtonLocators(scope: LocatorScope) {
  return [
    ...(isConfiguredSelector(opusClipSelectors.clipDownloadButton)
      ? [scope.locator(opusClipSelectors.clipDownloadButton).first()]
      : []),
    scope.getByRole("button", { name: /download|export|save/i }).first(),
    scope.getByRole("link", { name: /download|export|save/i }).first(),
    scope.locator('a[href*=".mp4"], a[href*="download"], a[href*="cdn.opus"], a[href*="export"]').first(),
    scope.locator('button:has-text("Download"), button:has-text("Export"), a:has-text("Download"), a:has-text("Export")').first(),
  ];
}

function clipCardLocators(page: Page) {
  return [
    ...(isConfiguredSelector(opusClipSelectors.generatedClipCard)
      ? [page.locator(opusClipSelectors.generatedClipCard)]
      : []),
    page.locator('[data-testid*="clip"]'),
    page.locator('article:has(video)'),
    page.locator('div:has(video)'),
  ];
}

function completionLocators(page: Page) {
  return [
    ...(isConfiguredSelector(opusClipSelectors.processingCompleteIndicator)
      ? [page.locator(opusClipSelectors.processingCompleteIndicator).first()]
      : []),
    page.getByText(/clips? (are )?ready|processing complete|export|download/i).first(),
    page.getByRole("button", { name: /download|export/i }).first(),
    page.getByRole("link", { name: /download|export/i }).first(),
  ];
}

function errorLocators(page: Page) {
  return [
    page.getByText(/upload failed|processing failed|something went wrong|unsupported|try again|error/i).first(),
  ];
}

async function ensureAuthenticated(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1_000);

  const currentUrl = page.url();
  const loginText = await firstVisibleLocator(
    [
      page.getByText(/continue with google|continue with apple|continue with email|finish signing up|sign in|log in/i).first(),
    ],
    1_000,
  );

  if (/\/auth\/|\/login|signin|sign-in/i.test(currentUrl) || loginText) {
    throw new Error(
      `OpusClip session is not logged in. Run npm run opusclip:login, complete normal login manually, save the session, then restart the worker. Current URL: ${currentUrl}`,
    );
  }
}

async function prepareSourceFile(sourceStoragePath: string) {
  const config = getOpusClipConfig();
  const sourceFile = await getStorageService().downloadFile(sourceStoragePath);
  const sourceBytes = Buffer.from(await sourceFile.data.arrayBuffer());
  const sourceDir = join(config.downloadsDir, "sources");
  const localFilePath = join(sourceDir, `${sanitizeFileName(sourceStoragePath)}-${randomUUID()}${getSourceExtension(sourceStoragePath)}`);

  await mkdir(sourceDir, {
    recursive: true,
  });
  await writeFile(localFilePath, sourceBytes);

  return localFilePath;
}

async function prepareSource(source: OpusClipSource): Promise<PreparedSource> {
  if (source.sourceStoragePath) {
    return {
      localFilePath: await prepareSourceFile(source.sourceStoragePath),
      sourceUrl: source.sourceUrl,
    };
  }

  return {
    sourceUrl: source.sourceUrl,
  };
}

async function maybeOpenSubmissionSurface(page: Page) {
  const config = getOpusClipConfig();
  const alreadyHasInput = await firstVisibleLocator(
    [page.locator(opusClipSelectors.fileInput).first(), ...urlInputLocators(page)],
    1_000,
  );

  if (alreadyHasInput) {
    return;
  }

  await clickFirstVisible(newProjectLocators(page), config.selectorTimeoutMs).catch(() => false);
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
}

async function submitLocalFile(page: Page, localFilePath: string) {
  const config = getOpusClipConfig();

  await maybeOpenSubmissionSurface(page);

  const fileInputs = [
    page.locator(opusClipSelectors.fileInput).first(),
    page.locator('input[type="file"]').first(),
    page.locator('input[accept*="video"]').first(),
  ];

  for (const fileInput of fileInputs) {
    try {
      if ((await fileInput.count()) > 0) {
        await fileInput.setInputFiles(localFilePath, {
          timeout: config.selectorTimeoutMs,
        });
        await clickFirstVisible(submitButtonLocators(page), 2_000).catch(() => false);
        return;
      }
    } catch {
      // Continue to the file chooser fallback.
    }
  }

  const fileChooserPromise = page.waitForEvent("filechooser", {
    timeout: config.selectorTimeoutMs,
  }).catch(() => null);
  const clickedUpload = await clickFirstVisible(uploadButtonLocators(page), config.selectorTimeoutMs);

  if (!clickedUpload) {
    throw new Error("Could not find an OpusClip upload button or file input. Set OPUSCLIP_UPLOAD_BUTTON_SELECTOR or OPUSCLIP_FILE_INPUT_SELECTOR.");
  }

  const fileChooser = await fileChooserPromise;

  if (!fileChooser) {
    throw new Error("Clicked an OpusClip upload control, but no file chooser opened. Set OPUSCLIP_FILE_INPUT_SELECTOR or OPUSCLIP_UPLOAD_BUTTON_SELECTOR.");
  }

  await fileChooser.setFiles(localFilePath);
  await clickFirstVisible(submitButtonLocators(page), 2_000).catch(() => false);
}

async function submitSourceUrl(page: Page, sourceUrl: string) {
  const config = getOpusClipConfig();

  await maybeOpenSubmissionSurface(page);
  await clickFirstVisible(
    [
      page.getByRole("button", { name: /url|link|paste/i }).first(),
      page.getByText(/url|link|paste/i).first(),
    ],
    1_500,
  ).catch(() => false);

  const input = await firstVisibleLocator(urlInputLocators(page), config.selectorTimeoutMs);

  if (!input) {
    throw new Error("Could not find an OpusClip URL input. Set OPUSCLIP_URL_INPUT_SELECTOR.");
  }

  await input.fill(sourceUrl, {
    timeout: config.selectorTimeoutMs,
  });

  const clickedSubmit = await clickFirstVisible(submitButtonLocators(page), config.selectorTimeoutMs);

  if (!clickedSubmit) {
    throw new Error("Could not find an OpusClip submit button. Set OPUSCLIP_SUBMIT_BUTTON_SELECTOR.");
  }
}

async function getBestClipCardLocator(page: Page) {
  for (const locator of clipCardLocators(page)) {
    try {
      const count = await locator.count();

      if (count > 0 && count < 100) {
        return locator;
      }
    } catch {
      // Try the next locator candidate.
    }
  }

  return null;
}

async function getDownloadHref(scope: LocatorScope, page: Page) {
  const anchors = scope.locator('a[href*=".mp4"], a[href*="download"], a[href*="cdn.opus"], a[href*="export"]');
  const count = await anchors.count().catch(() => 0);

  for (let index = 0; index < count; index += 1) {
    const href = await anchors.nth(index).getAttribute("href").catch(() => null);

    if (href) {
      return new URL(href, page.url()).toString();
    }
  }

  return null;
}

async function downloadFromHref(page: Page, href: string, clip: OpusClipGeneratedClip): Promise<DownloadedOpusClip> {
  const response = await page.context().request.get(href, {
    timeout: getOpusClipConfig().downloadTimeoutMs,
  });

  if (!response.ok()) {
    throw new Error(`OpusClip clip download link failed (${response.status()} ${response.statusText()}).`);
  }

  return {
    clip,
    data: await response.body(),
    contentType: response.headers()["content-type"] ?? "video/mp4",
    fileName: `${sanitizeFileName(clip.opusclipClipId)}.mp4`,
  };
}

async function clickForDownload(page: Page, locator: Locator, clip: OpusClipGeneratedClip) {
  const config = getOpusClipConfig();
  const downloadPromise = page
    .waitForEvent("download", {
      timeout: config.downloadTimeoutMs,
    })
    .catch(() => null);

  await locator.click({
    timeout: config.selectorTimeoutMs,
  });

  const download = await downloadPromise;

  if (!download) {
    return null;
  }

  await mkdir(config.downloadsDir, {
    recursive: true,
  });

  const filePath = join(config.downloadsDir, `${randomUUID()}-${download.suggestedFilename()}`);
  await download.saveAs(filePath);

  return {
    clip,
    filePath,
    fileName: download.suggestedFilename(),
  } satisfies DownloadedOpusClip;
}

export async function openOpusClip(): Promise<OpusClipAutomationSession> {
  const config = getOpusClipConfig();

  if (config.usePersistentContext) {
    const context = await chromium.launchPersistentContext(config.userDataDir, {
      acceptDownloads: true,
      headless: config.headless,
    });
    const page = context.pages()[0] ?? (await context.newPage());

    await page.goto(config.appUrl, {
      waitUntil: "domcontentloaded",
    });

    return {
      browser: context.browser(),
      context,
      page,
    };
  }

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

  if (isEnabled("OPUSCLIP_ENABLE_REAL_SUBMIT") && !existsSync(getOpusClipConfig().storageStatePath)) {
    throw new Error("Missing OpusClip storageState. Run npm run opusclip:login before starting the worker.");
  }

  if (!source.sourceUrl && !source.sourceStoragePath) {
    throw new Error("No source URL or source storage path was provided for OpusClip submission.");
  }

  if (!isEnabled("OPUSCLIP_ENABLE_REAL_SUBMIT")) {
    return {
      submitted: false,
      reason: "Placeholder only. Set OPUSCLIP_ENABLE_REAL_SUBMIT=true to use Playwright submission.",
    };
  }

  await ensureAuthenticated(page);

  const preparedSource = await prepareSource(source);

  if (preparedSource.localFilePath) {
    await submitLocalFile(page, preparedSource.localFilePath);
  } else if (preparedSource.sourceUrl) {
    await submitSourceUrl(page, preparedSource.sourceUrl);
  }

  await page.waitForLoadState("domcontentloaded").catch(() => undefined);

  return {
    submitted: true,
    localFilePath: preparedSource.localFilePath,
    sourceUrl: preparedSource.sourceUrl,
  };
}

export async function waitForProcessingComplete(page: Page) {
  await page.waitForLoadState("domcontentloaded");

  if (!isEnabled("OPUSCLIP_ENABLE_REAL_WAIT")) {
    const waitMs = Number(process.env.OPUSCLIP_PLACEHOLDER_WAIT_MS ?? "1000");
    await page.waitForTimeout(Number.isFinite(waitMs) && waitMs >= 0 ? waitMs : 1000);

    return {
      completed: true,
      simulated: true,
    };
  }

  const config = getOpusClipConfig();
  const deadline = Date.now() + config.processingTimeoutMs;

  while (Date.now() < deadline) {
    await ensureAuthenticated(page);

    const errorIndicator = await firstVisibleLocator(errorLocators(page), 750);

    if (errorIndicator) {
      throw new Error(`OpusClip showed an error while processing: ${(await safeText(errorIndicator)) ?? "Unknown page error"}`);
    }

    const cardLocator = await getBestClipCardLocator(page);
    const clipCount = cardLocator ? await cardLocator.count().catch(() => 0) : 0;
    const completeIndicator = await firstVisibleLocator(completionLocators(page), 750);

    if (clipCount > 0 && completeIndicator) {
      return {
        completed: true,
        simulated: false,
        clipCount,
      };
    }

    await page.waitForTimeout(config.processingPollMs);
  }

  throw new Error(`Timed out waiting for OpusClip processing after ${Math.round(config.processingTimeoutMs / 1000)} seconds.`);
}

export async function listGeneratedClips(page: Page): Promise<OpusClipGeneratedClip[]> {
  if (!isEnabled("OPUSCLIP_ENABLE_REAL_LIST")) {
    return [];
  }

  const cardLocator = await getBestClipCardLocator(page);

  if (cardLocator) {
    const count = Math.min(await cardLocator.count(), 50);
    const clips: OpusClipGeneratedClip[] = [];

    for (let index = 0; index < count; index += 1) {
      const card = cardLocator.nth(index);
      const title =
        (await safeText(card.locator("h1, h2, h3, [data-testid*='title']").first())) ??
        (await safeText(card.locator("textarea, input").first()));

      clips.push({
        opusclipClipId: `opusclip-card-${index + 1}`,
        index,
        title: title ?? `OpusClip result ${index + 1}`,
      });
    }

    return clips;
  }

  const downloadButtons = page.getByRole("button", { name: /download|export/i });
  const count = Math.min(await downloadButtons.count().catch(() => 0), 50);

  return Array.from({ length: count }, (_, index) => ({
    opusclipClipId: `opusclip-download-${index + 1}`,
    index,
    title: `OpusClip result ${index + 1}`,
  }));
}

export async function downloadClip(page: Page, clip: OpusClipGeneratedClip): Promise<DownloadedOpusClip> {
  if (!isEnabled("OPUSCLIP_ENABLE_REAL_DOWNLOAD")) {
    throw new Error("downloadClip is disabled. Set OPUSCLIP_ENABLE_REAL_DOWNLOAD=true after testing OpusClip selectors.");
  }

  const cardLocator = await getBestClipCardLocator(page);
  const scope = cardLocator && typeof clip.index === "number" ? cardLocator.nth(clip.index) : page;
  const href = await getDownloadHref(scope, page);

  if (href) {
    return downloadFromHref(page, href, clip);
  }

  for (const locator of downloadButtonLocators(scope)) {
    try {
      const downloaded = await clickForDownload(page, locator, clip);

      if (downloaded) {
        return downloaded;
      }

      const modalDownloaded = await clickForDownload(
        page,
        page.getByRole("button", { name: /download|export|save/i }).first(),
        clip,
      ).catch(() => null);

      if (modalDownloaded) {
        return modalDownloaded;
      }
    } catch {
      // Try the next candidate. UI copy differs across OpusClip screens.
    }
  }

  throw new Error(
    `Could not download OpusClip result ${clip.index ?? clip.opusclipClipId}. Set OPUSCLIP_CLIP_DOWNLOAD_BUTTON_SELECTOR if the UI changed.`,
  );
}

export async function runOpusClipAutomation(input: OpusClipAutomationInput): Promise<OpusClipAutomationResult> {
  if (isOpusClipApiEnabled()) {
    return runOpusClipApiProcessing(input);
  }

  let session: OpusClipAutomationSession | undefined;

  try {
    session = await openOpusClip();
    await submitVideoToOpusClip(session.page, input);
    const processingResult = await waitForProcessingComplete(session.page);
    const clips = await listGeneratedClips(session.page);
    const downloadedClips: DownloadedOpusClip[] = [];

    for (const clip of clips) {
      downloadedClips.push(await downloadClip(session.page, clip));
    }

    return {
      clips,
      downloadedClips,
      simulated: Boolean(processingResult.simulated),
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
    await session?.browser?.close().catch(() => undefined);
  }
}
