import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { RetryVideoButton } from "@/components/retry-actions";
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

export default async function VideosPage() {
  const user = await requireCurrentUser();
  const videos = await prisma.video.findMany({
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
      createdAt: "desc",
    },
  });

  return (
    <AppShell
      eyebrow="Task Ledger"
      title="Every source video, lined up for clipping."
      description="The ledger is database-backed now, with inline errors and retry controls for failed or cancelled video tasks."
    >
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-[0_24px_80px_rgba(30,26,21,0.10)] backdrop-blur">
        <div className="mb-4 flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-black tracking-[-0.04em]">Video tasks</h2>
          <Link href="/videos/new" className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-black text-[#fffaf0] transition hover:-translate-y-0.5 hover:bg-[color:var(--ember)]">
            Add Video
          </Link>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--line)]">
          <div className="hidden grid-cols-[1.15fr_0.9fr_0.45fr_0.6fr_auto] gap-4 bg-[color:var(--ink)] px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-[#fffaf0] md:grid">
            <span>Video</span>
            <span>Source</span>
            <span>Clips</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {videos.length ? (
            videos.map((video) => (
              <article key={video.id} className="grid gap-4 border-t border-[color:var(--line)] bg-[#fffaf0]/80 p-5 md:grid-cols-[1.15fr_0.9fr_0.45fr_0.6fr_auto] md:items-center">
                <div>
                  <h3 className="text-lg font-black tracking-[-0.03em]">{video.title || "Untitled video task"}</h3>
                  <p className="text-sm text-[color:var(--muted)]">Created {formatDate(video.createdAt)}</p>
                  {video.errorMessage ? <p className="mt-2 rounded-2xl border border-[#d45f47] bg-[#ffe4dc] px-3 py-2 text-sm font-bold text-[#8a2d1d]">{video.errorMessage}</p> : null}
                </div>
                <p className="truncate text-sm text-[color:var(--muted)]">{video.sourceUrl || video.sourceStoragePath || "No source recorded"}</p>
                <p className="font-black">{video._count.clips}</p>
                <StatusBadge status={video.status} />
                <div className="flex flex-col gap-2">
                  <Link href={`/videos/${video.id}`} className="rounded-full border border-[color:var(--line)] px-4 py-2 text-center text-sm font-black transition hover:border-[color:var(--ember)] hover:text-[color:var(--ember)]">
                    View
                  </Link>
                  {["failed", "cancelled"].includes(video.status) ? <RetryVideoButton id={video.id} compact /> : null}
                </div>
              </article>
            ))
          ) : (
            <div className="border-t border-[color:var(--line)] bg-[#fffaf0]/80 p-8 text-center">
              <p className="text-2xl font-black tracking-[-0.04em]">No video tasks yet.</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[color:var(--muted)]">Create a URL or file upload task and the queue will appear here with retryable failure states.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
