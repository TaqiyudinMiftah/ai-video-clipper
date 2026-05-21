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

        <article className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.08)] backdrop-blur md:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#c49d3c]">Setup Required</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">Reap Webhook</h2>
          <p className="mt-4 leading-7 text-[color:var(--muted)]">
            Configure Reap to send webhooks to your app so clips are downloaded automatically when processing completes.
            Without webhooks, clips will only download via the polling worker (slower).
          </p>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[color:var(--line)] bg-[#fffaf0]/70 p-4">
              <p className="font-black text-[color:var(--steel)]">For Local Development (ngrok)</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[color:var(--muted)]">
                <li>Install ngrok: <code className="rounded bg-[#fffaf0]/10 px-1 py-0.5">npm install -g ngrok</code> atau download dari ngrok.com</li>
                <li>Login ke ngrok: <code className="rounded bg-[#fffaf0]/10 px-1 py-0.5">ngrok config add-authtoken YOUR_TOKEN</code></li>
                <li>Jalankan tunnel: <code className="rounded bg-[#fffaf0]/10 px-1 py-0.5">ngrok http 3000</code></li>
                <li>Copy HTTPS URL (misal: <code className="rounded bg-[#fffaf0]/10 px-1 py-0.5">https://xxxx.ngrok-free.app</code>)</li>
                <li>Buka <a href="https://app.reap.video" target="_blank" rel="noopener noreferrer" className="text-[color:var(--ember)] underline">app.reap.video</a> → Profile → Settings → Webhooks</li>
                <li>Tambahkan webhook URL: <code className="rounded bg-[#fffaf0]/10 px-1 py-0.5">https://xxxx.ngrok-free.app/api/reap/webhook</code></li>
                <li>Pastikan webhook aktif ✅</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-[color:var(--line)] bg-[#fffaf0]/70 p-4">
              <p className="font-black text-[color:var(--steel)]">For Production</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[color:var(--muted)]">
                <li>Pastikan domain kamu punya SSL/HTTPS (wajib untuk webhook)</li>
                <li>Di Reap dashboard, tambahkan webhook URL: <code className="rounded bg-[#fffaf0]/10 px-1 py-0.5">https://your-domain.com/api/reap/webhook</code></li>
                <li>Reap akan kirim callback saat project selesai processing</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-[color:var(--line)] bg-[#fffaf0]/70 p-4">
              <p className="font-black text-[color:var(--steel)]">Important Notes</p>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[color:var(--muted)]">
                <li>Reap requires HTTPS endpoint (ngrok provides this automatically)</li>
                <li>Webhook must respond 200 within 5 seconds (validation) or 10 seconds (live)</li>
                <li>5 consecutive failures will auto-disable the webhook in Reap</li>
                <li>Reap does NOT retry webhooks — use polling worker as fallback</li>
                <li>Free Reap plan: 0 webhooks. Creator plan: 1 webhook. Studio plan: 5 webhooks.</li>
              </ul>
            </div>
          </div>
        </article>
      </div>
    </AppShell>
  );
}