import { NextResponse } from "next/server";
import { logEvent, serializeError } from "@/lib/observability/logger";
import { prisma } from "@/lib/prisma";
import { enqueueReapClipDownloadJob } from "@/lib/queue/reap-clip-download-queue";
import { cancelReapPollingFallback } from "@/lib/queue/reap-polling-queue";
import type { ReapWebhookPayload } from "@/lib/reap/types";
import { getReapWebhookSecurityConfig, verifyReapWebhookRequest } from "@/lib/reap/webhook-security";
import { classifyReapProjectStatus } from "@/lib/reap/project-status";

/**
 * Reap sends webhooks when projects reach terminal states.
 * Keep this handler short: it acknowledges Reap, records state, and lets workers do long-running work.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const verification = verifyReapWebhookRequest({
    body,
    headers: request.headers,
    url: request.url,
    ...getReapWebhookSecurityConfig(),
  });

  if (!verification.ok) {
    await logEvent({
      level: "warning",
      event: "reap.webhook.rejected",
      component: "reap-webhook",
      message: "Rejected Reap webhook request.",
      metadata: { reason: verification.reason },
    });

    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let payload: ReapWebhookPayload;
  try {
    payload = JSON.parse(body) as ReapWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId, status } = payload;

  if (!projectId || !status) {
    return NextResponse.json({ error: "Missing projectId or status" }, { status: 400 });
  }

  const video = await prisma.video.findFirst({
    where: { reapProjectId: projectId },
  });

  if (!video) {
    await logEvent({
      level: "warning",
      event: "reap.webhook.video_not_found",
      component: "reap-webhook",
      message: `Webhook received for unknown Reap project ${projectId}.`,
      metadata: { projectId, status },
    });

    return new NextResponse(null, { status: 200 });
  }

  const statusKind = classifyReapProjectStatus(status);

  if (statusKind === "completed") {
    try {
      await handleCompletedProject(video.id, video.userId, projectId);
    } catch {
      return NextResponse.json({ error: "Unable to enqueue clip download." }, { status: 503 });
    }
  } else if (statusKind === "failed") {
    await handleFailedProject(video.id, video.userId, projectId, status);
  } else {
    await logEvent({
      userId: video.userId,
      level: "info",
      event: "reap.webhook.ignored_status",
      component: "reap-webhook",
      message: `Webhook received for non-terminal Reap status ${status}.`,
      metadata: { videoId: video.id, reapProjectId: projectId, status },
    });
  }

  return new NextResponse(null, { status: 200 });
}

async function handleCompletedProject(videoId: string, userId: string, reapProjectId: string) {
  try {
    const job = await enqueueReapClipDownloadJob({
      userId,
      videoId,
      reapProjectId,
    });
    const pollingCancelled = await cancelReapPollingFallback(videoId, reapProjectId).catch(
      () => false,
    );

    await logEvent({
      userId,
      jobId: job.id,
      level: "info",
      event: "reap.webhook.download_enqueued",
      component: "reap-webhook",
      message: "Reap completion webhook queued clip download work.",
      metadata: { videoId, reapProjectId, pollingCancelled },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Webhook received, but the clip download job could not be enqueued.";

    await prisma.video.updateMany({
      where: {
        id: videoId,
        status: {
          in: ["processing_in_reap", "downloading_from_reap"],
        },
      },
      data: {
        status: "processing_in_reap",
        errorMessage,
      },
    });

    await logEvent({
      userId,
      level: "error",
      event: "reap.webhook.enqueue_failed",
      component: "reap-webhook",
      message: errorMessage,
      metadata: { videoId, reapProjectId, error: serializeError(error) },
    });

    throw error;
  }
}

async function handleFailedProject(videoId: string, userId: string, reapProjectId: string, status: string) {
  const errorMessage = `Reap project ${reapProjectId} failed with status: ${status}`;

  await prisma.video.update({
    where: { id: videoId },
    data: {
      status: "failed",
      errorMessage,
    },
  });

  await logEvent({
    userId,
    level: "error",
    event: "reap.webhook.failed",
    component: "reap-webhook",
    message: errorMessage,
    metadata: { videoId, reapProjectId, status },
  });
}
