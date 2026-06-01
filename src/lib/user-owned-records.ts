import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function getVideoForUser<TInclude extends Prisma.VideoInclude | undefined = undefined>(
  userId: string,
  videoId: string,
  include?: TInclude,
) {
  return prisma.video.findFirst({
    where: {
      id: videoId,
      userId,
    },
    ...(include ? { include } : {}),
  });
}

export function getClipForUser<TInclude extends Prisma.ClipInclude | undefined = undefined>(
  userId: string,
  clipId: string,
  include?: TInclude,
) {
  return prisma.clip.findFirst({
    where: {
      id: clipId,
      userId,
    },
    ...(include ? { include } : {}),
  });
}
