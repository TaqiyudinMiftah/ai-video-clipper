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
  {
    color: string;
    bg: string;
    textClass: string;
    bgClass: string;
    label: string;
  }
> = {
  tiktok: {
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    textClass: "text-[#22c55e]",
    bgClass: "bg-[rgba(34,197,94,0.12)]",
    label: "TikTok",
  },
  instagram: {
    color: "#e8c000",
    bg: "rgba(232,192,0,0.12)",
    textClass: "text-[#e8c000]",
    bgClass: "bg-[rgba(232,192,0,0.12)]",
    label: "Instagram",
  },
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
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageCircleIcon() {
  return (
    <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 24 24">
      <path
        d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
      <line
        x1="8.59"
        y1="13.51"
        x2="15.42"
        y2="17.49"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <line
        x1="15.41"
        y1="6.51"
        x2="8.59"
        y2="10.49"
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
    <div className="rounded-lg border border-[rgba(232,192,0,0.18)] bg-[#1b1d26] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(232,192,0,0.18)]">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-black tracking-[-0.04em] text-white">
          Recent Posts
        </h2>
        <button className="font-[family-name:var(--font-mono)] text-[11px] font-bold text-[#b8d4c2] transition hover:text-[#e7bc4b]">
          View all
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] font-black tracking-[-0.04em] text-white">
              No uploads yet.
            </p>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
              Completed uploads will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[rgba(232,192,0,0.18)]">
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
                    className={`border-b border-[rgba(232,192,0,0.12)] last:border-0 transition-colors ${i % 2 === 0 ? "bg-[rgba(27,29,38,0.40)]" : "bg-[rgba(27,29,38,0.20)]"}`}
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {meta && (
                        <span
                          className={`font-[family-name:var(--font-mono)] text-[10px] font-bold px-2 py-1 rounded ${meta.textClass} ${meta.bgClass}`}
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
                        <span className="text-white/70">
                          <EyeIcon />
                        </span>
                        {post.views}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-[family-name:var(--font-mono)] text-white whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-white/70">
                          <HeartIcon />
                        </span>
                        {post.likes}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-[family-name:var(--font-mono)] text-white whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-white/70">
                          <MessageCircleIcon />
                        </span>
                        {post.comments}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-[family-name:var(--font-mono)] text-white whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-white/70">
                          <Share2Icon />
                        </span>
                        {post.shares}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`font-[family-name:var(--font-mono)] text-[10px] font-bold flex items-center gap-0.5 ${
                          post.trend === "up"
                            ? "text-[#22c55e]"
                            : "text-[#ffb4ab]"
                        }`}
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
      )}
    </div>
  );
}
