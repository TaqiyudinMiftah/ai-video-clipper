import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { enqueueClipUploadJob } from "@/lib/queue/video-queue";
import { prisma } from "@/lib/prisma";

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
  const platform = String(body?.platform ?? "tiktok").trim().toLowerCase();

  if (platform !== "tiktok") {
    return NextResponse.json({ error: "MVP upload target is TikTok only." }, { status: 400 });
  }

  const clip = await prisma.clip.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!clip) {
    return NextResponse.json({ error: "Clip not found." }, { status: 404 });
  }

  const uploadTarget = await prisma.uploadTarget.create({
    data: {
      clipId: clip.id,
      userId: user.id,
      platform,
      uploadStatus: "queued",
    },
  });

  await prisma.clip.update({
    where: {
      id: clip.id,
    },
    data: {
      status: "uploading",
    },
  });

  await enqueueClipUploadJob({
    userId: user.id,
    clipId: clip.id,
    uploadTargetId: uploadTarget.id,
  });

  return NextResponse.json(
    {
      uploadTargetId: uploadTarget.id,
      status: uploadTarget.uploadStatus,
    },
    { status: 201 },
  );
}
