import "dotenv/config";
import { prisma } from "../../src/lib/prisma";
import {
  DEFAULT_REAP_CLIP_DOWNLOAD_CONCURRENCY,
  REAP_CLIP_DOWNLOAD_QUEUE_NAME,
} from "../../src/lib/queue/reap-clip-download-queue";
import { startReapClipDownloadWorker } from "./processor";

function getWorkerConcurrency() {
  const value = Number(
    process.env.REAP_CLIP_DOWNLOAD_CONCURRENCY ?? DEFAULT_REAP_CLIP_DOWNLOAD_CONCURRENCY,
  );
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_REAP_CLIP_DOWNLOAD_CONCURRENCY;
}

const worker = startReapClipDownloadWorker(getWorkerConcurrency());

worker.on("ready", () => {
  console.log(`[reap-clip-download-worker] Listening on queue "${REAP_CLIP_DOWNLOAD_QUEUE_NAME}"`);
});

async function shutdown(signal: string) {
  console.log(`[reap-clip-download-worker] Received ${signal}; shutting down`);

  await worker.close();
  await prisma.$disconnect();

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
