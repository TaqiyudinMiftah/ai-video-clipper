import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";

const recentTasks = [
  { id: "sample-video-1", title: "Founder interview upload", status: "queued", detail: "Awaiting OpusClip worker" },
  { id: "sample-video-2", title: "Product demo recording", status: "ready_to_upload", detail: "3 clips ready for review" },
  { id: "sample-video-3", title: "Launch webinar", status: "failed", detail: "Retry available after worker setup" },
];

export default function DashboardPage() {
  return (
    <AppShell
      eyebrow="Mission Control"
      title="Track every clip from raw video to TikTok-ready."
      description="Phase 1 lays down the dashboard, task APIs, and schema. Worker automation, storage, and Composio uploads are intentionally placeholders for later phases."
    >
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Videos" value="0" />
        <StatCard label="Clips Generated" value="0" tone="moss" />
        <StatCard label="Uploads Complete" value="0" tone="steel" />
        <StatCard label="Failed Tasks" value="0" tone="ember" />
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <div className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.10)] backdrop-blur">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">Recent task pulse</h2>
              <p className="text-sm text-[color:var(--muted)]">Sample rows until the database is connected locally.</p>
            </div>
            <Link href="/videos/new" className="rounded-full bg-[color:var(--ember)] px-4 py-2 text-sm font-black text-[#fffaf0] transition hover:-translate-y-0.5">
              Add Video
            </Link>
          </div>

          <div className="grid gap-3">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                href={`/videos/${task.id}`}
                className="grid gap-3 rounded-3xl border border-[color:var(--line)] bg-[#fffaf0]/70 p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--ember)] md:grid-cols-[1fr_auto] md:items-center"
              >
                <span>
                  <span className="block text-lg font-black tracking-[-0.03em]">{task.title}</span>
                  <span className="text-sm text-[color:var(--muted)]">{task.detail}</span>
                </span>
                <StatusBadge status={task.status} />
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--ink)] p-6 text-[#fffaf0] shadow-[0_24px_80px_rgba(30,26,21,0.18)]">
          <p className="text-xs font-black uppercase tracking-[0.34em] text-[#f2a17f]">Next up</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.06em]">Queue and worker wiring.</h2>
          <p className="mt-4 leading-7 text-[#e8ddc8]">
            The API creates job records now. In Phase 2 we will connect Redis and BullMQ so these jobs leave the runway and reach a worker.
          </p>
        </aside>
      </section>
    </AppShell>
  );
}
