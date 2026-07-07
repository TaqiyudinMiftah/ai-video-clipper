import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstagramRecentPostsWithInsights } from "@/lib/composio/instagram-analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/instagram/posts?max=12
 *
 * Returns recent Instagram posts with per-media insights (views, reach, likes, etc.)
 */
export async function GET(request: Request) {
  const user = await requireCurrentUser();
  const { searchParams } = new URL(request.url);
  const max = Math.min(
    Math.max(parseInt(searchParams.get("max") ?? "12", 10), 1),
    25,
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
  const igUserId = socialAccount.igUserId;

  if (!igUserId) {
    return NextResponse.json(
      { error: "Instagram user ID not found for this account." },
      { status: 400 },
    );
  }

  try {
    const posts = await getInstagramRecentPostsWithInsights(
      entityId,
      igUserId,
      max,
    );

    return NextResponse.json({
      account: {
        id: socialAccount.id,
        username: socialAccount.igUsername,
      },
      posts,
      count: posts.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Instagram posts.",
      },
      { status: 502 },
    );
  }
}
