import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

const placeholderVideos = [
  {
    id: "sample-video-1",
    title: "Founder interview upload",
    source: "https://example.com/founder-interview.mp4",
    status: "queued",
    clips: 0,
    createdAt: "Connect DATABASE_URL to load real tasks",
  },
  {
    id: "sample-video-2",
    title: "Product demo recording",
    source: "https://example.com/product-demo.mp4",
    status: "ready_to_upload",
    clips: 3,
    createdAt: "Sample row",
  },
];

export default function VideosPage() {
  return (
    <AppShell
      eyebrow="Task Ledger"
      title="Every source video, lined up for clipping."
      description="This page is ready for real data once the local PostgreSQL database is migrated. The API route at /api/videos already exposes the database-backed list."
    >
      <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-[0_24px_80px_rgba(30,26,21,0.10)] backdrop-blur">
        <div className="mb-4 flex flex-col gap-3 p-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-black tracking-[-0.04em]">Video tasks</h2>
          <Link href="/videos/new" className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-black text-[#fffaf0] transition hover:-translate-y-0.5 hover:bg-[color:var(--ember)]">
            Add Video
          </Link>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-[color:var(--line)]">
          <div className="hidden grid-cols-[1.2fr_0.9fr_0.5fr_0.6fr_auto] gap-4 bg-[color:var(--ink)] px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-[#fffaf0] md:grid">
            <span>Video</span>
            <span>Source</span>
            <span>Clips</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {placeholderVideos.map((video) => (
            <article key={video.id} className="grid gap-4 border-t border-[color:var(--line)] bg-[#fffaf0]/80 p-5 md:grid-cols-[1.2fr_0.9fr_0.5fr_0.6fr_auto] md:items-center">
              <div>
                <h3 className="text-lg font-black tracking-[-0.03em]">{video.title}</h3>
                <p className="text-sm text-[color:var(--muted)]">{video.createdAt}</p>
              </div>
              <p className="truncate text-sm text-[color:var(--muted)]">{video.source}</p>
              <p className="font-black">{video.clips}</p>
              <StatusBadge status={video.status} />
              <Link href={`/videos/${video.id}`} className="rounded-full border border-[color:var(--line)] px-4 py-2 text-center text-sm font-black transition hover:border-[color:var(--ember)] hover:text-[color:var(--ember)]">
                View
              </Link>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
