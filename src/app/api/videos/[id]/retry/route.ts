import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueVideoOrFail } from "@/lib/services/video-task-queue";

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

  const enqueueResult = await enqueueVideoOrFail(updatedVideo);

  if (!enqueueResult.ok) {
    return NextResponse.json(
      {
        error: enqueueResult.errorMessage,
        videoId: updatedVideo.id,
        status: "failed",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    videoId: updatedVideo.id,
    status: updatedVideo.status,
    jobId: enqueueResult.job.id,
  });
}
