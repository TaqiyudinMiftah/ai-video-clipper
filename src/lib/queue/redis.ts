import IORedis from "ioredis";

const DEFAULT_REDIS_URL = "redis://localhost:6379";

function getRedisUrl() {
  return process.env.REDIS_URL ?? DEFAULT_REDIS_URL;
}

export function createQueueRedisConnection(connectionName = "ai-video-clipper-queue") {
  return new IORedis(getRedisUrl(), {
    connectionName,
    maxRetriesPerRequest: 1,
  });
}

export function createWorkerRedisConnection(connectionName = "ai-video-clipper-worker") {
  return new IORedis(getRedisUrl(), {
    connectionName,
    maxRetriesPerRequest: null,
  });
}
