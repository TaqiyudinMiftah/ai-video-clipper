import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireCurrentUser } from "@/lib/auth";
import {
  getAllowedVideoFileTypesLabel,
  getFileExtension,
  isAllowedVideoFile,
  isValidUrl,
} from "@/lib/api/validation";
import { enqueueVideoProcessingJob } from "@/lib/queue/video-queue";
import { prisma } from "@/lib/prisma";
import { getStorageService } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireCurrentUser();
  const videos = await prisma.video.findMany({
    where: {
      userId: user.id,
    },
    include: {
      clips: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    data: videos.map((video) => ({
      id: video.id,
      title: video.title,
      sourceType: video.sourceType,
      sourceUrl: video.sourceUrl,
      sourceStoragePath: video.sourceStoragePath,
      status: video.status,
      clipCount: video.clips.length,
      errorMessage: video.errorMessage,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
    })),
  });
}

async function enqueueVideoOrFail(video: { id: string; userId: string; sourceUrl: string | null; sourceStoragePath: string | null }) {
  try {
    return await enqueueVideoProcessingJob({
      userId: video.userId,
      videoId: video.id,
      sourceUrl: video.sourceUrl,
      sourceStoragePath: video.sourceStoragePath,
    });
  } catch {
    return null;
  }
}

async function createUrlVideoTask(userId: string, body: Record<string, unknown>) {
  const sourceUrl = String(body.sourceUrl ?? "").trim();

  if (!isValidUrl(sourceUrl)) {
    return NextResponse.json({ error: "A valid HTTP or HTTPS sourceUrl is required." }, { status: 400 });
  }

  const video = await prisma.video.create({
    data: {
      userId,
      sourceType: "url",
      sourceUrl,
      title: String(body.title ?? "").trim() || null,
      status: "queued",
    },
  });

  const job = await enqueueVideoOrFail(video);

  if (!job) {
    return NextResponse.json(
      {
        error: "Video task was created but could not be enqueued. Check REDIS_URL and Redis availability.",
        videoId: video.id,
        status: "failed",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      videoId: video.id,
      status: video.status,
      jobId: job.id,
    },
    { status: 201 },
  );
}

async function createFileVideoTask(userId: string, formData: FormData) {
  const sourceFile = formData.get("sourceFile");

  if (!(sourceFile instanceof File) || sourceFile.size === 0) {
    return NextResponse.json({ error: "A sourceFile upload is required." }, { status: 400 });
  }

  if (!isAllowedVideoFile(sourceFile)) {
    return NextResponse.json(
      { error: `Unsupported video file type. Allowed types: ${getAllowedVideoFileTypesLabel()}.` },
      { status: 400 },
    );
  }

  const videoId = randomUUID();
  const extension = getFileExtension(sourceFile.name);
  const sourceStoragePath = `users/${userId}/videos/${videoId}/source.${extension}`;
  const title = String(formData.get("title") ?? "").trim() || sourceFile.name;

  const video = await prisma.video.create({
    data: {
      id: videoId,
      userId,
      sourceType: "file",
      title,
      status: "pending",
    },
  });

  try {
    await getStorageService().uploadFile({
      path: sourceStoragePath,
      file: sourceFile,
      contentType: sourceFile.type || undefined,
      upsert: false,
    });

    await prisma.video.update({
      where: {
        id: video.id,
      },
      data: {
        sourceStoragePath,
        status: "queued",
      },
    });

    await prisma.log.create({
      data: {
        userId,
        level: "info",
        message: "Source video uploaded to storage.",
        metadata: {
          phase: 3,
          videoId: video.id,
          sourceStoragePath,
          fileName: sourceFile.name,
          contentType: sourceFile.type,
          size: sourceFile.size,
        },
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Source video upload failed.";

    await prisma.video.update({
      where: {
        id: video.id,
      },
      data: {
        status: "failed",
        errorMessage,
      },
    });

    await prisma.log.create({
      data: {
        userId,
        level: "error",
        message: "Source video upload failed.",
        metadata: {
          phase: 3,
          videoId: video.id,
          errorMessage,
        },
      },
    });

    return NextResponse.json(
      {
        error: "Video task was created but the source file could not be uploaded. Check storage configuration.",
        videoId: video.id,
        status: "failed",
      },
      { status: 503 },
    );
  }

  const updatedVideo = await prisma.video.findUniqueOrThrow({
    where: {
      id: video.id,
    },
  });

  const job = await enqueueVideoOrFail(updatedVideo);

  if (!job) {
    return NextResponse.json(
      {
        error: "Video source was uploaded but could not be enqueued. Check REDIS_URL and Redis availability.",
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
      sourceStoragePath: updatedVideo.sourceStoragePath,
      jobId: job.id,
    },
    { status: 201 },
  );
}

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const sourceType = String(formData.get("sourceType") ?? "file");

    if (sourceType !== "file") {
      return NextResponse.json({ error: "multipart/form-data submissions must use sourceType=file." }, { status: 400 });
    }

    return createFileVideoTask(user.id, formData);
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || body.sourceType !== "url") {
    return NextResponse.json({ error: "Use sourceType=url for JSON submissions or sourceType=file for uploads." }, { status: 400 });
  }

  return createUrlVideoTask(user.id, body as Record<string, unknown>);
}
