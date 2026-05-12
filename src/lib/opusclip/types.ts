import type { Browser, BrowserContext, Page } from "playwright";

export type OpusClipSource = {
  sourceUrl?: string | null;
  sourceStoragePath?: string | null;
};

export type OpusClipAutomationInput = OpusClipSource & {
  userId: string;
  videoId: string;
  jobId: string;
};

export type OpusClipAutomationSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
};

export type OpusClipGeneratedClip = {
  opusclipClipId: string;
  title?: string;
  pageUrl?: string;
};

export type DownloadedOpusClip = {
  clip: OpusClipGeneratedClip;
  filePath: string;
};

export type OpusClipFailureArtifact = {
  screenshotPath?: string;
  errorPath: string;
  errorMessage: string;
  currentUrl?: string;
};

export type OpusClipAutomationResult = {
  clips: OpusClipGeneratedClip[];
  downloadedClips: DownloadedOpusClip[];
  simulated: boolean;
};
