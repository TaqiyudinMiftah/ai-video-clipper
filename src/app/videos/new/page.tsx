import { AppShell } from "@/components/app-shell";
import { VideoSubmitForm } from "@/components/video-submit-form";

export default function NewVideoPage() {
  return (
    <AppShell
      eyebrow="New Task"
      title="Drop in a source video and queue the first cut."
      description="Submit a URL or upload an MP4, MOV, or WEBM source file. Uploaded files are stored through the server-side storage service before queueing."
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_0.75fr]">
        <VideoSubmitForm />

        <aside className="rounded-[2rem] border border-[color:var(--line)] bg-[#fffaf0]/80 p-6">
          <h2 className="text-2xl font-black tracking-[-0.04em]">Phase 3 guardrails</h2>
          <div className="mt-5 grid gap-4 text-sm leading-7 text-[color:var(--muted)]">
            <p>Only TikTok is exposed as a target because the project brief keeps YouTube and Instagram out of this MVP slice.</p>
            <p>File uploads go through the server-side Supabase Storage adapter; service role keys never go to the browser.</p>
            <p>Playwright automation and Composio upload execution are still deliberately postponed to later phases.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
