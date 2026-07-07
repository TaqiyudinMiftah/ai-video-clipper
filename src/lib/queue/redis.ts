import IORedis, { type RedisOptions } from "ioredis";

const DEFAULT_REDIS_URL = "redis://localhost:6379";

function getRedisUrl() {
  return process.env.REDIS_URL ?? DEFAULT_REDIS_URL;
}

function createRedisInstance(url: string, opts: RedisOptions): IORedis {
  const client = new IORedis(url, opts);
  // Silence unhandled error events (e.g., when Redis is not running).
  // BullMQ uses its own retry / job-failure handling internally.
  client.on("error", () => {});
  return client;
}

export function createQueueRedisConnection(
  connectionName = "ai-video-clipper-queue",
) {
  return createRedisInstance(getRedisUrl(), {
    connectionName,
    maxRetriesPerRequest: 1,
  });
}

export function createWorkerRedisConnection(
  connectionName = "ai-video-clipper-worker",
) {
  return createRedisInstance(getRedisUrl(), {
    connectionName,
    maxRetriesPerRequest: null,
  });
}
