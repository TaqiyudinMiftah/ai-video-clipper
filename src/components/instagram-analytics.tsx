"use client";

import { useState, useEffect, useMemo } from "react";

type AccountInsights = {
  reach?: number;
  impressions?: number;
  profileViews?: number;
  followerCount?: number;
};

type SnapshotPoint = {
  date: string;
  followers: number;
  avgViews: number;
  totalViews: number;
  totalReach: number;
  totalImpressions: number;
  totalMediaCount: number;
};

type PostInsights = {
  id: string;
  mediaType: string;
  mediaUrl?: string;
  permalink?: string;
  thumbnailUrl?: string;
  timestamp: string;
  caption?: string;
  likeCount?: number;
  commentsCount?: number;
  insights?: {
    views?: number;
    reach?: number;
    saved?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
};

export function InstagramAnalytics() {
  const [accountInsights, setAccountInsights] =
    useState<AccountInsights | null>(null);
  const [history, setHistory] = useState<SnapshotPoint[]>([]);
  const [posts, setPosts] = useState<PostInsights[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(14);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [insightsRes, historyRes, postsRes] = await Promise.all([
          fetch("/api/analytics/instagram?days=7"),
          fetch(`/api/analytics/instagram/history?days=${days}`),
          fetch("/api/analytics/instagram/posts?max=6"),
        ]);

        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          setAccountInsights(insightsData.insights ?? null);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setHistory(historyData.data ?? []);
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData.posts ?? []);
        }

        if (!insightsRes.ok && !historyRes.ok && !postsRes.ok) {
          const errData = insightsRes.ok
            ? historyRes.ok
              ? await postsRes.json()
              : await historyRes.json()
            : await insightsRes.json();
          throw new Error(
            (errData as { error?: string }).error ??
              "Failed to fetch Instagram analytics.",
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [days]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/analytics/instagram/snapshot", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Snapshot failed");
      const historyRes = await fetch(
        `/api/analytics/instagram/history?days=${days}`,
      );
      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Snapshot failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (n: number | undefined | null) => {
    if (n == null) return "-";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const latestFollowers = history[history.length - 1]?.followers ?? null;
  const firstFollowers = history[0]?.followers ?? null;
  const followerGrowth =
    latestFollowers != null && firstFollowers != null
      ? latestFollowers - firstFollowers
      : null;

  const avgViewsAll = useMemo(() => {
    if (!history.length) return null;
    const last = history[history.length - 1];
    return last.avgViews;
  }, [history]);

  if (loading) {
    return (
      <section className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl">
        <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#dffe00]">
          Instagram Analytics
        </p>
        <p className="mt-2 text-sm text-[#c6c9ab]">Loading...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl">
        <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#dffe00]">
          Instagram Analytics
        </p>
        <p className="mt-2 text-sm font-bold text-[#ffb4ab]">
          {error.includes("No connected Instagram account")
            ? "No Instagram account connected. Connect one in settings."
            : error}
        </p>
      </section>
    );
  }

  const chartWidth = 100;
  const chartHeight = 60;
  const followersValues = history.map((h) => h.followers);
  const maxFollowers = Math.max(...followersValues, 1);
  const minFollowers = Math.min(...followersValues, 0);

  const points = history.map((h, i) => {
    const x = history.length <= 1 ? 0 : (i / (history.length - 1)) * chartWidth;
    const y =
      maxFollowers === minFollowers
        ? chartHeight / 2
        : chartHeight -
          ((h.followers - minFollowers) / (maxFollowers - minFollowers)) *
            chartHeight;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  return (
    <section className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#dffe00]">
          Instagram Analytics
        </p>
        <div className="flex gap-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                days === d
                  ? "border border-[#dffe00] bg-[rgba(223,254,0,0.10)] text-[#dffe00]"
                  : "border border-transparent text-[#c6c9ab] hover:text-white"
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-1 rounded-md border border-[rgba(223,254,0,0.15)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#dffe00] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c6c9ab]">
              Followers
            </p>
            <div className="flex items-baseline gap-2">
              <p className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white">
                {formatNumber(latestFollowers)}
              </p>
              {followerGrowth != null && (
                <span
                  className={`text-[11px] font-bold ${
                    followerGrowth >= 0 ? "text-[#39ff14]" : "text-[#ffb4ab]"
                  }`}
                >
                  {followerGrowth >= 0 ? "▲" : "▼"}{" "}
                  {formatNumber(Math.abs(followerGrowth))} in {days} days
                </span>
              )}
            </div>
          </div>
          {avgViewsAll != null && (
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#c6c9ab]">
                Avg Views
              </p>
              <p className="font-[family-name:var(--font-display)] text-xl font-black tracking-[-0.04em] text-white">
                {formatNumber(Math.round(avgViewsAll))}
              </p>
            </div>
          )}
        </div>

        {history.length > 1 ? (
          <svg
            viewBox={`0 0 ${chartWidth + 10} ${chartHeight + 10}`}
            className="h-32 w-full"
          >
            <polyline
              fill="none"
              stroke="#dffe00"
              strokeWidth="2"
              points={`${points.map((p) => `${p.x + 5},${p.y + 5}`).join(" ")}`}
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x + 5}
                cy={p.y + 5}
                r="1.5"
                fill="#dffe00"
              />
            ))}
          </svg>
        ) : (
          <p className="text-xs text-[#c6c9ab]">
            Collecting data... Refresh again later to see the growth chart.
          </p>
        )}
      </div>

      {posts.length > 0 && (
        <div>
          <p className="mb-3 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.2em] text-[#c6c9ab]">
            Recent posts
          </p>
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 rounded-lg border border-[rgba(223,254,0,0.08)] bg-[rgba(30,32,32,0.70)] p-3"
              >
                {post.thumbnailUrl || post.mediaUrl ? (
                  <img
                    src={post.thumbnailUrl || post.mediaUrl}
                    alt=""
                    className="h-14 w-14 flex-shrink-0 rounded-md bg-black object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 flex-shrink-0 rounded-md bg-[linear-gradient(160deg,#0b0a09,#1e2020)]" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white">
                    {post.caption ? post.caption.slice(0, 60) : "Untitled post"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#c6c9ab]">
                    <span>❤️ {formatNumber(post.likeCount)}</span>
                    {post.insights?.views != null && (
                      <span>▶️ {formatNumber(post.insights.views)}</span>
                    )}
                    {post.insights?.reach != null && (
                      <span>👁️ {formatNumber(post.insights.reach)}</span>
                    )}
                    {post.insights?.saved != null && (
                      <span>🔖 {formatNumber(post.insights.saved)}</span>
                    )}
                    {post.insights?.shares != null && (
                      <span>↗️ {formatNumber(post.insights.shares)}</span>
                    )}
                  </div>
                </div>

                {post.permalink && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 rounded-md border border-[rgba(223,254,0,0.15)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#dffe00] transition hover:-translate-y-0.5"
                  >
                    View ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!accountInsights && history.length === 0 && posts.length === 0 && (
        <p className="text-sm text-[#c6c9ab]">
          No Instagram analytics data available yet. Click Refresh to take a
          snapshot.
        </p>
      )}
    </section>
  );
}
