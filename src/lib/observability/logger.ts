import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type StructuredLogLevel = "info" | "warning" | "error";

type LogEventInput = {
  level: StructuredLogLevel;
  event: string;
  message: string;
  component?: string;
  userId?: string | null;
  jobId?: string | null;
  metadata?: unknown;
};

type JobLoggerContext = {
  component: string;
  userId: string;
  jobId: string;
};

export function toJsonValue(value: unknown): Prisma.InputJsonValue {
  try {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  } catch {
    return {
      value: String(value),
    };
  }
}

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
}

export async function logEvent({ level, event, message, component, userId, jobId, metadata }: LogEventInput) {
  const timestamp = new Date().toISOString();
  const structuredMetadata = toJsonValue({
    component,
    event,
    ...(metadata && typeof metadata === "object" ? (metadata as Record<string, unknown>) : { metadata }),
  });
  const consolePayload = {
    timestamp,
    level,
    event,
    component,
    userId,
    jobId,
    message,
    metadata: structuredMetadata,
  };
  const write = level === "error" ? console.error : level === "warning" ? console.warn : console.log;

  write(JSON.stringify(consolePayload));

  if (!userId) {
    return;
  }

  await prisma.log.create({
    data: {
      userId,
      jobId: jobId ?? undefined,
      level,
      message,
      metadata: structuredMetadata,
    },
  });
}

export function createJobLogger({ component, userId, jobId }: JobLoggerContext) {
  return {
    info(message: string, metadata?: unknown) {
      return logEvent({ level: "info", event: "job.info", component, userId, jobId, message, metadata });
    },
    warning(message: string, metadata?: unknown) {
      return logEvent({ level: "warning", event: "job.warning", component, userId, jobId, message, metadata });
    },
    error(message: string, metadata?: unknown) {
      return logEvent({ level: "error", event: "job.error", component, userId, jobId, message, metadata });
    },
  };
}
