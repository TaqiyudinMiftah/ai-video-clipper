import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { startClippingRequestSchema, validationErrorResponse } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";
import { enqueueVideoOrFail } from "@/lib/services/video-task-queue";
import { getVideoForUser } from "@/lib/user-owned-records";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteContext) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "A JSON request body is required." }, { status: 400 });
  }

  const parsed = startClippingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const video = await getVideoForUser(user.id, id);

  if (!video) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  if (!video.sourceUrl && !video.sourceStoragePath) {
    return NextResponse.json({ error: "Video must have a source before clipping can start." }, { status: 400 });
  }

  if (!["pending", "failed", "cancelled"].includes(video.status)) {
    return NextResponse.json({ error: `Video clipping cannot be started while status is "${video.status}".` }, { status: 409 });
  }

  const updatedVideo = await prisma.video.update({
    where: {
      id: video.id,
    },
    data: {
      status: "queued",
      errorMessage: null,
      reapConfig: parsed.data,
    },
  });

  const enqueueResult = await enqueueVideoOrFail(updatedVideo);

  if (!enqueueResult.ok) {
    await prisma.video.update({
      where: {
        id: updatedVideo.id,
      },
      data: {
        status: "failed",
        errorMessage: enqueueResult.errorMessage,
      },
    });

    return NextResponse.json(
      {
        error: enqueueResult.errorMessage,
        videoId: updatedVideo.id,
        status: "failed",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      videoId: updatedVideo.id,
      status: updatedVideo.status,
      jobId: enqueueResult.job.id,
    },
    { status: 201 },
  );
}
