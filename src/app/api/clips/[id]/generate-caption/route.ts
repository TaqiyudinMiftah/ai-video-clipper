import { NextResponse } from "next/server";
import { generateClipMetadata } from "@/lib/ai";
import { requireCurrentUser } from "@/lib/auth";
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

  const clip = await prisma.clip.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      video: true,
    },
  });

  if (!clip) {
    return NextResponse.json({ error: "Clip not found." }, { status: 404 });
  }

  const generated = await generateClipMetadata({
    clipId: clip.id,
    clipTitle: clip.title,
    existingCaption: clip.caption,
    existingHashtags: clip.hashtags,
    videoTitle: clip.video.title,
    sourceUrl: clip.video.sourceUrl,
  });

  const updatedClip = await prisma.clip.update({
    where: {
      id: clip.id,
    },
    data: {
      title: generated.title,
      caption: generated.caption,
      hashtags: generated.hashtags,
    },
  });

  await prisma.log.create({
    data: {
      userId: user.id,
      level: "info",
      message: "Clip metadata generated with placeholder caption service.",
      metadata: {
        phase: 5,
        clipId: clip.id,
        videoId: clip.videoId,
        provider: generated.provider,
        message: generated.message,
      },
    },
  });

  return NextResponse.json({
    id: updatedClip.id,
    title: updatedClip.title,
    caption: updatedClip.caption,
    hashtags: updatedClip.hashtags,
    status: updatedClip.status,
    message: generated.message,
    provider: generated.provider,
  });
}
