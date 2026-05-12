import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

type VideoDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = await params;

  return (
    <AppShell
      eyebrow="Video Detail"
      title="Inspect the task timeline and clip outputs."
      description="The database schema supports logs, jobs, clips, and upload targets. This detail view is a Phase 1 shell for those records."
    >
      <div className="grid gap-6 lg:grid-cols-[0.82fr_1fr]">
        <section className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.10)] backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--moss)]">Task ID</p>
          <h2 className="mt-3 break-all text-3xl font-black tracking-[-0.05em]">{id}</h2>
          <div className="mt-6">
            <StatusBadge status="queued" />
          </div>
          <div className="mt-6 grid gap-3 text-sm leading-7 text-[color:var(--muted)]">
            <p>Source metadata, retry counts, and worker error details will render here once connected to the API response.</p>
            <p>Use the retry endpoint only for failed or cancelled tasks; the skeleton guards against retrying active work.</p>
          </div>
          <form action={`/api/videos/${id}/retry`} method="post" className="mt-6">
            <button className="w-full rounded-2xl bg-[color:var(--ember)] px-5 py-3 font-black text-[#fffaf0] transition hover:-translate-y-0.5" type="submit">
              Retry task
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-[color:var(--line)] bg-[#fffaf0]/80 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--moss)]">Clip Review</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">No clips generated yet</h2>
            </div>
            <Link href="/videos" className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-black transition hover:border-[color:var(--ember)] hover:text-[color:var(--ember)]">
              Back to list
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            {["Task created", "Queued for OpusClip worker", "Awaiting Phase 2 worker implementation"].map((item) => (
              <div key={item} className="rounded-2xl border border-[color:var(--line)] bg-[#f7f1e3] px-4 py-3 text-sm font-bold text-[color:var(--steel)]">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
