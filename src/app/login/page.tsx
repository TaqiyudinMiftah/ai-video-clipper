import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthButtons } from "@/components/auth-actions";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getAuthProviders() {
  return [
    {
      id: "google" as const,
      label: "Google",
      enabled: Boolean(
        (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
          (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET),
      ),
    },
    {
      id: "github" as const,
      label: "GitHub",
      enabled: Boolean(
        (process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID) &&
          (process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET),
      ),
    },
  ];
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const { callbackUrl } = await searchParams;

  return (
    <main className="min-h-screen text-[#e2e2e1]">
      <section className="mx-auto grid min-h-screen w-full max-w-[1280px] content-center gap-8 px-5 py-24 md:px-10">
        <div className="max-w-3xl">
          <Link href="/" className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.06em] text-[#dffe00] transition hover:text-[#39ff14]">
            AI Video Clipper
          </Link>
          <p className="mt-10 inline-block rounded-full border border-[rgba(57,255,20,0.20)] bg-[rgba(57,255,20,0.08)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#39ff14]">
            Account access
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[3rem] font-black leading-[3.25rem] tracking-[-0.05em] text-[#dffe00] md:text-[4.5rem] md:leading-[5rem]">
            Sign in to your workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c6c9ab]">
            Each operator gets isolated video tasks, clip records, upload targets, and logs. Production access uses OAuth; local development may still use the explicit dev auth fallback.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <section className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl lg:col-span-5">
            <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#dffe00]">Login</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-black tracking-[-0.04em] text-white">
              Continue with OAuth
            </h2>
            <div className="mt-6">
              <AuthButtons providers={getAuthProviders()} callbackUrl={callbackUrl || "/dashboard"} />
            </div>
            <p className="mt-6 text-sm leading-6 text-[#c6c9ab]">
              New users are created automatically after a successful provider sign-in.
            </p>
          </section>

          <aside className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl lg:col-span-7">
            <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#dffe00]">Multi-user rules</p>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[#c6c9ab]">
              <p>Videos, clips, uploads, jobs, and logs are always scoped to the signed-in user.</p>
              <p>Webhook processing remains server-side and uses Reap project IDs; browser users never receive Reap or storage service keys.</p>
              <p>For the MVP, Reap is still app-level. User-level Reap/TikTok integrations should be added after the core workflow is stable.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/terms" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[rgba(223,254,0,0.15)] bg-[rgba(30,32,32,0.70)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.16em] text-[#c6c9ab] transition hover:-translate-y-0.5 hover:border-[rgba(223,254,0,0.42)] hover:text-[#dffe00]">
                Terms
              </Link>
              <Link href="/privacy" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[rgba(223,254,0,0.15)] bg-[rgba(30,32,32,0.70)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.16em] text-[#c6c9ab] transition hover:-translate-y-0.5 hover:border-[rgba(223,254,0,0.42)] hover:text-[#dffe00]">
                Privacy
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
