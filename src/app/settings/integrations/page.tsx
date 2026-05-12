import { AppShell } from "@/components/app-shell";

const integrations = [
  {
    name: "Composio TikTok",
    status: "Not connected",
    note: "OAuth connection and real uploads are planned for the Composio phase.",
  },
  {
    name: "OpusClip Session",
    status: "Not configured",
    note: "Saved Playwright storage state will be used by a worker, not API routes.",
  },
  {
    name: "Storage Provider",
    status: "Supabase adapter ready",
    note: "Server-side uploads use Supabase Storage now. Cloudflare R2 can be added behind the same storage interface later.",
  },
  {
    name: "Redis Queue",
    status: "Pending Phase 2",
    note: "BullMQ will process jobs outside the HTTP request lifecycle.",
  },
];

export default function IntegrationsPage() {
  return (
    <AppShell
      eyebrow="Settings"
      title="Keep credentials server-side and integrations replaceable."
      description="This page names the integration seams without pretending anything is connected before the relevant phases are implemented."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <article key={integration.name} className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.08)] backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--moss)]">{integration.status}</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">{integration.name}</h2>
            <p className="mt-4 leading-7 text-[color:var(--muted)]">{integration.note}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
