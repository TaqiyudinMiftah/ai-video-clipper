import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireCurrentUser();
  const { id } = await params;

  const existing = await prisma.video.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Video task not found." },
      { status: 404 },
    );
  }

  await prisma.video.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ success: true, id: existing.id });
}
