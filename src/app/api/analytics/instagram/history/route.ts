import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/instagram/history?days=30
 *
 * Returns time-series analytics snapshots for line charts.
 */
export async function GET(request: Request) {
  const user = await requireCurrentUser();
  const { searchParams } = new URL(request.url);
  const days = Math.min(
    Math.max(parseInt(searchParams.get("days") ?? "30", 10), 1),
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

  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - days);
  startDate.setUTCHours(0, 0, 0, 0);

  const snapshots = await prisma.accountAnalytics.findMany({
    where: {
      socialAccountId: socialAccount.id,
      snapshotDate: { gte: startDate },
    },
    orderBy: { snapshotDate: "asc" },
  });

  const data = snapshots.map((snap) => ({
    date: snap.snapshotDate.toISOString().split("T")[0],
    followers: snap.followerCount,
    avgViews: Math.round(snap.avgViews * 100) / 100,
    totalViews: Number(snap.totalViews),
    totalReach: Number(snap.totalReach),
    totalImpressions: Number(snap.totalImpressions),
    totalMediaCount: snap.totalMediaCount,
  }));

  return NextResponse.json({
    account: {
      id: socialAccount.id,
      username: socialAccount.igUsername,
    },
    period: { days },
    data,
  });
}
