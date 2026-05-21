import { AppShell } from "@/components/app-shell";
import { requireCurrentUser } from "@/lib/auth";
import { getIntegrations } from "@/lib/reap/api";
import { getReapConfig } from "@/lib/reap/config";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const user = await requireCurrentUser();

  let reapIntegrations: { id: string; platform: string; isActive: boolean; username: string; name: string }[] = [];
  let reapError: string | null = null;
  let reapConnected = false;

  try {
    const config = getReapConfig();
    if (config.apiKey) {
      const response = await getIntegrations();
      reapIntegrations = response.integrations.map((i) => ({
        id: i.id,
        platform: i.platform,
        isActive: i.isActive,
        username: i.username,
        name: i.name,
      }));
      reapConnected = true;
    }
  } catch (error) {
    reapError = error instanceof Error ? error.message : "Failed to check Reap integrations.";
  }

  const tiktokIntegration = reapIntegrations.find((i) => i.platform === "tiktok" && i.isActive);

  return (
    <AppShell
      eyebrow="Settings"
      title="Reap clips, publish to TikTok."
      description="Connect your Reap account and TikTok integration to start clipping and publishing."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.08)] backdrop-blur">
          <p className={`text-xs font-black uppercase tracking-[0.28em] ${reapConnected ? "text-[color:var(--moss)]" : "text-[#c49d3c]"}`}>
            {reapConnected ? "Connected" : "Not configured"}
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Reap API</h2>
          <p className="mt-4 leading-7 text-[color:var(--muted)]">
            {reapConnected
              ? "Your REAP_API_KEY is set. The worker can create clips and publish to TikTok through Reap."
              : "Set REAP_API_KEY in your .env file to enable clip generation and TikTok publishing."}
          </p>
          {reapError && (
            <p className="mt-2 text-sm font-bold text-[#8a2d1d]">{reapError}</p>
          )}
        </article>

        <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.08)] backdrop-blur">
          <p className={`text-xs font-black uppercase tracking-[0.28em] ${tiktokIntegration ? "text-[color:var(--moss)]" : "text-[#d45f47]"}`}>
            {tiktokIntegration ? "Active" : "Not connected"}
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">TikTok (via Reap)</h2>
          <p className="mt-4 leading-7 text-[color:var(--muted)]">
            {tiktokIntegration
              ? `Connected as @${tiktokIntegration.username}. Clips can be published directly to TikTok.`
              : "Connect your TikTok account at reap.video/settings/integrations to enable publishing."}
          </p>
        </article>

        <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.08)] backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--moss)]">Ready</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Storage Provider</h2>
          <p className="mt-4 leading-7 text-[color:var(--muted)]">
            Server-side uploads use Supabase Storage. Cloudflare R2 can be added behind the same storage interface later.
          </p>
        </article>

        <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.08)] backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--moss)]">Active</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Redis / BullMQ</h2>
          <p className="mt-4 leading-7 text-[color:var(--muted)]">
            Jobs are enqueued in BullMQ and processed by background workers (reap, reap-polling, reap-publish).
          </p>
        </article>
      </div>
    </AppShell>
  );
}