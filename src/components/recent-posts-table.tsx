"use client";

type RecentPost = {
  id: string;
  platform: string;
  content: string;
  time: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  change: string;
  trend: "up" | "down";
};

type RecentPostsTableProps = {
  posts: RecentPost[];
};

const PLATFORM_META: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  tiktok: { color: "#38bdf8", bg: "rgba(56,189,248,0.12)", label: "TikTok" },
  instagram: {
    color: "#e7bc4b",
    bg: "rgba(231,188,75,0.12)",
    label: "Instagram",
  },
  twitter: {
    color: "#39ff14",
    bg: "rgba(57,255,20,0.12)",
    label: "X / Twitter",
  },
  youtube: { color: "#ffb4ab", bg: "rgba(255,180,171,0.12)", label: "YouTube" },
};

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 24 24">
      <path
        d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 24 24">
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-8.6 1-1a5.5 5.5 0 0 0 0-7.8Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function MessageCircleIcon() {
  return (
    <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 24 24">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.49 8.49 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.49 8.49 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 5.7 2.1l1.3 1.3a8.48 8.48 0 0 1 2.1 5.7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function Share2Icon() {
  return (
    <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 24 24">
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="m8.6 13.6 4.8-4M15.4 10.4 10.6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 24 24">
      <path
        d="M18 15l-6-6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 24 24">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function RecentPostsTable({ posts }: RecentPostsTableProps) {
  return (
    <div className="rounded-lg border border-[rgba(231,188,75,0.18)] bg-[#032e1a] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(231,188,75,0.18)]">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-black tracking-[-0.04em] text-white">
          Recent Posts
        </h2>
        <button className="font-[family-name:var(--font-mono)] text-[11px] font-bold text-[#b8d4c2] transition hover:text-[#e7bc4b]">
          View all
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[rgba(231,188,75,0.18)]">
              {[
                "Platform",
                "Content",
                "Views",
                "Likes",
                "Comments",
                "Shares",
                "Change",
              ].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.25em] text-[#b8d4c2] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((post, i) => {
              const meta = PLATFORM_META[post.platform];
              return (
                <tr
                  key={post.id}
                  className={`border-b border-[rgba(231,188,75,0.12)] last:border-0 transition-colors ${i % 2 === 0 ? "bg-[rgba(3,46,26,0.40)]" : "bg-[rgba(3,46,26,0.20)]"}`}
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {meta && (
                      <span
                        className="font-[family-name:var(--font-mono)] text-[10px] font-bold px-2 py-1 rounded"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.label}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 max-w-[260px]">
                    <div className="truncate text-white font-medium">
                      {post.content}
                    </div>
                    <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#b8d4c2] mt-0.5">
                      {post.time}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-[family-name:var(--font-mono)] text-white whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-[#b8d4c2]">
                        <EyeIcon />
                      </span>
                      {post.views}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-[family-name:var(--font-mono)] text-white whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-[#b8d4c2]">
                        <HeartIcon />
                      </span>
                      {post.likes}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-[family-name:var(--font-mono)] text-white whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-[#b8d4c2]">
                        <MessageCircleIcon />
                      </span>
                      {post.comments}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-[family-name:var(--font-mono)] text-white whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-[#b8d4c2]">
                        <Share2Icon />
                      </span>
                      {post.shares}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className="font-[family-name:var(--font-mono)] text-[10px] font-bold flex items-center gap-0.5"
                      style={{
                        color: post.trend === "up" ? "#39ff14" : "#ffb4ab",
                      }}
                    >
                      {post.trend === "up" ? (
                        <ChevronUpIcon />
                      ) : (
                        <ChevronDownIcon />
                      )}
                      {post.change}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
