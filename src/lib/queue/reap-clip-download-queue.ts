import { Queue } from "bullmq";
import type { JobsOptions } from "bullmq";
import { logEvent, serializeError } from "@/lib/observability/logger";
import { prisma } from "@/lib/prisma";
import { getReapClipDownloadJobId } from "@/lib/queue/reap-job-identity";
import { createQueueRedisConnection } from "@/lib/queue/redis";

export const REAP_CLIP_DOWNLOAD_QUEUE_NAME = "reap-clip-download";
export const REAP_CLIP_DOWNLOAD_JOB_NAME = "download-reap-clips";
export const REAP_CLIP_DOWNLOAD_MAX_ATTEMPTS = 3;
export const REAP_CLIP_DOWNLOAD_RETRY_DELAY_MS = 60_000;
export const DEFAULT_REAP_CLIP_DOWNLOAD_CONCURRENCY = 1;

export type ReapClipDownloadJobData = {
  dbJobId: string;
  userId: string;
  videoId: string;
  reapProjectId: string;
};

type ReapClipDownloadJobInput = {
  userId: string;
  videoId: string;
  reapProjectId: string;
};

const reapClipDownloadJobOptions = {
  attempts: REAP_CLIP_DOWNLOAD_MAX_ATTEMPTS,
  backoff: {
    type: "fixed" as const,
    delay: REAP_CLIP_DOWNLOAD_RETRY_DELAY_MS,
  },
  removeOnComplete: {
    count: 1000,
  },
  removeOnFail: {
    count: 1000,
  },
} satisfies JobsOptions;

let reapClipDownloadQueue: Queue<ReapClipDownloadJobData> | null = null;

export function getReapClipDownloadQueue() {
  reapClipDownloadQueue ??= new Queue<ReapClipDownloadJobData>(REAP_CLIP_DOWNLOAD_QUEUE_NAME, {
    connection: createQueueRedisConnection("ai-video-clipper-reap-download-queue"),
    defaultJobOptions: reapClipDownloadJobOptions,
  });

  return reapClipDownloadQueue;
}

export async function enqueueReapClipDownloadJob({
  userId,
  videoId,
  reapProjectId,
}: ReapClipDownloadJobInput) {
  const dbJobId = getReapClipDownloadJobId(videoId, reapProjectId);
  const dbJob = await prisma.job.upsert({
    where: { id: dbJobId },
    create: {
      id: dbJobId,
      userId,
      videoId,
      jobType: "reap_download",
      status: "queued",
      maxAttempts: REAP_CLIP_DOWNLOAD_MAX_ATTEMPTS,
    },
    update: {},
  });

  if (dbJob.status === "completed") {
    return dbJob;
  }

  const queue = getReapClipDownloadQueue();
  const existingQueueJob = await queue.getJob(dbJobId);

  if (existingQueueJob) {
    const state = await existingQueueJob.getState();

    if (state !== "failed") {
      return dbJob;
    }

    await existingQueueJob.remove();
  }

  await logEvent({
    userId,
    jobId: dbJob.id,
    level: "info",
    event: "reap.download.job.created",
    component: "reap-download-queue",
    message: "Reap clip download job prepared.",
    metadata: { videoId, reapProjectId },
  });

  try {
    const queueJob = await queue.add(
      REAP_CLIP_DOWNLOAD_JOB_NAME,
      {
        dbJobId: dbJob.id,
        userId,
        videoId,
        reapProjectId,
      },
      {
        ...reapClipDownloadJobOptions,
        jobId: dbJob.id,
      },
    );

    await prisma.job.update({
      where: { id: dbJob.id },
      data: {
        status: "queued",
        errorMessage: null,
        completedAt: null,
      },
    });

    await logEvent({
      userId,
      jobId: dbJob.id,
      level: "info",
      event: "reap.download.job.enqueued",
      component: "reap-download-queue",
      message: "Reap clip download job enqueued in BullMQ.",
      metadata: {
        queueName: REAP_CLIP_DOWNLOAD_QUEUE_NAME,
        queueJobId: queueJob.id,
        videoId,
        reapProjectId,
      },
    });

    return dbJob;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to enqueue Reap clip download job.";

    await prisma.job.update({
      where: { id: dbJob.id },
      data: {
        status: "failed",
        errorMessage,
        completedAt: new Date(),
      },
    });

    await logEvent({
      userId,
      jobId: dbJob.id,
      level: "error",
      event: "reap.download.job.enqueue_failed",
      component: "reap-download-queue",
      message: "Failed to enqueue Reap clip download job in BullMQ.",
      metadata: {
        queueName: REAP_CLIP_DOWNLOAD_QUEUE_NAME,
        videoId,
        reapProjectId,
        error: serializeError(error),
      },
    });

    throw error;
  }
}
