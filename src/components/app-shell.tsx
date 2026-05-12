import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/videos/new", label: "Add Video" },
  { href: "/videos", label: "Videos" },
  { href: "/settings/integrations", label: "Integrations" },
];

export function AppShell({
  children,
  eyebrow,
  title,
  description,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
      <header className="mb-8 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-4 shadow-[0_24px_80px_rgba(30,26,21,0.10)] backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/dashboard" className="group flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-[color:var(--ink)] text-lg font-black text-[#fffaf0] transition group-hover:rotate-[-4deg]">
              AV
            </span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-[0.34em] text-[color:var(--ember)]">
                AI Automation
              </span>
              <span className="block text-xl font-black tracking-[-0.04em]">Video Clipper</span>
            </span>
          </Link>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-[color:var(--line)] bg-[#fffaf0]/70 px-4 py-2 text-sm font-bold text-[color:var(--steel)] transition hover:-translate-y-0.5 hover:border-[color:var(--ember)] hover:text-[color:var(--ember)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="mb-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.38em] text-[color:var(--moss)]">{eyebrow}</p>
          <h1 className="max-w-4xl text-5xl font-black tracking-[-0.07em] text-[color:var(--ink)] sm:text-6xl lg:text-7xl">
            {title}
          </h1>
        </div>
        <p className="max-w-2xl text-lg leading-8 text-[color:var(--muted)]">{description}</p>
      </section>

      <div className="flex-1">{children}</div>
    </main>
  );
}
