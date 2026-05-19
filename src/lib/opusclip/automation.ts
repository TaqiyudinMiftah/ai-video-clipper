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

type ProcessingWaitOptions = {
  existingProjectPaths?: Set<string>;
};

type ProjectLinkCandidate = {
  locator: Locator;
  path: string;
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

async function hasVisibleLocator(candidates: Locator[], timeoutMs: number) {
  return Boolean(await firstVisibleLocator(candidates, timeoutMs));
}

async function isActionableButton(locator: Locator) {
  if (!(await locator.isEnabled({ timeout: 500 }).catch(() => true))) {
    return false;
  }

  return locator
    .evaluate((node) => {
      const element = node instanceof HTMLElement ? node : node.parentElement;
      const target = element?.closest("button") ?? element;

      if (!target) {
        return false;
      }

      const button = target instanceof HTMLButtonElement ? target : null;
      const styles = window.getComputedStyle(target);
      return (
        !button?.disabled &&
        target.getAttribute("aria-disabled") !== "true" &&
        styles.pointerEvents !== "none" &&
        Number(styles.opacity) > 0.45
      );
    })
    .catch(() => false);
}

function popupDismissLocators(page: Page) {
  return [
    page.getByRole("button", { name: /^close$/i }).first(),
    page.getByRole("button", { name: /continue|got it|ok|done|maybe later|not now|skip/i }).first(),
    page.locator('button[aria-label*="close" i]').first(),
    page.locator('button:has-text("×"), button:has-text("x")').first(),
  ];
}

function upgradePlanDialog(page: Page) {
  return page.getByRole("dialog").filter({ hasText: /upgrade your plan|get starter|get pro|contact us/i }).first();
}

function upgradePlanIndicators(page: Page) {
  return [page.getByText(/upgrade your plan/i).first(), upgradePlanDialog(page)];
}

async function hasUpgradePlanModal(page: Page, timeoutMs = 750) {
  return hasVisibleLocator(upgradePlanIndicators(page), timeoutMs);
}

async function clickTopRightCloseControl(page: Page) {
  const clicked = await page
    .evaluate(() => {
      const viewportWidth = window.innerWidth;
      const controls = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"]'));
      const candidates = controls
        .map((element) => ({
          element,
          label: `${element.getAttribute("aria-label") ?? ""} ${element.textContent ?? ""}`.trim(),
          rect: element.getBoundingClientRect(),
        }))
        .filter(({ label, rect }) => {
          const isVisible = rect.width > 0 && rect.height > 0;
          const isTopRight = rect.top >= 0 && rect.top <= 140 && rect.left >= viewportWidth - 220;
          const isSmallControl = rect.width <= 96 && rect.height <= 96;
          const looksLikeClose = /close|×|x/i.test(label);

          return isVisible && isTopRight && isSmallControl && (looksLikeClose || label.length <= 2);
        })
        .sort((a, b) => b.rect.left - a.rect.left || a.rect.top - b.rect.top);

      const target = candidates[0]?.element;

      if (!target) {
        return false;
      }

      target.click();
      return true;
    })
    .catch(() => false);

  if (clicked) {
    await page.waitForTimeout(750);
  }

  return clicked;
}

async function dismissUpgradePlanModal(page: Page) {
  if (!(await hasUpgradePlanModal(page, 500))) {
    return false;
  }

  await page.keyboard.press("Escape").catch(() => undefined);
  await page.waitForTimeout(500);

  if (!(await hasUpgradePlanModal(page, 500))) {
    return true;
  }

  const dialog = upgradePlanDialog(page);
  const explicitClose = dialog
    .locator('button[aria-label*="close" i], [role="button"][aria-label*="close" i]')
    .first();

  if (await explicitClose.isVisible({ timeout: 500 }).catch(() => false)) {
    await explicitClose.click({ timeout: 1_000 }).catch(() => undefined);
    await page.waitForTimeout(750);
  }

  if (!(await hasUpgradePlanModal(page, 500))) {
    return true;
  }

  const globalClose = page.locator('button[aria-label*="close" i], [role="button"][aria-label*="close" i]').last();

  if (await globalClose.isVisible({ timeout: 500 }).catch(() => false)) {
    await globalClose.click({ timeout: 1_000 }).catch(() => undefined);
    await page.waitForTimeout(750);
  }

  if (!(await hasUpgradePlanModal(page, 500))) {
    return true;
  }

  const namedClose = page.getByRole("button", { name: /^close$|^x$|^×$/i }).last();

  if (await namedClose.isVisible({ timeout: 500 }).catch(() => false)) {
    await namedClose.click({ timeout: 1_000 }).catch(() => undefined);
    await page.waitForTimeout(750);
  }

  if (!(await hasUpgradePlanModal(page, 500))) {
    return true;
  }

  const box = await dialog.boundingBox().catch(() => null);

  if (box) {
    await page.mouse.click(box.x + box.width - 24, box.y + 24).catch(() => undefined);
    await page.waitForTimeout(750);
  }

  if (!(await hasUpgradePlanModal(page, 500))) {
    return true;
  }

  await clickTopRightCloseControl(page);

  if (!(await hasUpgradePlanModal(page, 500))) {
    return true;
  }

  const viewport = page.viewportSize();

  if (viewport) {
    await page.mouse.click(viewport.width - 80, 68).catch(() => undefined);
    await page.waitForTimeout(750);
  }

  return !(await hasUpgradePlanModal(page, 500));
}

async function dismissAllDialogs(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const dialogCount = await page.getByRole("dialog").count().catch(() => 0);
    if (dialogCount === 0) return true;

    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForTimeout(750);

    const remaining = await page.getByRole("dialog").count().catch(() => 0);
    if (remaining === 0) return true;

    const dialogs = page.getByRole("dialog");

    const dialogCloseLocators = [
      dialogs.locator('button[aria-label*="close" i]').first(),
      dialogs.locator('[role="button"][aria-label*="close" i]').first(),
      dialogs.locator('button:has-text("×"), button:has-text("x")').first(),
    ];

    for (const closeBtn of dialogCloseLocators) {
      if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeBtn.click({ timeout: 1_000 }).catch(() => undefined);
        await page.waitForTimeout(750);
        break;
      }
    }

    const remainingAfterClose = await page.getByRole("dialog").count().catch(() => 0);
    if (remainingAfterClose === 0) return true;

    const dialogDismissButtons = [
      page.getByRole("button", { name: /cancel|close|got it|ok|done|maybe later|not now|skip|no thanks/i }).first(),
      page.getByRole("button", { name: /continue|next|proceed/i }).first(),
    ];

    for (const btn of dialogDismissButtons) {
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        await btn.click({ timeout: 1_000 }).catch(() => undefined);
        await page.waitForTimeout(750);
        break;
      }
    }

    const remainingAfterDismiss = await page.getByRole("dialog").count().catch(() => 0);
    if (remainingAfterDismiss === 0) return true;
  }

  return (await page.getByRole("dialog").count().catch(() => 0)) === 0;
}

