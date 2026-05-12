import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { enqueueVideoProcessingJob } from "@/lib/queue/video-queue";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const user = await requireCurrentUser();
  const { id } = await params;

  const video = await prisma.video.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  if (!["failed", "cancelled"].includes(video.status)) {
    return NextResponse.json({ error: "Only failed or cancelled videos can be retried." }, { status: 409 });
  }

  const updatedVideo = await prisma.video.update({
    where: {
      id: video.id,
    },
    data: {
      status: "queued",
      errorMessage: null,
      retryCount: {
        increment: 1,
      },
    },
  });

  let jobId: string;

  try {
    const job = await enqueueVideoProcessingJob({
      userId: user.id,
      videoId: updatedVideo.id,
      sourceUrl: updatedVideo.sourceUrl,
      sourceStoragePath: updatedVideo.sourceStoragePath,
    });

    jobId = job.id;
  } catch {
    return NextResponse.json(
      {
        error: "Video was marked for retry but could not be enqueued. Check REDIS_URL and Redis availability.",
        videoId: updatedVideo.id,
        status: "failed",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    videoId: updatedVideo.id,
    status: updatedVideo.status,
    jobId,
  });
}
