import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { Job } from "bullmq";
import { prisma } from "../../src/lib/prisma";
import { createJobLogger, serializeError } from "../../src/lib/observability/logger";
import { OPUSCLIP_MAX_ATTEMPTS } from "../../src/lib/queue/video-queue";
import type { VideoProcessingJobData } from "../../src/lib/queue/video-queue";
import { runOpusClipAutomation } from "../../src/lib/opusclip";
import type { DownloadedOpusClip, OpusClipFailureArtifact } from "../../src/lib/opusclip";
import { getStorageService } from "../../src/lib/storage";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSimulationDelayMs() {
  const value = Number(process.env.OPUSCLIP_WORKER_SIMULATION_MS ?? "3000");
  return Number.isFinite(value) && value >= 0 ? value : 3000;
}

function shouldCreateMockClip() {
  return process.env.OPUSCLIP_MOCK_CREATE_CLIP === "true";
}

function isOpusClipApiMode() {
  return process.env.OPUSCLIP_USE_API === "true";
}

function isRealPlaywrightMode() {
  return process.env.OPUSCLIP_ENABLE_REAL_SUBMIT === "true";
}

function getOpusClipFailureArtifact(error: unknown) {
  if (error instanceof Error && error.cause && typeof error.cause === "object") {
    return error.cause as OpusClipFailureArtifact;
  }

  return undefined;
}

async function getDownloadedClipBytes(downloadedClip: DownloadedOpusClip) {
  if (downloadedClip.data) {
    return downloadedClip.data;
  }

  if (downloadedClip.filePath) {
    return readFile(downloadedClip.filePath);
  }

  return null;
}

async function storeDownloadedClips({
  userId,
  videoId,
  downloadedClips,
  logger,
}: {
  userId: string;
  videoId: string;
  downloadedClips: DownloadedOpusClip[];
  logger: ReturnType<typeof createJobLogger>;
}) {
  const storage = getStorageService();
  let storedClipCount = 0;

  for (const downloadedClip of downloadedClips) {
    const clipBytes = await getDownloadedClipBytes(downloadedClip);

    if (!clipBytes) {
      await logger.warning("Skipping OpusClip result because no downloaded clip bytes were available.", {
        videoId,
        opusclipClipId: downloadedClip.clip.opusclipClipId,
        filePath: downloadedClip.filePath,
      });
      continue;
    }

    const existingClip = await prisma.clip.findFirst({
      where: {
        userId,
        videoId,
        opusclipClipId: downloadedClip.clip.opusclipClipId,
      },
    });
    const clipId = existingClip?.id ?? randomUUID();
    const storagePath = existingClip?.storagePath ?? `users/${userId}/videos/${videoId}/clips/${clipId}.mp4`;
    const title = downloadedClip.clip.title ?? existingClip?.title ?? "OpusClip result";
    const caption = downloadedClip.clip.caption ?? existingClip?.caption ?? null;
    const hashtags = downloadedClip.clip.hashtags?.length ? downloadedClip.clip.hashtags : existingClip?.hashtags ?? [];

    await storage.uploadFile({
      path: storagePath,
      file: clipBytes,
      contentType: downloadedClip.contentType ?? "video/mp4",
      upsert: true,
    });

    if (existingClip) {
      await prisma.clip.update({
        where: {
          id: existingClip.id,
        },
        data: {
          storagePath,
          previewUrl: null,
          durationSeconds: downloadedClip.clip.durationSeconds ?? existingClip.durationSeconds,
          title,
          caption,
          hashtags,
          status: "ready_to_upload",
        },
      });
    } else {
      await prisma.clip.create({
        data: {
          id: clipId,
          videoId,
          userId,
          opusclipClipId: downloadedClip.clip.opusclipClipId,
          storagePath,
          previewUrl: null,
          durationSeconds: downloadedClip.clip.durationSeconds,
          title,
          caption,
          hashtags,
          status: "ready_to_upload",
        },
      });
    }

    storedClipCount += 1;

    await logger.info("Stored downloaded OpusClip result in storage.", {
      videoId,
      clipId,
      opusclipClipId: downloadedClip.clip.opusclipClipId,
      storagePath,
      sourceFileName: downloadedClip.fileName ?? (downloadedClip.filePath ? basename(downloadedClip.filePath) : null),
    });
  }

  return storedClipCount;
}

