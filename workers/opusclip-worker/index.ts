import "dotenv/config";
import { QueueEvents, Worker } from "bullmq";
import { prisma } from "../../src/lib/prisma";
import {
  DEFAULT_OPUSCLIP_WORKER_CONCURRENCY,
  VIDEO_PROCESSING_QUEUE_NAME,
} from "../../src/lib/queue/video-queue";
import type { VideoProcessingJobData } from "../../src/lib/queue/video-queue";
import { createWorkerRedisConnection } from "../../src/lib/queue/redis";
import { processOpusClipVideoJob } from "./processor";

function getWorkerConcurrency() {
  const value = Number(process.env.OPUSCLIP_WORKER_CONCURRENCY ?? DEFAULT_OPUSCLIP_WORKER_CONCURRENCY);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_OPUSCLIP_WORKER_CONCURRENCY;
}

const workerConnection = createWorkerRedisConnection("ai-video-clipper-opusclip-worker");
const eventsConnection = createWorkerRedisConnection("ai-video-clipper-opusclip-events");

const worker = new Worker<VideoProcessingJobData>(VIDEO_PROCESSING_QUEUE_NAME, processOpusClipVideoJob, {
  connection: workerConnection,
  concurrency: getWorkerConcurrency(),
});

const queueEvents = new QueueEvents(VIDEO_PROCESSING_QUEUE_NAME, {
  connection: eventsConnection,
});

worker.on("ready", () => {
  console.log(`[opusclip-worker] Listening on queue "${VIDEO_PROCESSING_QUEUE_NAME}"`);
});

worker.on("completed", (job) => {
  console.log(`[opusclip-worker] Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`[opusclip-worker] Job ${job?.id ?? "unknown"} failed: ${error.message}`);
});

queueEvents.on("waiting", ({ jobId }) => {
  console.log(`[opusclip-worker] Job ${jobId} waiting`);
});

queueEvents.on("stalled", ({ jobId }) => {
  console.warn(`[opusclip-worker] Job ${jobId} stalled`);
});

async function shutdown(signal: string) {
  console.log(`[opusclip-worker] Received ${signal}; shutting down`);

  await worker.close();
  await queueEvents.close();
  await workerConnection.quit();
  await eventsConnection.quit();
  await prisma.$disconnect();

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
