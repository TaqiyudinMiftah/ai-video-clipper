import { composioFetch } from "./fetch";

export type InstagramMediaItem = {
  id: string;
  mediaType: string;
  mediaUrl?: string;
  permalink?: string;
  thumbnailUrl?: string;
  timestamp: string;
  caption?: string;
  likeCount?: number;
  commentsCount?: number;
  mediaProductType?: string;
};

export type InstagramMediaInsights = {
  views?: number;
  reach?: number;
  saved?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  totalInteractions?: number;
  igReelsAvgWatchTime?: number;
  igReelsVideoViewTotalTime?: number;
  reelsSkipRate?: number;
};

export type InstagramUserInsights = {
  reach?: number;
  impressions?: number;
  profileViews?: number;
  followerCount?: number;
  emailContacts?: number;
  phoneCallClicks?: number;
  textMessageClicks?: number;
  getDirectionClicks?: number;
  websiteClicks?: number;
  profileLinks?: number;
};

export type InstagramAccountInfo = {
  id: string;
  username: string;
  name?: string;
  biography?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followsCount?: number;
  mediaCount?: number;
};

/**
 * Fetch Instagram account info for a connected account.
 */
export async function getInstagramAccountInfo(
  entityId: string,
): Promise<InstagramAccountInfo> {
  const res = await composioFetch("INSTAGRAM_GET_USER_INFO", entityId, {
    ig_user_id: "me",
    fields:
      "id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count",
  });

  const data = (res?.data ?? {}) as Record<string, unknown>;
  return {
    id: (data.id as string) ?? "",
    username: (data.username as string) ?? "",
    name: (data.name as string) ?? "",
    biography: (data.biography as string) ?? "",
    profilePictureUrl: (data.profile_picture_url as string) ?? "",
    followersCount: (data.followers_count as number) ?? undefined,
    followsCount: (data.follows_count as number) ?? undefined,
    mediaCount: (data.media_count as number) ?? undefined,
  };
}

/**
 * Fetch recent media items with pagination.
 */
export async function getInstagramMedia(
  entityId: string,
  options: {
    igUserId: string;
    limit?: number;
    after?: string;
    since?: number;
    until?: number;
  },
): Promise<{ items: InstagramMediaItem[]; after?: string; before?: string }> {
  const { igUserId, limit = 25, after, since, until } = options;

  const args: Record<string, unknown> = {
    ig_user_id: igUserId,
    limit,
    fields:
      "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,comments_count,like_count,media_product_type",
  };
  if (after) args.after = after;
  if (since) args.since = since;
  if (until) args.until = until;

  const res = await composioFetch(
    "INSTAGRAM_GET_IG_USER_MEDIA",
    entityId,
    args,
  );

  const responseData = (res?.data ?? {}) as Record<string, unknown>;
  const rawItems: any[] = (responseData.data as any[]) ?? [];
  const paging = (responseData.paging ?? {}) as {
    cursors?: { after?: string; before?: string };
  };

  const items: InstagramMediaItem[] = rawItems.map((raw: any) => ({
    id: raw.id ?? "",
    mediaType: raw.media_type ?? "",
    mediaUrl: raw.media_url ?? undefined,
    permalink: raw.permalink ?? undefined,
    thumbnailUrl: raw.thumbnail_url ?? undefined,
    timestamp: raw.timestamp ?? "",
    caption: raw.caption ?? undefined,
    likeCount: raw.like_count ?? undefined,
    commentsCount: raw.comments_count ?? undefined,
    mediaProductType: raw.media_product_type ?? undefined,
  }));

  return {
    items,
    after: paging.cursors?.after ?? undefined,
    before: paging.cursors?.before ?? undefined,
  };
}

/**
 * Fetch insights for a specific media item.
 * Only available for Business/Creator accounts with 1000+ followers.
 */
export async function getInstagramMediaInsights(
  entityId: string,
  igMediaId: string,
): Promise<InstagramMediaInsights> {
  const metrics = [
    "views",
    "reach",
    "saved",
    "likes",
    "comments",
    "shares",
    "total_interactions",
    "ig_reels_video_view_total_time",
    "ig_reels_avg_watch_time",
    "reels_skip_rate",
  ];

  const res = await composioFetch("INSTAGRAM_GET_IG_MEDIA_INSIGHTS", entityId, {
    ig_media_id: igMediaId,
    metric: metrics,
    period: "lifetime",
  });

  const rows: any[] =
    ((res?.data as Record<string, unknown>)?.data as any[]) ?? [];
  const map: Record<string, number> = {};

  for (const row of rows) {
    const name = row.name;
    if (!name) continue;
    const values = row.values ?? [];
    let val: number | undefined;
    if (values.length > 0) {
      val = values[0].value ?? values[0].total_value?.value;
    }
    if (val !== undefined && val !== null) {
      const key = name
        .replace(/_([a-z])/g, (_match: string, l: string) => l.toUpperCase())
        .replace(/^./, (c: string) => c.toLowerCase());
      map[key] = val;
    }
  }

  return map as unknown as InstagramMediaInsights;
}

/**
 * Fetch account-level insights for a date range.
 */
export async function getInstagramAccountInsights(
  entityId: string,
  igUserId: string,
  since: number,
  until: number,
): Promise<InstagramUserInsights> {
  const metrics = [
    "reach",
    "impressions",
    "profile_views",
    "follower_count",
    "email_contacts",
    "phone_call_clicks",
    "text_message_clicks",
    "get_direction_clicks",
    "website_clicks",
    "profile_links",
  ];

  const res = await composioFetch("INSTAGRAM_GET_USER_INSIGHTS", entityId, {
    ig_user_id: igUserId,
    metric: metrics,
    period: "day",
    since,
    until,
  });

  const rows: any[] =
    ((res?.data as Record<string, unknown>)?.data as any[]) ?? [];
  const map: Record<string, number> = {};

  for (const row of rows) {
    const name = row.name;
    if (!name) continue;
    const values = row.values ?? [];
    let total = 0;
    for (const v of values) {
      total += v.value ?? 0;
    }
    const key = name
      .replace(/_([a-z])/g, (_match: string, l: string) => l.toUpperCase())
      .replace(/^./, (c: string) => c.toLowerCase());
    map[key] = total;
  }

  return map as unknown as InstagramUserInsights;
}

/**
 * Get combined media + insights for the most recent posts.
 * @param maxPosts Max number of recent posts to fetch insights for (capped at 25)
 */
export async function getInstagramRecentPostsWithInsights(
  entityId: string,
  igUserId: string,
  maxPosts: number = 12,
): Promise<Array<InstagramMediaItem & { insights?: InstagramMediaInsights }>> {
  // Step 1: fetch recent media
  const { items } = await getInstagramMedia(entityId, {
    igUserId,
    limit: Math.min(maxPosts, 25),
  });

  if (items.length === 0) return [];

  // Step 2: fetch insights in parallel (limited concurrency)
  const CHUNK_SIZE = 5;
  const results: Array<
    InstagramMediaItem & { insights?: InstagramMediaInsights }
  > = [];

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const chunkResults = await Promise.allSettled(
      chunk.map(async (item) => {
        try {
          const insights = await getInstagramMediaInsights(entityId, item.id);
          return { ...item, insights };
        } catch {
          return { ...item, insights: undefined };
        }
      }),
    );

    for (const result of chunkResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({ ...chunk[results.length], insights: undefined });
      }
    }
  }

  return results;
}