async function dismissSoftPopups(page: Page) {
  await dismissUpgradePlanModal(page);
  await dismissAllDialogs(page);

  for (const locator of popupDismissLocators(page)) {
    if (!(await locator.isVisible({ timeout: 500 }).catch(() => false))) {
      continue;
    }

    await locator.click({ timeout: 1_000 }).catch(() => undefined);
    await page.waitForTimeout(750);
  }
}

async function waitForSubmitButtonOrFail(page: Page, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  const candidates = submitButtonLocators(page);

  while (Date.now() < deadline) {
    for (const candidate of candidates) {
      try {
        await candidate.waitFor({
          state: "visible",
          timeout: 750,
        });

        if (await isActionableButton(candidate)) {
          return candidate;
        }
      } catch {
        // Try the next selector while the upload UI settles.
      }
    }

    const projectPath = currentProjectPath(page);
    const projectPageVisible = projectPath ? await firstVisibleLocator(projectPageIndicators(page), 750) : null;

    if (projectPath && projectPageVisible) {
      throw new Error(
        `OpusClip opened project ${projectPath} before the 'Get clips in 1 click' button was clicked. The upload flow likely navigated away after file selection; check the upload selectors or OpusClip UI state.`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  return null;
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

function normalizeOpusClipProjectPath(href: string | null | undefined, baseUrl: string) {
  if (!href) {
    return null;
  }

  try {
    const url = new URL(href, baseUrl);
    return url.pathname.startsWith("/clip/") ? url.pathname : null;
  } catch {
    return null;
  }
}

function currentProjectPath(page: Page) {
  return normalizeOpusClipProjectPath(page.url(), page.url());
}

function dashboardProjectPath(page: Page) {
  try {
    const url = new URL(page.url());
    const projectId = url.searchParams.get("projectId")?.trim();

    return projectId ? `/clip/${projectId}` : null;
  } catch {
    return null;
  }
}

async function openProjectPath(page: Page, projectPath: string) {
  const appOrigin = new URL(getOpusClipConfig().appUrl).origin;

  await page.goto(new URL(projectPath, appOrigin).toString(), {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(2_000);
}

function isTargetProjectPath(projectPath: string | null, existingProjectPaths?: Set<string>): projectPath is string {
  return Boolean(projectPath && !existingProjectPaths?.has(projectPath));
}

function projectLinkLocators(page: Page) {
  return [
    ...(isConfiguredSelector(opusClipSelectors.projectCard) ? [page.locator(opusClipSelectors.projectCard)] : []),
    page.locator('a[href^="/clip/"], a[href*="/clip/"]'),
  ];
}

async function projectPathForLocator(locator: Locator, page: Page) {
  const directHref = await locator.getAttribute("href").catch(() => null);
  const nestedHref = directHref ?? (await locator.locator('a[href^="/clip/"], a[href*="/clip/"]').first().getAttribute("href").catch(() => null));

  return normalizeOpusClipProjectPath(nestedHref, page.url());
}

async function collectExistingProjectPaths(page: Page) {
  await page.waitForLoadState("domcontentloaded").catch(() => undefined);
  await page.waitForTimeout(1_000);

  const projectPaths = new Set<string>();

  for (const locator of projectLinkLocators(page)) {
    const count = Math.min(await locator.count().catch(() => 0), 100);

    for (let index = 0; index < count; index += 1) {
      const projectPath = await projectPathForLocator(locator.nth(index), page);

      if (projectPath) {
        projectPaths.add(projectPath);
      }
    }
  }

  return projectPaths;
}

async function findNewProjectLink(page: Page, existingProjectPaths?: Set<string>): Promise<ProjectLinkCandidate | null> {
  for (const locator of projectLinkLocators(page)) {
    const count = Math.min(await locator.count().catch(() => 0), 100);

    for (let index = 0; index < count; index += 1) {
      const candidate = locator.nth(index);
      const projectPath = await projectPathForLocator(candidate, page);

      if (!isTargetProjectPath(projectPath, existingProjectPaths)) {
        continue;
      }

      if (!(await candidate.isVisible().catch(() => false))) {
        continue;
      }

      return {
        locator: candidate,
        path: projectPath,
      };
    }
  }

  return null;
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
    page.getByRole("button", { name: /get clips in 1 click/i }).first(),
    page.locator('button:has-text("Get clips in 1 click")').first(),
    page.locator('button:has-text("Get clips")').first(),
    page.getByRole("button", { name: /get clips|create clips|generate clips|submit|continue|next|start|import/i }).first(),
    page.getByText(/get clips|create clips|generate clips|submit|continue|next|start|import/i).first(),
  ];
}

function uploadInProgressLocators(page: Page) {
  return [
    page.getByText(/uploading\s+\d+(\.\d+)?\s*%/i).first(),
    page.getByText(/\d+\s*(min|minute|sec|second)s?\s+left/i).first(),
    page.getByRole("button", { name: /^cancel$/i }).first(),
  ];
}

function uploadedSourceReadyLocators(page: Page) {
  return [
    page.getByRole("button", { name: /^remove$/i }).first(),
    page.getByText(/speech language/i).first(),
    page.getByText(/credit usage/i).first(),
    page.getByText(/unauthorized clipping/i).first(),
    page.locator("video").first(),
  ];
}

function projectPageIndicators(page: Page) {
  return [
    page.getByText(/original clips/i).first(),
    page.getByPlaceholder(/find keywords|moments/i).first(),
    page.getByRole("button", { name: /select/i }).first(),
    page.getByRole("button", { name: /filter/i }).first(),
  ];
}

function downloadButtonLocators(scope: LocatorScope) {
  return [
    ...(isConfiguredSelector(opusClipSelectors.clipDownloadButton)
      ? [scope.locator(opusClipSelectors.clipDownloadButton).first()]
      : []),
    scope.locator('button:has(img[alt*="download" i]), button:has(img[src*="download-icon"])').first(),
    scope.getByRole("button", { name: /download|export|save/i }).first(),
    scope.getByRole("link", { name: /download|export|save/i }).first(),
    scope.locator('a[href*=".mp4"], a[href*="download"], a[href*="cdn.opus"], a[href*="export"]').first(),
    scope.locator('button:has-text("Download"), button:has-text("Export"), a:has-text("Download"), a:has-text("Export")').first(),
  ];
}

function downloadIconButtons(page: Page) {
  return page.locator('button:has(img[alt*="download" i]), button:has(img[src*="download-icon"])');
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
    ...projectPageIndicators(page),
    page.getByText(/clips? (are )?ready|processing complete|export|download/i).first(),
    page.getByRole("button", { name: /Download HD/i }).first(),
    page.getByRole("button", { name: /download|export/i }).first(),
    page.getByRole("link", { name: /download|export/i }).first(),
  ];
}

async function waitForUploadedSourceReady(page: Page) {
  const config = getOpusClipConfig();
  const deadline = Date.now() + config.submitTimeoutMs;

  while (Date.now() < deadline) {
    await dismissSoftPopups(page);

    const projectPath = currentProjectPath(page);
    const projectPageVisible = projectPath ? await firstVisibleLocator(projectPageIndicators(page), 500) : null;

    if (projectPath && projectPageVisible) {
      throw new Error(
        `OpusClip opened project ${projectPath} before the source upload became ready. The uploaded file may have been auto-imported or the upload selector matched the wrong UI.`,
      );
    }

    if (await hasVisibleLocator(uploadInProgressLocators(page), 500)) {
      await page.waitForTimeout(1_000);
      continue;
    }

    const readyIndicator = await hasVisibleLocator(uploadedSourceReadyLocators(page), 750);
    const submitButton = await waitForSubmitButtonOrFail(page, 1_000);

    if (readyIndicator && submitButton) {
      return submitButton;
    }

    await page.waitForTimeout(1_000);
  }

  throw new Error(
    "Timed out waiting for the OpusClip source upload to finish. Expected upload progress to disappear and the uploaded file preview/remove control to appear before clicking 'Get clips in 1 click'.",
  );
}

async function clickSubmitToStartClipping(page: Page, readySubmitButton?: Locator) {
  const config = getOpusClipConfig();
  const submitButton = readySubmitButton ?? (await waitForSubmitButtonOrFail(page, config.submitTimeoutMs));

  if (!submitButton) {
    throw new Error(
      "Could not find an enabled OpusClip submit button. Set OPUSCLIP_SUBMIT_BUTTON_SELECTOR, for example a selector for the 'Get clips in 1 click' button.",
    );
  }

  await submitButton.scrollIntoViewIfNeeded().catch(() => undefined);
  const currentUrl = page.url();
  await submitButton.click({
    timeout: config.selectorTimeoutMs,
  });
  await Promise.race([
    page.waitForURL((url) => url.toString() !== currentUrl, { timeout: 15_000 }).catch(() => undefined),
    page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined),
    page.waitForTimeout(5_000),
  ]);
  await page.waitForTimeout(2_000);
}

async function maybeOpenTargetProject(page: Page, options: ProcessingWaitOptions) {
  await dismissSoftPopups(page);

  const projectPath = currentProjectPath(page);

  if (isTargetProjectPath(projectPath, options.existingProjectPaths) && (await firstVisibleLocator(projectPageIndicators(page), 750))) {
    return true;
  }

  const projectPathFromDashboard = dashboardProjectPath(page);

  if (isTargetProjectPath(projectPathFromDashboard, options.existingProjectPaths)) {
    await openProjectPath(page, projectPathFromDashboard);
    await dismissSoftPopups(page);
    return Boolean(await firstVisibleLocator(projectPageIndicators(page), 1_000));
  }

  const newProject = await findNewProjectLink(page, options.existingProjectPaths);

  if (!newProject) {
    return false;
  }

  await openProjectPath(page, newProject.path);
  await dismissSoftPopups(page);

  return Boolean(
    isTargetProjectPath(currentProjectPath(page), options.existingProjectPaths) &&
      (await firstVisibleLocator(projectPageIndicators(page), 1_000)),
  );
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
      } else {
        continue;
      }
    } catch {
      // Continue to the file chooser fallback.
      continue;
    }

    const submitButton = await waitForUploadedSourceReady(page);
    await clickSubmitToStartClipping(page, submitButton);
    return;
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
  const submitButton = await waitForUploadedSourceReady(page);
  await clickSubmitToStartClipping(page, submitButton);
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

  await clickSubmitToStartClipping(page);
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

async function getReadyClipCount(page: Page) {
  const downloadHdCount = await page.getByRole("button", { name: /Download HD/i }).count().catch(() => 0);

  if (downloadHdCount > 0) {
    return downloadHdCount;
  }

  const downloadIconCount = await downloadIconButtons(page).count().catch(() => 0);

  if (downloadIconCount > 0) {
    return downloadIconCount;
  }

  const cardLocator = await getBestClipCardLocator(page);
  return cardLocator ? await cardLocator.count().catch(() => 0) : 0;
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
  const clickFailedResult = "click-failed" as const;
  const upgradePlanResult = "upgrade-plan" as const;
  type ClickResult = DownloadedOpusClip | null | typeof upgradePlanResult | typeof clickFailedResult;

  const clickAndDownload = async (): Promise<ClickResult> => {
    const downloadPromise = page
      .waitForEvent("download", {
        timeout: config.downloadTimeoutMs,
      })
      .catch(() => null);
    const upgradePlanPromise = hasUpgradePlanModal(page, config.selectorTimeoutMs).then((visible) =>
      visible ? upgradePlanResult : null,
    );

    try {
      await locator.click({
        timeout: config.selectorTimeoutMs,
      });
    } catch {
      return clickFailedResult;
    }

    const firstResult = await Promise.race([downloadPromise, upgradePlanPromise]);

    if (firstResult === upgradePlanResult) {
      return upgradePlanResult;
    }

    const download = firstResult ?? (await downloadPromise);

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
  };

  let result = await clickAndDownload();

  if (result === upgradePlanResult) {
    await dismissUpgradePlanModal(page);
    return null;
  }

  if (result === clickFailedResult) {
    await dismissSoftPopups(page);

    result = await clickAndDownload();

    if (result === upgradePlanResult) {
      await dismissUpgradePlanModal(page);
      return null;
    }

    if (result === clickFailedResult) {
      await page.keyboard.press("Escape").catch(() => undefined);
      await page.waitForTimeout(1_000);
      await dismissAllDialogs(page);

      result = await clickAndDownload();

      if (result === upgradePlanResult) {
        await dismissUpgradePlanModal(page);
        return null;
      }

      if (result === clickFailedResult) {
        return null;
      }
    }
  }

  if (result === null) {
    if (!(await dismissUpgradePlanModal(page))) {
      await dismissSoftPopups(page);
    }

    return null;
  }

  return result;
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

  if (isEnabled("OPUSCLIP_ENABLE_REAL_SUBMIT") && !hasSavedOpusClipSession(getOpusClipConfig())) {
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

export async function waitForProcessingComplete(page: Page, options: ProcessingWaitOptions = {}) {
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
    await dismissSoftPopups(page);

    const errorIndicator = await firstVisibleLocator(errorLocators(page), 750);

    if (errorIndicator) {
      throw new Error(`OpusClip showed an error while processing: ${(await safeText(errorIndicator)) ?? "Unknown page error"}`);
    }

    const projectPath = currentProjectPath(page);
    const isTargetProject = isTargetProjectPath(projectPath, options.existingProjectPaths);

    if (isTargetProject && (await firstVisibleLocator(projectPageIndicators(page), 750))) {
      const clipCount = await getReadyClipCount(page);
      const completeIndicator = await firstVisibleLocator(completionLocators(page), 750);

      if (clipCount > 0 && completeIndicator) {
        return {
          completed: true,
          simulated: false,
          clipCount,
          projectPath,
        };
      }
    }

    if (projectPath && options.existingProjectPaths?.has(projectPath)) {
      await page.goto(config.appUrl, {
        waitUntil: "domcontentloaded",
      }).catch(() => undefined);
      await page.waitForTimeout(2_000);
    } else {
      await maybeOpenTargetProject(page, options);
    }

    await page.waitForTimeout(config.processingPollMs);
  }

  throw new Error(`Timed out waiting for OpusClip processing after ${Math.round(config.processingTimeoutMs / 1000)} seconds.`);
}

export async function listGeneratedClips(page: Page): Promise<OpusClipGeneratedClip[]> {
  if (!isEnabled("OPUSCLIP_ENABLE_REAL_LIST")) {
    return [];
  }

  await dismissSoftPopups(page);

  const downloadHdButtons = page.getByRole("button", { name: /Download HD/i });
  const downloadHdCount = Math.min(await downloadHdButtons.count().catch(() => 0), 50);

  if (downloadHdCount > 0) {
    return Array.from({ length: downloadHdCount }, (_, index) => ({
      opusclipClipId: `opusclip-download-hd-${index + 1}`,
      index,
      title: `OpusClip result ${index + 1}`,
    }));
  }

  const downloadIcons = downloadIconButtons(page);
  const downloadIconCount = Math.min(await downloadIcons.count().catch(() => 0), 50);

  if (downloadIconCount > 0) {
    return Array.from({ length: downloadIconCount }, (_, index) => ({
      opusclipClipId: `opusclip-download-icon-${index + 1}`,
      index,
      title: `OpusClip result ${index + 1}`,
    }));
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

async function tryDownloadFromDialog(page: Page, clip: OpusClipGeneratedClip): Promise<DownloadedOpusClip | null> {
  const dialogCount = await page.getByRole("dialog").count().catch(() => 0);
  if (dialogCount === 0) return null;

  const dialog = page.getByRole("dialog").first();
  const dialogDownloadLocators = [
    dialog.getByRole("button", { name: /download hd|download|export|save/i }).first(),
    dialog.locator('button:has(img[alt*="download" i]), button:has(img[src*="download-icon"])').first(),
    ...downloadButtonLocators(dialog),
  ];

  for (const locator of dialogDownloadLocators) {
    if (!(await locator.isVisible({ timeout: 1_000 }).catch(() => false))) continue;

    const href = await getDownloadHref(dialog, page);
    if (href) {
      return downloadFromHref(page, href, clip);
    }

    const downloaded = await clickForDownload(page, locator, clip);
    if (downloaded) return downloaded;
  }

  return null;
}

export async function downloadClip(page: Page, clip: OpusClipGeneratedClip): Promise<DownloadedOpusClip> {
  if (!isEnabled("OPUSCLIP_ENABLE_REAL_DOWNLOAD")) {
    throw new Error("downloadClip is disabled. Set OPUSCLIP_ENABLE_REAL_DOWNLOAD=true after testing OpusClip selectors.");
  }

  await dismissSoftPopups(page);
  await dismissAllDialogs(page);

  if (typeof clip.index === "number") {
    const downloadHdButtons = page.getByRole("button", { name: /Download HD/i });
    const downloadHdCount = await downloadHdButtons.count().catch(() => 0);

    if (downloadHdCount > clip.index) {
      await dismissAllDialogs(page);
      const downloaded = await clickForDownload(page, downloadHdButtons.nth(clip.index), clip);

      if (downloaded) {
        return downloaded;
      }
    }

    const iconButtons = downloadIconButtons(page);
    const iconButtonCount = await iconButtons.count().catch(() => 0);

    if (iconButtonCount > clip.index) {
      await dismissAllDialogs(page);
      const downloaded = await clickForDownload(page, iconButtons.nth(clip.index), clip);

      if (downloaded) {
        return downloaded;
      }

      await dismissAllDialogs(page);
      const modalDownloaded = await clickForDownload(
        page,
        page.getByRole("button", { name: /download hd|download|export|save/i }).first(),
        clip,
      ).catch(() => null);

      if (modalDownloaded) {
        return modalDownloaded;
      }
    }
  }

  const dialogDownloaded = await tryDownloadFromDialog(page, clip);
  if (dialogDownloaded) {
    return dialogDownloaded;
  }

  const cardLocator = await getBestClipCardLocator(page);
  const scope = cardLocator && typeof clip.index === "number" ? cardLocator.nth(clip.index) : page;
  const href = await getDownloadHref(scope, page);

  if (href) {
    return downloadFromHref(page, href, clip);
  }

  for (const locator of downloadButtonLocators(scope)) {
    try {
      await dismissAllDialogs(page);
      const downloaded = await clickForDownload(page, locator, clip);

      if (downloaded) {
        return downloaded;
      }

      await dismissAllDialogs(page);
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
    `Could not download OpusClip result ${clip.index ?? clip.opusclipClipId}. The clip may be blocked by an OpusClip upgrade modal, or the download selector may have changed. Set OPUSCLIP_CLIP_DOWNLOAD_BUTTON_SELECTOR if the UI changed.`,
  );
}

export async function runOpusClipAutomation(input: OpusClipAutomationInput): Promise<OpusClipAutomationResult> {
  if (isOpusClipApiEnabled()) {
    return runOpusClipApiProcessing(input);
  }

  let session: OpusClipAutomationSession | undefined;

  try {
    session = await openOpusClip();
    const existingProjectPaths = await collectExistingProjectPaths(session.page);

    await submitVideoToOpusClip(session.page, input);
    const processingResult = await waitForProcessingComplete(session.page, {
      existingProjectPaths,
    });
    const clips = await listGeneratedClips(session.page);
    const downloadedClips: DownloadedOpusClip[] = [];
    const downloadErrors: string[] = [];

    for (const clip of clips) {
      try {
        downloadedClips.push(await downloadClip(session.page, clip));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        downloadErrors.push(`Clip ${clip.index ?? clip.opusclipClipId}: ${message}`);
        await dismissSoftPopups(session.page).catch(() => undefined);
        await dismissAllDialogs(session.page).catch(() => undefined);
      }
    }

    if (clips.length > 0 && downloadedClips.length === 0 && downloadErrors.length > 0) {
      throw new Error(
        `OpusClip generated ${clips.length} clip(s), but none could be downloaded. Last download error: ${downloadErrors.at(-1)}`,
      );
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
