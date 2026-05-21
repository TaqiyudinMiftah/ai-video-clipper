import "dotenv/config";
import { QueueEvents, Worker } from "bullmq";
import { prisma } from "../../src/lib/prisma";
import {
  REAP_PROCESSING_QUEUE_NAME,
  DEFAULT_REAP_WORKER_CONCURRENCY,
} from "../../src/lib/queue/reap-queue";
import type { ReapProcessingJobData } from "../../src/lib/queue/reap-queue";
import { createWorkerRedisConnection } from "../../src/lib/queue/redis";
import { processReapVideoJob } from "./processor";

function getWorkerConcurrency() {
  const value = Number(process.env.REAP_WORKER_CONCURRENCY ?? DEFAULT_REAP_WORKER_CONCURRENCY);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_REAP_WORKER_CONCURRENCY;
}

const workerConnection = createWorkerRedisConnection("ai-video-clipper-reap-worker");
const eventsConnection = createWorkerRedisConnection("ai-video-clipper-reap-events");

const worker = new Worker<ReapProcessingJobData>(REAP_PROCESSING_QUEUE_NAME, processReapVideoJob, {
  connection: workerConnection,
  concurrency: getWorkerConcurrency(),
});

const queueEvents = new QueueEvents(REAP_PROCESSING_QUEUE_NAME, {
  connection: eventsConnection,
});

worker.on("ready", () => {
  console.log(`[reap-worker] Listening on queue "${REAP_PROCESSING_QUEUE_NAME}"`);
});

worker.on("completed", (job) => {
  console.log(`[reap-worker] Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`[reap-worker] Job ${job?.id ?? "unknown"} failed: ${error.message}`);
});

queueEvents.on("waiting", ({ jobId }) => {
  console.log(`[reap-worker] Job ${jobId} waiting`);
});

queueEvents.on("stalled", ({ jobId }) => {
  console.warn(`[reap-worker] Job ${jobId} stalled`);
});

async function shutdown(signal: string) {
  console.log(`[reap-worker] Received ${signal}; shutting down`);

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