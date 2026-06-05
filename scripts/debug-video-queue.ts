import "dotenv/config";
import { Queue as BullQueue } from "bullmq";
import { prisma } from "../src/lib/prisma";
import { createQueueRedisConnection } from "../src/lib/queue/redis";
import { VIDEO_PROCESSING_QUEUE_NAME } from "../src/lib/queue/video-queue";

function maskRedisUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    url.password = url.password ? "***" : "";
    url.username = url.username ? "***" : "";
    return url.toString();
  } catch {
    return "<invalid REDIS_URL>";
  }
}

async function main() {
  const videoId = process.argv[2];

  if (!videoId) {
    console.error("Usage: npm run debug:video -- <videoId>");
    process.exitCode = 1;
    return;
  }

  const connection = createQueueRedisConnection("ai-video-clipper-debug-video");
  const queue = new BullQueue(VIDEO_PROCESSING_QUEUE_NAME, {
    connection,
  });

  try {
    const video = await prisma.video.findUnique({
      where: {
        id: videoId,
      },
      select: {
        id: true,
        userId: true,
        sourceType: true,
        sourceUrl: true,
        sourceStoragePath: true,
        status: true,
        errorMessage: true,
        reapProjectId: true,
        createdAt: true,
        updatedAt: true,
        clips: {
          select: {
            id: true,
            status: true,
            reapClipId: true,
            storagePath: true,
          },
        },
      },
    });

    const jobs = await prisma.job.findMany({
      where: {
        videoId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        jobType: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const logs = await prisma.log.findMany({
      where: {
        OR: [
          {
            metadata: {
              path: ["videoId"],
              equals: videoId,
            },
          },
          {
            jobId: {
              in: jobs.map((job) => job.id),
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      select: {
        id: true,
        jobId: true,
        level: true,
        message: true,
        metadata: true,
        createdAt: true,
      },
    });

    const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused");
    const bullmqJobs = await Promise.all(
      jobs.map(async (job) => {
        const queueJob = await queue.getJob(job.id);

        if (!queueJob) {
          return {
            dbJobId: job.id,
            foundInRedis: false,
          };
        }

        return {
          dbJobId: job.id,
          foundInRedis: true,
          queueJobId: queueJob.id,
          name: queueJob.name,
          state: await queueJob.getState(),
          attemptsMade: queueJob.attemptsMade,
          failedReason: queueJob.failedReason,
          processedOn: queueJob.processedOn ? new Date(queueJob.processedOn).toISOString() : null,
          finishedOn: queueJob.finishedOn ? new Date(queueJob.finishedOn).toISOString() : null,
          data: queueJob.data,
        };
      }),
    );

    const payload = {
      checkedAt: new Date().toISOString(),
      redisUrl: maskRedisUrl(process.env.REDIS_URL),
      queueName: VIDEO_PROCESSING_QUEUE_NAME,
      queueCounts: counts,
      video,
      databaseJobs: jobs,
      bullmqJobs,
      latestLogs: logs,
      interpretation: getInterpretation(video, jobs, bullmqJobs, counts),
    };

    console.log(JSON.stringify(payload, null, 2));
  } finally {
    await queue.close();
    connection.disconnect();
    await prisma.$disconnect();
  }
}

function getInterpretation(
  video: { id: string } | null,
  jobs: Array<{ id: string; status: string }>,
  bullmqJobs: Array<{ foundInRedis: boolean; state?: string }>,
  counts: Record<string, number>,
) {
  if (!video) {
    return "Video was not found in the configured database. Check DATABASE_URL.";
  }

  if (!jobs.length) {
    return "Video exists but has no database job. Retry the video or inspect the create-video API path.";
  }

  if (bullmqJobs.every((job) => !job.foundInRedis)) {
    return "Database job exists, but matching BullMQ job was not found in this Redis. The API and worker may be using different REDIS_URL values, or the queue was flushed.";
  }

  if ((counts.waiting ?? 0) > 0 && (counts.active ?? 0) === 0) {
    return "There are waiting jobs but no active video-processing job. Confirm the reap worker is running and connected to this same REDIS_URL.";
  }

  if ((counts.active ?? 0) > 0) {
    return "A video-processing job is active. Check reap worker logs for progress or Reap API errors.";
  }

  const failedJob = bullmqJobs.find((job) => job.state === "failed");

  if (failedJob) {
    return "BullMQ has a failed video-processing job. Inspect failedReason and the latest logs in this output.";
  }

  return "Queue state is not obviously stuck from counts alone. Inspect databaseJobs, bullmqJobs, and latestLogs in this output.";
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
