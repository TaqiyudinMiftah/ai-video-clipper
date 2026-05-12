import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { normalizeHashtags, updateClipMetadataRequestSchema, validationErrorResponse } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "A JSON request body is required." }, { status: 400 });
  }

  const parsed = updateClipMetadataRequestSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
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

  const updatedClip = await prisma.clip.update({
    where: {
      id: clip.id,
    },
    data: {
      title: parsed.data.title !== undefined ? parsed.data.title?.trim() || null : undefined,
      caption: parsed.data.caption !== undefined ? parsed.data.caption?.trim() || null : undefined,
      hashtags: parsed.data.hashtags !== undefined ? normalizeHashtags(parsed.data.hashtags) : undefined,
    },
  });

  return NextResponse.json({
    id: updatedClip.id,
    title: updatedClip.title,
    caption: updatedClip.caption,
    hashtags: updatedClip.hashtags,
    status: updatedClip.status,
  });
}
