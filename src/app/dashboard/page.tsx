import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RetryClipUploadButton, RetryVideoButton } from "@/components/retry-actions";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const [totalVideos, totalClips, completedUploads, failedVideos, failedUploads, recentVideos] = await prisma.$transaction([
    prisma.video.count({
      where: {
        userId: user.id,
      },
    }),
    prisma.clip.count({
      where: {
        userId: user.id,
      },
    }),
    prisma.uploadTarget.count({
      where: {
        userId: user.id,
        uploadStatus: "completed",
      },
    }),
    prisma.video.findMany({
      where: {
        userId: user.id,
        status: "failed",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 4,
    }),
    prisma.uploadTarget.findMany({
      where: {
        userId: user.id,
        platform: "tiktok",
        uploadStatus: "failed",
      },
      include: {
        clip: {
          include: {
            video: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 4,
    }),
    prisma.video.findMany({
      where: {
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            clips: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 6,
    }),
  ]);
  const failedTaskCount = failedVideos.length + failedUploads.length;

  return (
    <AppShell
      eyebrow="Mission Control"
      title="Track every clip from raw video to TikTok-ready."
      description="The dashboard now reads live task data, surfaces worker failures, and keeps retry actions close to the error."
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Videos" value={String(totalVideos)} />
        <StatCard label="Clips Generated" value={String(totalClips)} tone="moss" />
        <StatCard label="Uploads Complete" value={String(completedUploads)} tone="steel" />
        <StatCard label="Failed Items" value={String(failedTaskCount)} tone="ember" />
      </div>

      {failedTaskCount ? (
        <section className="mt-6 rounded-[2rem] border border-[#d45f47] bg-[#ffe4dc] p-6 shadow-[0_24px_80px_rgba(138,45,29,0.12)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8a2d1d]">Needs attention</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#5c1f13]">Failed work is waiting for a retry.</h2>
            </div>
            <Link href="/videos" className="rounded-full border border-[#d45f47] bg-[#fffaf0] px-4 py-2 text-sm font-black text-[#8a2d1d] transition hover:-translate-y-0.5">
              Open ledger
            </Link>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {failedVideos.map((video) => (
              <article key={video.id} className="grid gap-3 rounded-3xl border border-[#d45f47] bg-[#fffaf0]/85 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={video.status} />
                  <StatusBadge status="video task" />
                </div>
                <div>
                  <h3 className="font-black tracking-[-0.03em]">{video.title || video.sourceUrl || "Untitled video"}</h3>
                  {video.errorMessage ? <p className="mt-1 text-sm font-bold text-[#8a2d1d]">{video.errorMessage}</p> : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href={`/videos/${video.id}`} className="rounded-full border border-[color:var(--line)] px-4 py-2 text-center text-sm font-black transition hover:border-[color:var(--ember)] hover:text-[color:var(--ember)]">
                    View
                  </Link>
                  <RetryVideoButton id={video.id} compact />
                </div>
              </article>
            ))}

            {failedUploads.map((target) => (
              <article key={target.id} className="grid gap-3 rounded-3xl border border-[#d45f47] bg-[#fffaf0]/85 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status="tiktok failed" />
                  <StatusBadge status="upload task" />
                </div>
                <div>
                  <h3 className="font-black tracking-[-0.03em]">{target.clip.title || target.clip.video.title || "TikTok upload"}</h3>
                  {target.errorMessage ? <p className="mt-1 text-sm font-bold text-[#8a2d1d]">{target.errorMessage}</p> : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href={`/videos/${target.clip.videoId}`} className="rounded-full border border-[color:var(--line)] px-4 py-2 text-center text-sm font-black transition hover:border-[color:var(--ember)] hover:text-[color:var(--ember)]">
                    View
                  </Link>
                  <RetryClipUploadButton id={target.clipId} compact />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <div className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.10)] backdrop-blur">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">Recent task pulse</h2>
              <p className="text-sm text-[color:var(--muted)]">Live video tasks ordered by latest activity.</p>
            </div>
            <Link href="/videos/new" className="rounded-full bg-[color:var(--ember)] px-4 py-2 text-sm font-black text-[#fffaf0] transition hover:-translate-y-0.5">
              Add Video
            </Link>
          </div>

          <div className="grid gap-3">
            {recentVideos.length ? (
              recentVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="grid gap-3 rounded-3xl border border-[color:var(--line)] bg-[#fffaf0]/70 p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--ember)] md:grid-cols-[1fr_auto] md:items-center"
                >
                  <span>
                    <span className="block text-lg font-black tracking-[-0.03em]">{video.title || video.sourceUrl || video.sourceStoragePath || "Untitled video task"}</span>
                    <span className="text-sm text-[color:var(--muted)]">
                      {video._count.clips} clip{video._count.clips === 1 ? "" : "s"} - Updated {formatDate(video.updatedAt)}
                    </span>
                    {video.errorMessage ? <span className="mt-1 block text-sm font-bold text-[#8a2d1d]">{video.errorMessage}</span> : null}
                  </span>
                  <StatusBadge status={video.status} />
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-[color:var(--line)] bg-[#fffaf0]/70 p-6 text-center">
                <p className="font-black">No video tasks yet.</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">Create a task to start filling the worker timeline.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--ink)] p-6 text-[#fffaf0] shadow-[0_24px_80px_rgba(30,26,21,0.18)]">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-[#f2a17f]">Operator note</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">Watch the workers, not just the UI.</h2>
          <p className="mt-4 leading-7 text-[#e8ddc8]">
            Use <code className="rounded bg-[#fffaf0]/10 px-1 py-0.5">npm run worker:health</code> to confirm Redis queues and database job counts before retrying failed work.
          </p>
        </aside>
      </section>
    </AppShell>
  );
}
