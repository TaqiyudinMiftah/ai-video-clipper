import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { normalizeHashtags } from "@/lib/api/validation";
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
      title: typeof body.title === "string" ? body.title.trim() || null : undefined,
      caption: typeof body.caption === "string" ? body.caption.trim() || null : undefined,
      hashtags: Array.isArray(body.hashtags) ? normalizeHashtags(body.hashtags) : undefined,
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
