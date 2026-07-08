import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DashboardCharts } from "@/components/dashboard-charts";
import { PlatformSummaryCards } from "@/components/platform-summary-cards";
import { RecentPostsTable } from "@/components/recent-posts-table";
import { requireCurrentUser } from "@/lib/auth";
import { logPerformanceEvent } from "@/lib/observability/performance";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function DashboardPage() {
  const startedAt = performance.now();
  const authStartedAt = performance.now();
  const user = await requireCurrentUser();
  const authDurationMs = performance.now() - authStartedAt;
  const queryStartedAt = performance.now();

  const activeSocialAccounts = await prisma.socialAccount.findMany({
    where: { userId: user.id, isActive: true },
  });

  const connectedPlatforms = Array.from(
    new Set(activeSocialAccounts.map((a) => a.platform.toLowerCase())),
  );

  const analyticsMap = new Map<
    string,
    { followerCount: bigint; totalMediaCount: number }
  >();
  const analyticsRows = await prisma.accountAnalytics.findMany({
    where: {
      userId: user.id,
      socialAccountId: { in: activeSocialAccounts.map((a) => a.id) },
    },
    orderBy: { snapshotDate: "desc" },
  });
  for (const row of analyticsRows) {
    if (!analyticsMap.has(row.socialAccountId)) {
      analyticsMap.set(row.socialAccountId, {
        followerCount: row.followerCount,
        totalMediaCount: Number(row.totalMediaCount),
      });
    }
  }

  const [
    totalVideos,
    totalClips,
    completedUploads,
    failedVideos,
    failedUploads,
    recentVideos,
    recentUploadTargets,
  ] = await prisma.$transaction([
    prisma.video.count({ where: { userId: user.id } }),
    prisma.clip.count({ where: { userId: user.id } }),
    prisma.uploadTarget.count({
      where: { userId: user.id, uploadStatus: "completed" },
    }),
    prisma.video.findMany({
      where: { userId: user.id, status: "failed" },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.uploadTarget.findMany({
      where: {
        userId: user.id,
        uploadStatus: "failed",
        platform: { in: connectedPlatforms },
      },
      include: { clip: { include: { video: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.video.findMany({
      where: { userId: user.id },
      include: { _count: { select: { clips: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.uploadTarget.findMany({
      where: {
        userId: user.id,
        platform: { in: connectedPlatforms },
        uploadStatus: "completed",
      },
      include: { clip: { include: { video: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);
  const queryDurationMs = performance.now() - queryStartedAt;
  const totalDurationMs = performance.now() - startedAt;
  const failedTaskCount = failedVideos.length + failedUploads.length;

  logPerformanceEvent("dashboard.render.completed", {
    authDurationMs: Math.round(authDurationMs),
    queryDurationMs: Math.round(queryDurationMs),
    totalDurationMs: Math.round(totalDurationMs),
    failedTaskCount,
    recentVideoCount: recentVideos.length,
  });

  return (
    <AppShell
      eyebrow="Mission Control"
      title="Track every clip from raw video to TikTok-ready."
      description="The dashboard now reads live task data, surfaces worker failures, and keeps retry actions close to the error."
    >
      {/* Sub-header matching Figma */}
      <div className="mb-5 flex items-center justify-between rounded-lg border border-[rgba(231,188,75,0.18)] bg-[#032e1a] px-5 py-3">
        <div className="flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-display)] text-sm font-bold text-white">
            Overview
          </h1>
          <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
            {new Date().toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#b8d4c2]">
              <svg
                aria-hidden="true"
                className="size-3.5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="m16 16 4 4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search posts..."
              suppressHydrationWarning
              className="h-8 w-44 rounded-md border border-[rgba(231,188,75,0.18)] bg-[#032e1a] pl-7 pr-3 font-[family-name:var(--font-mono)] text-xs text-white outline-none transition placeholder:text-[#b8d4c2] focus:border-[rgba(231,188,75,0.35)]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Videos"
            value={String(totalVideos)}
            trend={{ value: 0, label: "vs last week" }}
          />
          <StatCard
            label="Clips Generated"
            value={String(totalClips)}
            tone="moss"
            trend={{ value: 5, label: "vs last week" }}
          />
          <StatCard
            label="Uploads Complete"
            value={String(completedUploads)}
            tone="steel"
            trend={{ value: 2, label: "vs last week" }}
          />
          <StatCard
            label="Failed Items"
            value={String(failedTaskCount)}
            tone="ember"
            trend={{
              value: failedTaskCount > 0 ? -3 : 0,
              label: "vs last week",
            }}
          />
        </div>

        {/* Recent task pulse */}
        <section className="rounded-lg border border-[rgba(231,188,75,0.18)] bg-[#032e1a] p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-black tracking-[-0.04em] text-white">
                Recent task pulse
              </h2>
              <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
                Live video tasks ordered by latest activity.
              </p>
            </div>
            <Link
              href="/videos/new"
              className="inline-flex min-h-0 items-center justify-center gap-2 rounded-md bg-[#e7bc4b] px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.18em] text-[#022a18] transition hover:-translate-y-0.5 hover:bg-[#f5d78a]"
            >
              Add video
            </Link>
          </div>

          <div className="space-y-3">
            {recentVideos.length ? (
              recentVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-[rgba(231,188,75,0.18)] bg-[rgba(3,46,26,0.70)] px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-[rgba(231,188,75,0.40)]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-[family-name:var(--font-display)] text-sm font-bold text-white leading-snug">
                      {video.title ||
                        video.sourceUrl ||
                        video.sourceStoragePath ||
                        "Untitled video task"}
                    </div>
                    <div className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
                      {video._count.clips} clip
                      {video._count.clips === 1 ? "" : "s"} · Updated{" "}
                      {formatDate(video.updatedAt)}
                    </div>
                  </div>
                  <StatusBadge status={video.status} />
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[rgba(231,188,75,0.18)] bg-[rgba(3,46,26,0.70)] p-6 text-center">
                <p className="font-[family-name:var(--font-display)] font-black tracking-[-0.04em] text-white">
                  No video tasks yet.
                </p>
                <p className="mt-1 text-sm text-[#b8d4c2]">
                  Create a task to start filling the worker timeline.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Charts */}
        <DashboardCharts enabledPlatforms={connectedPlatforms} />

        {/* Recent Uploads Table */}
        <RecentPostsTable
          posts={recentUploadTargets.map((ut) => ({
            id: ut.id,
            platform: ut.platform.toLowerCase(),
            content:
              (ut as any).clip?.title ||
              (ut as any).clip?.video?.title ||
              "Untitled upload",
            time: formatDate(ut.createdAt),
            views: "—",
            likes: "—",
            comments: "—",
            shares: "—",
            change: "—",
            trend: "up",
          }))}
        />

        {/* Platform Summary Cards */}
        <PlatformSummaryCards
          items={activeSocialAccounts.map((account) => {
            const analytics = analyticsMap.get(account.id);
            return {
              platform: account.platform.toLowerCase() as any,
              followers: analytics
                ? Number(analytics.followerCount).toLocaleString()
                : "—",
              engagement: "—",
              posts: Number(analytics?.totalMediaCount ?? 0),
            };
          })}
        />

        {/* Operator Note Section */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-lg border border-[rgba(231,188,75,0.18)] bg-[#032e1a] p-5">
            <p className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase leading-4 tracking-[0.25em] text-[#e7bc4b]">
              Operator note
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white">
              Watch the workers, not just the UI.
            </h2>
            <p className="mt-4 leading-7 text-[#b8d4c2]">
              Use{" "}
              <code className="rounded bg-[rgba(231,188,75,0.10)] px-1 py-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[#e7bc4b]">
                npm run worker:health
              </code>{" "}
              to confirm Redis queues and database job counts before retrying
              failed work.
            </p>
          </div>
          <div className="lg:col-span-1 rounded-lg border border-[rgba(231,188,75,0.18)] bg-[#032e1a] p-5">
            <div className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase leading-4 tracking-[0.25em] text-[#b8d4c2]">
                System telemetry
              </p>
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-[#e7bc4b]" />
                <span className="size-1.5 rounded-full bg-[#e7bc4b]" />
                <span className="size-1.5 rounded-full bg-[#e7bc4b]" />
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="flex items-end justify-between">
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase text-[#b8d4c2]">
                  Reap limit
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium text-[#e7bc4b]">
                  10 req/min
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[64%] bg-[#e7bc4b]" />
              </div>
              <div className="flex items-end justify-between">
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase text-[#b8d4c2]">
                  Queue engine
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium text-[#39ff14]">
                  BullMQ
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[42%] bg-[#39ff14]" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
