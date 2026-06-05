import Link from "next/link";
import { redirect } from "next/navigation";
import { ManualAuthForm } from "@/components/manual-auth-form";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getLoginHref(callbackUrl?: string) {
  if (!callbackUrl) {
    return "/login";
  }

  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

export default async function SignupPage({
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
            Create your clipping workspace.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#c6c9ab]">
            Email sign-up creates a private operator account for dashboard access, video tasks, clips, upload targets, and logs.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <section className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl lg:col-span-5">
            <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#dffe00]">Manual signup</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-black tracking-[-0.04em] text-white">
              Sign up with email
            </h2>
            <div className="mt-6">
              <ManualAuthForm mode="signup" callbackUrl={callbackUrl || "/dashboard"} />
            </div>
            <p className="mt-6 text-sm leading-6 text-[#c6c9ab]">
              Already have an account?{" "}
              <Link href={getLoginHref(callbackUrl)} className="font-bold text-[#dffe00] transition hover:text-[#39ff14]">
                Sign in
              </Link>
              .
            </p>
          </section>

          <aside className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl lg:col-span-7">
            <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#dffe00]">Security notes</p>
            <div className="mt-5 grid gap-4 text-sm leading-7 text-[#c6c9ab]">
              <p>Passwords are stored as salted scrypt hashes and are never returned by the register API.</p>
              <p>OAuth providers remain optional and can still be enabled through Google or GitHub environment variables.</p>
              <p>Reap, storage, worker, and TikTok publishing flows remain server-side and unchanged.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
