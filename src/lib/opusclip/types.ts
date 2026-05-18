import type { Browser, BrowserContext, Page } from "playwright";

export type OpusClipSource = {
  sourceUrl?: string | null;
  sourceStoragePath?: string | null;
};

export type OpusClipAutomationInput = OpusClipSource & {
  userId: string;
  videoId: string;
  jobId: string;
  title?: string | null;
};

export type OpusClipAutomationSession = {
  browser?: Browser | null;
  context: BrowserContext;
  page: Page;
};

export type OpusClipGeneratedClip = {
  opusclipClipId: string;
  index?: number;
  title?: string;
  pageUrl?: string;
  previewUrl?: string;
  exportUrl?: string;
  caption?: string;
  hashtags?: string[];
  durationSeconds?: number;
};

export type DownloadedOpusClip = {
  clip: OpusClipGeneratedClip;
  filePath?: string;
  data?: Uint8Array;
  contentType?: string;
  fileName?: string;
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