export async function processOpusClipVideoJob(job: Job<VideoProcessingJobData>) {
  const { dbJobId, userId, videoId, sourceUrl, sourceStoragePath } = job.data;
  const attempt = job.attemptsMade + 1;
  const maxAttempts = typeof job.opts.attempts === "number" ? job.opts.attempts : OPUSCLIP_MAX_ATTEMPTS;
  const logger = createJobLogger({
    component: "opusclip-worker",
    userId,
    jobId: dbJobId,
  });

  await prisma.job.update({
    where: {
      id: dbJobId,
    },
    data: {
      status: "active",
      attempts: attempt,
      startedAt: new Date(),
      errorMessage: null,
    },
  });

  await prisma.video.update({
    where: {
      id: videoId,
    },
    data: {
      status: isOpusClipApiMode() ? "uploading_to_opusclip" : "processing_in_opusclip",
      errorMessage: null,
    },
  });

  const video = await prisma.video.findUnique({
    where: {
      id: videoId,
    },
    select: {
      title: true,
    },
  });

  if (!video) {
    throw new Error(`Video ${videoId} was not found.`);
  }

  await logger.info("OpusClip worker started processing.", {
      phase: 2,
      queueJobId: job.id,
      attempt,
      maxAttempts,
      sourceUrl,
      sourceStoragePath,
      mode: isOpusClipApiMode() ? "api" : isRealPlaywrightMode() ? "playwright-real" : "playwright-placeholder",
  });

  try {
    await job.updateProgress(25);

    if (!isOpusClipApiMode() && !isRealPlaywrightMode()) {
      await sleep(getSimulationDelayMs());
    }

    if (process.env.OPUSCLIP_WORKER_SIMULATE_FAILURE === "true") {
      throw new Error("Simulated OpusClip worker failure.");
    }

    await logger.info(
      isOpusClipApiMode()
        ? "Calling OpusClip API processing."
        : isRealPlaywrightMode()
          ? "Calling OpusClip Playwright automation."
          : "Calling OpusClip Playwright automation skeleton.",
      {
        phase: 4,
        videoId,
      },
    );

    const automationResult = await runOpusClipAutomation({
      jobId: dbJobId,
      userId,
      videoId,
      sourceUrl,
      sourceStoragePath,
      title: video.title,
    });

    let storedClipCount = 0;

    if (automationResult.downloadedClips.length) {
      await prisma.video.update({
        where: {
          id: videoId,
        },
        data: {
          status: "storing_clips",
        },
      });

      storedClipCount = await storeDownloadedClips({
        userId,
        videoId,
        downloadedClips: automationResult.downloadedClips,
        logger,
      });
    }

    if (shouldCreateMockClip() && !automationResult.downloadedClips.length && sourceStoragePath) {
      const mockClipId = `mock-${videoId}-1`;
      const existingMockClip = await prisma.clip.findFirst({
        where: {
          videoId,
          userId,
          opusclipClipId: mockClipId,
        },
      });

      if (existingMockClip) {
        await prisma.clip.update({
          where: {
            id: existingMockClip.id,
          },
          data: {
            storagePath: sourceStoragePath,
            title: "Mock clip for local testing",
            caption: "Placeholder output generated by OPUSCLIP_MOCK_CREATE_CLIP for MVP testing.",
            hashtags: ["#test", "#mvp", "#clip"],
            status: "ready_to_upload",
          },
        });
      } else {
        await prisma.clip.create({
          data: {
            videoId,
            userId,
            opusclipClipId: mockClipId,
            storagePath: sourceStoragePath,
            title: "Mock clip for local testing",
            caption: "Placeholder output generated by OPUSCLIP_MOCK_CREATE_CLIP for MVP testing.",
            hashtags: ["#test", "#mvp", "#clip"],
            status: "ready_to_upload",
          },
        });
      }

      await logger.info("Created mock clip record for local testing.", {
          phase: 4,
          videoId,
          sourceStoragePath,
          mockClipId,
      });

      storedClipCount = 1;
    }

    if (!storedClipCount) {
      throw new Error(
        isOpusClipApiMode()
          ? "OpusClip API completed without returning downloadable clips. Check OpusClip credits, project status, and API permissions."
          : isRealPlaywrightMode()
            ? "OpusClip Playwright automation completed without storing clips. Check OpusClip processing status, download selectors, and failure artifacts."
            : "OpusClip Playwright automation returned no clips. Enable real Playwright flags or implement selectors before disabling mock mode.",
      );
    }

    await job.updateProgress(100);

    await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        status: "ready_to_upload",
        errorMessage: null,
      },
    });

    await prisma.job.update({
      where: {
        id: dbJobId,
      },
      data: {
        status: "completed",
        attempts: attempt,
        completedAt: new Date(),
        errorMessage: null,
      },
    });

    await logger.info("OpusClip worker completed processing.", {
        phase: 4,
        videoId,
        generatedClipCount: automationResult.clips.length,
        downloadedClipCount: automationResult.downloadedClips.length,
        automationSimulated: automationResult.simulated,
        mockClipCreated: shouldCreateMockClip() && Boolean(sourceStoragePath),
        storedClipCount,
        status: "ready_to_upload",
    });

    return {
      videoId,
      status: "ready_to_upload",
      simulated: automationResult.simulated,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown OpusClip worker error.";
    const artifact = getOpusClipFailureArtifact(error);
    const willRetry = attempt < maxAttempts;

    await prisma.video.update({
      where: {
        id: videoId,
      },
      data: {
        status: willRetry ? "queued" : "failed",
        errorMessage,
        retryCount: {
          increment: 1,
        },
      },
    });

    await prisma.job.update({
      where: {
        id: dbJobId,
      },
      data: {
        status: willRetry ? "queued" : "failed",
        attempts: attempt,
        errorMessage,
        completedAt: willRetry ? null : new Date(),
      },
    });

    await logger.error(willRetry ? "OpusClip worker attempt failed; BullMQ will retry." : "OpusClip worker failed after final attempt.", {
        phase: 2,
        attempt,
        maxAttempts,
        willRetry,
        errorMessage,
        error: serializeError(error),
        currentUrl: artifact?.currentUrl,
        screenshotPath: artifact?.screenshotPath,
        errorPath: artifact?.errorPath,
    });

    throw error;
  }
}
