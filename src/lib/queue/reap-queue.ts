import { Queue } from "bullmq";
import type { JobsOptions } from "bullmq";
import { prisma } from "@/lib/prisma";
import { logEvent, serializeError } from "@/lib/observability/logger";
import { createQueueRedisConnection } from "@/lib/queue/redis";

export const REAP_PROCESSING_QUEUE_NAME = "reap-processing";
export const REAP_PROCESSING_JOB_NAME = "reap-process-video";
export const REAP_MAX_ATTEMPTS = 3;
export const REAP_RETRY_DELAY_MS = 5 * 60 * 1000;
export const DEFAULT_REAP_WORKER_CONCURRENCY = 1;

export type ReapProcessingJobData = {
  dbJobId: string;
  userId: string;
  videoId: string;
  sourceUrl?: string | null;
  sourceStoragePath?: string | null;
};

type ReapJobInput = {
  userId: string;
  videoId: string;
  sourceUrl?: string | null;
  sourceStoragePath?: string | null;
};

const reapProcessingJobOptions = {
  attempts: REAP_MAX_ATTEMPTS,
  backoff: {
    type: "fixed" as const,
    delay: REAP_RETRY_DELAY_MS,
  },
  removeOnComplete: {
    count: 1000,
  },
  removeOnFail: {
    count: 1000,
  },
} satisfies JobsOptions;

let reapProcessingQueue: Queue<ReapProcessingJobData> | null = null;

export function getReapProcessingQueue() {
  reapProcessingQueue ??= new Queue<ReapProcessingJobData>(REAP_PROCESSING_QUEUE_NAME, {
    connection: createQueueRedisConnection(),
    defaultJobOptions: reapProcessingJobOptions,
  });

  return reapProcessingQueue;
}

export async function enqueueReapProcessingJob({
  userId,
  videoId,
  sourceUrl,
  sourceStoragePath,
}: ReapJobInput) {
  const dbJob = await prisma.job.create({
    data: {
      userId,
      videoId,
      jobType: "reap_process",
      status: "queued",
      maxAttempts: REAP_MAX_ATTEMPTS,
    },
  });

  await logEvent({
    userId,
    jobId: dbJob.id,
    level: "info",
    event: "reap.job.created",
    component: "reap-queue",
    message: "Reap processing job record created.",
    metadata: {
      videoId,
    },
  });

  try {
    const queueJob = await getReapProcessingQueue().add(
      REAP_PROCESSING_JOB_NAME,
      {
        dbJobId: dbJob.id,
        userId,
        videoId,
        sourceUrl,
        sourceStoragePath,
      },
      {
        ...reapProcessingJobOptions,
        jobId: dbJob.id,
      },
    );

    await logEvent({
      userId,
      jobId: dbJob.id,
      level: "info",
      event: "reap.job.enqueued",
      component: "reap-queue",
      message: "Reap processing job enqueued in BullMQ.",
      metadata: {
        queueName: REAP_PROCESSING_QUEUE_NAME,
        queueJobId: queueJob.id,
        attempts: REAP_MAX_ATTEMPTS,
        retryDelayMs: REAP_RETRY_DELAY_MS,
      },
    });

    return dbJob;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to enqueue Reap processing job.";

    await prisma.job.update({
      where: { id: dbJob.id },
      data: {
        status: "failed",
        errorMessage,
        completedAt: new Date(),
      },
    });

    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "failed",
        errorMessage: "Failed to enqueue Reap processing job. Check REDIS_URL and Redis availability.",
      },
    });

    await logEvent({
      userId,
      jobId: dbJob.id,
      level: "error",
      event: "reap.job.enqueue_failed",
      component: "reap-queue",
      message: "Failed to enqueue Reap processing job in BullMQ.",
      metadata: {
        queueName: REAP_PROCESSING_QUEUE_NAME,
        errorMessage,
        error: serializeError(error),
      },
    });

    throw error;
  }
}