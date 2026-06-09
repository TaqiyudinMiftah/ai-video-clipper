function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-white/[0.07] ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen text-[#e2e2e1]" aria-busy="true" aria-label="Loading dashboard">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[rgba(69,73,50,0.35)] bg-[#121414]/95 shadow-sm shadow-black/40">
        <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-5 md:px-10">
          <span className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.06em] text-[#dffe00]">
            AI Video Clipper
          </span>
          <div className="hidden items-center gap-3 md:flex">
            <SkeletonBlock className="h-9 w-36" />
            <SkeletonBlock className="h-9 w-20" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-5 pb-24 pt-32 md:px-10">
        <section className="mb-12 max-w-3xl">
          <p className="mb-3 font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.4em] text-[#dffe00]/70">
            Mission Control
          </p>
          <SkeletonBlock className="h-12 w-full max-w-2xl md:h-14" />
          <SkeletonBlock className="mt-4 h-5 w-full max-w-xl" />
          <SkeletonBlock className="mt-2 h-5 w-4/5 max-w-lg" />
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {["videos", "clips", "uploads", "failures"].map((item) => (
            <article
              key={item}
              className="min-h-32 rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.40)]"
            >
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="mt-5 h-9 w-16" />
            </article>
          ))}
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-12">
          <article className="min-h-[430px] rounded-xl border border-[#dffe00] bg-[rgba(22,21,20,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.40)] lg:col-span-8">
            <div className="flex items-center justify-between">
              <div className="grid gap-3">
                <SkeletonBlock className="h-7 w-52" />
                <SkeletonBlock className="h-4 w-72 max-w-full" />
              </div>
              <SkeletonBlock className="hidden h-10 w-28 sm:block" />
            </div>
            <div className="mt-7 grid gap-3">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="grid min-h-20 gap-3 rounded-lg border border-[rgba(223,254,0,0.12)] bg-[rgba(30,32,32,0.70)] p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="grid gap-2">
                    <SkeletonBlock className="h-5 w-2/3" />
                    <SkeletonBlock className="h-3 w-1/2" />
                  </div>
                  <SkeletonBlock className="h-7 w-24" />
                </div>
              ))}
            </div>
          </article>

          <aside className="grid gap-5 lg:col-span-4">
            {[0, 1].map((item) => (
              <article
                key={item}
                className="min-h-48 rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.40)]"
              >
                <SkeletonBlock className="h-3 w-28" />
                <SkeletonBlock className="mt-6 h-7 w-4/5" />
                <SkeletonBlock className="mt-4 h-4 w-full" />
                <SkeletonBlock className="mt-2 h-4 w-3/4" />
              </article>
            ))}
          </aside>
        </section>
      </main>
    </div>
  );
}
