import type { Job } from "bullmq";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import { OPUSCLIP_MAX_ATTEMPTS } from "../../src/lib/queue/video-queue";
import type { VideoProcessingJobData } from "../../src/lib/queue/video-queue";
import { runOpusClipAutomation } from "../../src/lib/opusclip";
import type { OpusClipFailureArtifact } from "../../src/lib/opusclip";

type LogInput = {
  jobId: string;
  userId: string;
  level: "info" | "warning" | "error";
  message: string;
  metadata?: Prisma.InputJsonValue;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSimulationDelayMs() {
  const value = Number(process.env.OPUSCLIP_WORKER_SIMULATION_MS ?? "3000");
  return Number.isFinite(value) && value >= 0 ? value : 3000;
}

function getOpusClipFailureArtifact(error: unknown) {
  if (error instanceof Error && error.cause && typeof error.cause === "object") {
    return error.cause as OpusClipFailureArtifact;
  }

  return undefined;
}

async function createLog({ jobId, userId, level, message, metadata }: LogInput) {
  await prisma.log.create({
    data: {
      jobId,
      userId,
      level,
      message,
      metadata,
    },
  });
}

export async function processOpusClipVideoJob(job: Job<VideoProcessingJobData>) {
  const { dbJobId, userId, videoId, sourceUrl, sourceStoragePath } = job.data;
  const attempt = job.attemptsMade + 1;
  const maxAttempts = typeof job.opts.attempts === "number" ? job.opts.attempts : OPUSCLIP_MAX_ATTEMPTS;

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
      status: "processing_in_opusclip",
      errorMessage: null,
    },
  });

  await createLog({
    jobId: dbJobId,
    userId,
    level: "info",
    message: "OpusClip worker started simulated processing.",
    metadata: {
      phase: 2,
      queueJobId: job.id,
      attempt,
      maxAttempts,
      sourceUrl,
      sourceStoragePath,
    },
  });

  try {
    await job.updateProgress(25);
    await sleep(getSimulationDelayMs());

    if (process.env.OPUSCLIP_WORKER_SIMULATE_FAILURE === "true") {
      throw new Error("Simulated OpusClip worker failure.");
    }

    await createLog({
      jobId: dbJobId,
      userId,
      level: "info",
      message: "Calling OpusClip Playwright automation skeleton.",
      metadata: {
        phase: 4,
        videoId,
      },
    });

    const automationResult = await runOpusClipAutomation({
      jobId: dbJobId,
      userId,
      videoId,
      sourceUrl,
      sourceStoragePath,
    });

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

    await createLog({
      jobId: dbJobId,
      userId,
      level: "info",
      message: "OpusClip worker completed simulated processing.",
      metadata: {
        phase: 4,
        videoId,
        generatedClipCount: automationResult.clips.length,
        downloadedClipCount: automationResult.downloadedClips.length,
        automationSimulated: automationResult.simulated,
        status: "ready_to_upload",
      },
    });

    return {
      videoId,
      status: "ready_to_upload",
      simulated: true,
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

    await createLog({
      jobId: dbJobId,
      userId,
      level: "error",
      message: willRetry ? "OpusClip worker attempt failed; BullMQ will retry." : "OpusClip worker failed after final attempt.",
      metadata: {
        phase: 2,
        attempt,
        maxAttempts,
        willRetry,
        errorMessage,
        currentUrl: artifact?.currentUrl,
        screenshotPath: artifact?.screenshotPath,
        errorPath: artifact?.errorPath,
      },
    });

    throw error;
  }
}
