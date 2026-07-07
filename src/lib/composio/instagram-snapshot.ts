import { prisma } from "@/lib/prisma";
import { composioFetch } from "./fetch";

/**
 * Take a daily snapshot of Instagram analytics for a connected account.
 * Fetches current follower count, reach, impressions, and average views,
 * then upserts into the account_analytics table.
 */
export async function takeInstagramSnapshot(
  socialAccountId: string,
  userId: string,
  entityId: string,
  igUserId: string,
): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Skip if snapshot for today already exists
  const existing = await prisma.accountAnalytics.findUnique({
    where: {
      socialAccountId_snapshotDate: {
        socialAccountId,
        snapshotDate: today,
      },
    },
  });
  if (existing) return;

  // 1. Fetch account-level insights (7-day cumulative reach/impressions)
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - 7 * 86400;

  let followerCount = 0;
  let totalReach = BigInt(0);
  let totalImpressions = BigInt(0);

  try {
    const insightsRes = await composioFetch(
      "INSTAGRAM_GET_USER_INSIGHTS",
      entityId,
      {
        ig_user_id: igUserId,
        metric: ["reach", "impressions", "follower_count", "profile_views"],
        period: "day",
        since: sevenDaysAgo,
        until: now,
      },
    );

    const rows: any[] =
      ((insightsRes?.data as Record<string, unknown>)?.data as any[]) ?? [];

    for (const row of rows) {
      const name = row.name as string;
      const values = row.values ?? [];
      if (!name) continue;

      let total = 0;
      for (const v of values) {
        total += v.value ?? 0;
      }

      if (name === "follower_count") {
        // Take the most recent day's value
        const lastVal = values[values.length - 1];
        followerCount = lastVal?.value ?? 0;
      } else if (name === "reach") {
        totalReach = BigInt(total);
      } else if (name === "impressions") {
        totalImpressions = BigInt(total);
      }
    }
  } catch {
    // If insights fail (e.g. insufficient followers), use profile info fallback
    try {
      const userRes = await composioFetch("INSTAGRAM_GET_USER_INFO", entityId, {
        ig_user_id: "me",
        fields: "followers_count",
      });
      const data = (userRes?.data ?? {}) as Record<string, unknown>;
      followerCount = (data.followers_count as number) ?? 0;
    } catch {
      // give up
    }
  }

  // 2. Fetch all media to compute total views and avg views
  let totalViews = BigInt(0);
  let totalMediaCount = 0;

  try {
    let after: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const args: Record<string, unknown> = {
        ig_user_id: igUserId,
        limit: 100,
        fields: "id,media_type,media_product_type",
      };
      if (after) args.after = after;

      const mediaRes = await composioFetch(
        "INSTAGRAM_GET_IG_USER_MEDIA",
        entityId,
        args,
      );
      const responseData = (mediaRes?.data ?? {}) as Record<string, unknown>;
      const rawItems: any[] = (responseData.data as any[]) ?? [];
      const paging = (responseData.paging ?? {}) as {
        cursors?: { after?: string };
      };

      // Fetch insights for each media item in chunks of 5
      for (let i = 0; i < rawItems.length; i += 5) {
        const chunk = rawItems.slice(i, i + 5);
        const chunkResults = await Promise.allSettled(
          chunk.map(async (item) => {
            try {
              const insightRes = await composioFetch(
                "INSTAGRAM_GET_IG_MEDIA_INSIGHTS",
                entityId,
                {
                  ig_media_id: item.id,
                  metric: ["views", "reach"],
                  period: "lifetime",
                },
              );
              const rows: any[] =
                ((insightRes?.data as Record<string, unknown>)
                  ?.data as any[]) ?? [];
              let views = 0;
              for (const r of rows) {
                if (r.name === "views") {
                  const vals = r.values ?? [];
                  views = vals[0]?.value ?? vals[0]?.total_value?.value ?? 0;
                }
              }
              return views;
            } catch {
              return 0;
            }
          }),
        );

        for (const r of chunkResults) {
          if (r.status === "fulfilled" && r.value > 0) {
            totalViews += BigInt(r.value);
            totalMediaCount++;
          }
        }
      }

      hasMore = !!paging.cursors?.after;
      // Limit to 500 items to avoid too many API calls
      if (totalMediaCount >= 500) break;
    }
  } catch {
    // media insights optional
  }

  const avgViews =
    totalMediaCount > 0 ? Number(totalViews) / totalMediaCount : 0;

  // 3. Upsert snapshot
  await prisma.accountAnalytics.upsert({
    where: {
      socialAccountId_snapshotDate: {
        socialAccountId,
        snapshotDate: today,
      },
    },
    update: {
      followerCount,
      totalReach,
      totalImpressions,
      totalViews,
      totalMediaCount,
      avgViews,
    },
    create: {
      socialAccountId,
      userId,
      followerCount,
      totalReach,
      totalImpressions,
      totalViews,
      totalMediaCount,
      avgViews,
      snapshotDate: today,
    },
  });
}

/**
 * Ensure today's snapshot exists. Call this from the dashboard route
 * so analytics data accumulates over time.
 */
export async function ensureInstagramSnapshot(userId: string): Promise<void> {
  const socialAccount = await prisma.socialAccount.findFirst({
    where: {
      userId,
      platform: "instagram",
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!socialAccount) return;

  const entityId = socialAccount.connectedId;
  const igUserId = socialAccount.igUserId;
  if (!entityId || !igUserId) return;

  await takeInstagramSnapshot(socialAccount.id, userId, entityId, igUserId);
}
