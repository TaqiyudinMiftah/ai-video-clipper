import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireCurrentUser();

  const publishedTargets = await prisma.uploadTarget.findMany({
    where: {
      userId: user.id,
      uploadStatus: "completed",
      platform: { in: ["tiktok", "instagram"] },
    },
    include: {
      clip: {
        select: {
          id: true,
          title: true,
          storagePath: true,
          previewUrl: true,
          video: {
            select: {
              id: true,
              title: true,
              sourceUrl: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const items = publishedTargets.map((target) => ({
    id: target.id,
    platform: target.platform,
    uploadedUrl: target.uploadedUrl,
    publishedAt: target.createdAt.toISOString(),
    clip: {
      id: target.clip.id,
      title: target.clip.title,
      previewUrl: target.clip.previewUrl,
      storagePath: target.clip.storagePath,
      video: target.clip.video,
    },
  }));

  return NextResponse.json({ items, count: items.length });
}
