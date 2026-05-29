import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createQueueRedisConnection } from "@/lib/queue/redis";

export const dynamic = "force-dynamic";

type DependencyCheck = {
  ok: boolean;
  latencyMs: number;
  error?: string;
};

function serializeHealthError(error: unknown) {
  return error instanceof Error ? error.message : "Unknown health check error.";
}

async function measure(check: () => Promise<void>): Promise<DependencyCheck> {
  const startedAt = Date.now();

  try {
    await check();

    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: serializeHealthError(error),
    };
  }
}

async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`;
}

async function checkRedis() {
  const redis = createQueueRedisConnection("ai-video-clipper-http-health");

  try {
    const response = await redis.ping();

    if (response !== "PONG") {
      throw new Error(`Unexpected Redis ping response: ${response}`);
    }
  } finally {
    redis.disconnect();
  }
}

export async function GET() {
  const [database, redis] = await Promise.all([measure(checkDatabase), measure(checkRedis)]);
  const ok = database.ok && redis.ok;

  return NextResponse.json(
    {
      ok,
      checkedAt: new Date().toISOString(),
      dependencies: {
        database,
        redis,
      },
    },
    {
      status: ok ? 200 : 503,
    },
  );
}
