import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueReapClipDownloadJob } from "@/lib/queue/reap-clip-download-queue";
import { getProjectStatus } from "@/lib/reap";
import { classifyReapProjectStatus } from "@/lib/reap/project-status";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: NextRequest, { params }: RouteContext) {
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

  if (!video.reapProjectId) {
    return NextResponse.json(
      { error: "Video does not have a Reap project ID. Process the video first." },
      { status: 400 },
    );
  }

  if (!["processing_in_reap", "downloading_from_reap"].includes(video.status)) {
    return NextResponse.json(
      { error: "Video must be in processing_in_reap or downloading_from_reap status to poll for results." },
      { status: 409 },
    );
  }

  try {
    const statusResponse = await getProjectStatus(video.reapProjectId);
    const statusKind = classifyReapProjectStatus(statusResponse.status);

    if (statusKind === "completed") {
      const job = await enqueueReapClipDownloadJob({
        userId: user.id,
        videoId: video.id,
        reapProjectId: video.reapProjectId,
      });

      return NextResponse.json({
        videoId: video.id,
        reapProjectId: video.reapProjectId,
        jobId: job.id,
        status: "download_queued",
      });
    }

    if (statusKind === "failed") {
      const errorMessage = `Reap project ${video.reapProjectId} failed with status: ${statusResponse.status}`;

      await prisma.video.update({
        where: { id: video.id },
        data: {
          status: "failed",
          errorMessage,
        },
      });

      return NextResponse.json({
        videoId: video.id,
        reapProjectId: video.reapProjectId,
        status: statusResponse.status,
        error: errorMessage,
      });
    }

    return NextResponse.json({
      videoId: video.id,
      reapProjectId: video.reapProjectId,
      status: statusResponse.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check Reap project status.",
      },
      { status: 503 },
    );
  }
}
