import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { connectYouTube } from "@/lib/composio/youtube-connect";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await requireCurrentUser();
  const body = (await request.json().catch(() => ({}))) ?? {};
  const alias = body.alias as string | undefined;

  // Unique entity per YouTube account so upload always uses the right connection
  const entityId = `${user.id}-yt-${Date.now()}`;

  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/composio/youtube/callback?userId=${user.id}&entityId=${entityId}`;

  const result = await connectYouTube({
    userId: entityId,
    redirectUrl,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to initiate connection." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    redirectUrl: result.redirectUrl,
    connectedAccountId: result.connectedAccountId,
    entityId,
    status: result.status,
    youtubeMetadata: result.youtubeMetadata,
  });
}
