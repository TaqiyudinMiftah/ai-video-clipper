import Link from "next/link";
import { SignOutButton } from "@/components/auth-actions";
import { requireCurrentUser } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/videos/new", label: "Add Video" },
  { href: "/videos", label: "Videos" },
  { href: "/settings/integrations", label: "Integrations" },
];

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M10 21h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 20c1.1-3.2 3.5-5 7-5s5.9 1.8 7 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function renderTitle(title: string) {
  const highlight = "TikTok-ready";

  if (!title.includes(highlight)) {
    return title;
  }

  const [before, after] = title.split(highlight);

  return (
    <>
      {before}
      <span className="italic text-[#e7bc4b]">{highlight}</span>
      {after}
    </>
  );
}

export async function AppShell({
  children,
  eyebrow,
  title,
  description,
  activeHref = "/dashboard",
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  activeHref?: string;
}) {
  const user = await requireCurrentUser();
  const userLabel = user.name || user.email;

  return (
    <div className="min-h-screen text-white">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-[rgba(231,188,75,0.18)] bg-[#032e1a]/85 shadow-sm shadow-black/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <Link
              href="/dashboard"
              className="shrink-0 font-[family-name:var(--font-display)] text-xl font-black tracking-[-0.06em] text-[#e7bc4b] transition hover:text-[#f5d78a]"
            >
              AI Video Clipper
            </Link>
            <nav className="hidden items-center gap-5 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`border-b-2 pb-1 font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase leading-4 tracking-[0.25em] transition-colors ${
                    activeHref === item.href
                      ? "border-[#e7bc4b] text-[#e7bc4b]"
                      : "border-transparent text-[#b8d4c2] hover:text-[#e7bc4b]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <label className="relative hidden lg:block">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b8d4c2]">
                <SearchIcon />
              </span>
              <input
                type="search"
                placeholder="Search tasks..."
                suppressHydrationWarning
                className="h-9 w-56 rounded-lg border border-transparent bg-[#032e1a]/70 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-[#b8d4c2] focus:border-[rgba(231,188,75,0.35)] focus:bg-[#032e1a]"
              />
            </label>
            <button
              type="button"
              aria-label="Notifications"
              suppressHydrationWarning
              className="text-[#b8d4c2] transition hover:text-[#e7bc4b] active:scale-95"
            >
              <BellIcon />
            </button>
            <div className="hidden items-center gap-2 rounded-lg border border-[rgba(231,188,75,0.18)] bg-[#032e1a]/70 px-2.5 py-1.5 md:flex">
              <span className="text-[#b8d4c2]">
                <UserIcon />
              </span>
              <div className="grid max-w-40">
                <span className="truncate font-[family-name:var(--font-mono)] text-[9px] font-bold uppercase leading-4 tracking-[0.18em] text-[#b8d4c2]">
                  Signed in
                </span>
                <span className="truncate text-xs font-semibold text-white">
                  {userLabel}
                </span>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-5 pb-20 pt-28 md:px-8">
        <section className="mb-10 max-w-3xl">
          <p className="mb-2 block font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase leading-4 tracking-[0.35em] text-[#e7bc4b]/80">
            {eyebrow}
          </p>
          <h1 className="max-w-4xl font-[family-name:var(--font-display)] text-[2.25rem] font-black leading-[2.75rem] tracking-[-0.04em] text-white md:text-5xl md:leading-[3.25rem]">
            {renderTitle(title)}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#b8d4c2]">
            {description}
          </p>
        </section>

        {children}
      </main>

      {activeHref !== "/videos/new" ? (
        <Link
          href="/videos/new"
          aria-label="New clip task"
          className="group fixed bottom-6 right-6 z-40 hidden size-14 items-center justify-center rounded-full bg-[#e7bc4b] font-[family-name:var(--font-display)] text-4xl font-black leading-none text-[#022a18] shadow-[0_18px_50px_rgba(231,188,75,0.25)] transition hover:scale-110 hover:bg-[#f5d78a] active:scale-95 sm:inline-flex"
        >
          <span className="-mt-1">+</span>
          <span className="pointer-events-none absolute right-16 rounded-lg border border-[rgba(231,188,75,0.20)] bg-[#032e1a] px-4 py-2 font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-[0.25em] text-white shadow-[0_18px_50px_rgba(0,0,0,0.30)] transition-opacity group-hover:opacity-100">
            New clip task
          </span>
        </Link>
      ) : null}

      <footer className="border-t border-[rgba(231,188,75,0.12)] bg-[#032e1a]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-5 py-10 text-[#b8d4c2] md:flex-row md:items-center md:justify-between md:px-8">
          <div className="grid gap-1.5">
            <span className="font-[family-name:var(--font-display)] text-xl font-black tracking-[-0.06em] text-[#e7bc4b]">
              AI Video Clipper
            </span>
            <span className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase leading-4 tracking-[0.25em]">
              Reap API {">"} Storage {">"} TikTok Publish
            </span>
          </div>
          <nav className="flex flex-wrap gap-5">
            {[
              ["Terms", "/terms"],
              ["Privacy", "/privacy"],
              ["Videos", "/videos"],
              ["Integrations", "/settings/integrations"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase leading-4 tracking-[0.25em] text-[#b8d4c2] transition hover:text-[#e7bc4b]"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
