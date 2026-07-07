import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireCurrentUser();
  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const pageSize = Math.min(
    Math.max(parseInt(searchParams.get("pageSize") ?? "12", 10), 1),
    50,
  );
  const skip = (page - 1) * pageSize;

  const [publishedTargets, totalCount] = await prisma.$transaction([
    prisma.uploadTarget.findMany({
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
      skip,
      take: pageSize,
    }),
    prisma.uploadTarget.count({
      where: {
        userId: user.id,
        uploadStatus: "completed",
        platform: { in: ["tiktok", "instagram"] },
      },
    }),
  ]);

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

  const totalPages = Math.ceil(totalCount / pageSize);

  return NextResponse.json({
    items,
    count: items.length,
    totalCount,
    totalPages,
    page,
    pageSize,
  });
}
