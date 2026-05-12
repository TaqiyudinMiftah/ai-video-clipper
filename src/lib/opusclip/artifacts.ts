import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import { getOpusClipConfig } from "@/lib/opusclip/config";
import type { OpusClipFailureArtifact } from "@/lib/opusclip/types";

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveOpusClipFailureArtifact({
  page,
  userId,
  videoId,
  jobId,
  error,
}: {
  page?: Page;
  userId: string;
  videoId: string;
  jobId: string;
  error: unknown;
}): Promise<OpusClipFailureArtifact> {
  const config = getOpusClipConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const artifactDir = join(config.artifactsDir, safeSegment(userId), safeSegment(videoId), safeSegment(jobId));
  await mkdir(artifactDir, { recursive: true });

  const errorMessage = error instanceof Error ? error.message : "Unknown OpusClip automation error.";
  const currentUrl = page?.url();
  const screenshotPath = page ? join(artifactDir, `${timestamp}-failure.png`) : undefined;
  const errorPath = join(artifactDir, `${timestamp}-error.json`);

  if (page && screenshotPath) {
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });
  }

  await writeFile(
    errorPath,
    JSON.stringify(
      {
        errorMessage,
        currentUrl,
        userId,
        videoId,
        jobId,
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    "utf8",
  );

  return {
    screenshotPath,
    errorPath,
    errorMessage,
    currentUrl,
  };
}
