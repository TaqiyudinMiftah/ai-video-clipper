import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstagramAccountInsights } from "@/lib/composio/instagram-analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/instagram
 *
 * Returns account-level Instagram analytics for the connected account.
 * Query params:
 *   - days (optional, default 7): number of days to look back
 */
export async function GET(request: Request) {
  const user = await requireCurrentUser();
  const { searchParams } = new URL(request.url);
  const days = Math.min(
    Math.max(parseInt(searchParams.get("days") ?? "7", 10), 1),
    90,
  );

  // Find connected Instagram account
  const socialAccount = await prisma.socialAccount.findFirst({
    where: {
      userId: user.id,
      platform: "instagram",
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!socialAccount) {
    return NextResponse.json(
      { error: "No connected Instagram account found." },
      { status: 404 },
    );
  }

  const entityId = socialAccount.connectedId;
  const platformUserId = socialAccount.platformUserId;

  if (!platformUserId) {
    return NextResponse.json(
      { error: "Instagram user ID not found for this account." },
      { status: 400 },
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const since = now - days * 86400;

  try {
    const insights = await getInstagramAccountInsights(
      entityId,
      platformUserId,
      since,
      now,
    );

    return NextResponse.json({
      account: {
        id: socialAccount.id,
        username: socialAccount.platformUsername,
      },
      period: {
        days,
        since,
        until: now,
      },
      insights,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Instagram analytics.",
      },
      { status: 502 },
    );
  }
}
