import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";

const PLATFORM_META = {
  tiktok: {
    label: "TikTok",
    colorClass: "text-platform tiktok",
    bgClass: "bg-platform tiktok",
    borderClass: "border-platform tiktok",
  },
  instagram: {
    label: "Instagram",
    colorClass: "text-platform instagram",
    bgClass: "bg-platform instagram",
    borderClass: "border-platform instagram",
  },
};

type Row = {
  id: string;
  platform: keyof typeof PLATFORM_META;
  username: string;
  followers: string;
  engagement: string;
  posts: number;
  growth: string;
  positive: boolean;
};

type TopAccountsTableProps = {
  items: Row[];
};

export function TopAccountsTable({ items }: TopAccountsTableProps) {
  const rows =
    items.length > 0
      ? items
      : ([
          {
            id: "dummy-1",
            platform: "tiktok" as const,
            username: "@nortis.official",
            followers: "612K",
            engagement: "9.2%",
            posts: 38,
            growth: "+34%",
            positive: true,
          },
          {
            id: "dummy-2",
            platform: "instagram" as const,
            username: "@nortis_id",
            followers: "384K",
            engagement: "7.8%",
            posts: 61,
            growth: "+21%",
            positive: true,
          },
          {
            id: "dummy-3",
            platform: "tiktok" as const,
            username: "@clipwithme.id",
            followers: "198K",
            engagement: "11.4%",
            posts: 52,
            growth: "+18%",
            positive: true,
          },
          {
            id: "dummy-4",
            platform: "instagram" as const,
            username: "@konten.viral.id",
            followers: "143K",
            engagement: "6.1%",
            posts: 89,
            growth: "+12%",
            positive: true,
          },
          {
            id: "dummy-5",
            platform: "tiktok" as const,
            username: "@reelsfactory_",
            followers: "87K",
            engagement: "5.3%",
            posts: 24,
            growth: "-2%",
            positive: false,
          },
        ] satisfies Row[]);

  return (
    <div className="rounded-lg border border-[rgba(232,192,0,0.18)] bg-[#1e2130] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(232,192,0,0.18)]">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-bold text-white">
            Top Accounts by Growth
          </h2>
          <p className="font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2] mt-0.5">
            Best performing this week across all managed accounts
          </p>
        </div>
        <button className="font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2] hover:text-white transition-colors inline-flex items-center gap-1">
          View all accounts <ArrowUpRight size={11} />
        </button>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-0 border-b border-[rgba(232,192,0,0.18)]">
        {["Account", "Followers", "Eng. Rate", "Posts", "Growth"].map((h) => (
          <div
            key={h}
            className="px-5 py-2.5 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-widest text-[#b8d4c2]"
          >
            {h}
          </div>
        ))}
      </div>

      {rows.map((row, i) => {
        const meta = PLATFORM_META[row.platform as keyof typeof PLATFORM_META];
        return (
          <div
            key={row.id ?? row.username}
            className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-0 border-b border-[rgba(232,192,0,0.18)] last:border-0 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.03]"}`}
          >
            {/* Account */}
            <div className="px-5 py-3.5 flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-mono font-bold ${meta.bgClass} ${meta.colorClass}`}
              >
                {row.username.slice(1, 3).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-mono text-white truncate">
                  {row.username}
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded mt-0.5 inline-block ${meta.colorClass} ${meta.bgClass} ${meta.borderClass}`}
                >
                  {meta.label}
                </span>
              </div>
            </div>

            {/* Followers */}
            <div className="px-5 py-3.5 flex items-center">
              <span className="text-xs font-mono text-white">
                {row.followers}
              </span>
            </div>

            {/* Eng rate */}
            <div className="px-5 py-3.5 flex items-center">
              <span className="text-xs font-mono text-white">
                {row.engagement}
              </span>
            </div>

            {/* Posts */}
            <div className="px-5 py-3.5 flex items-center">
              <span className="text-xs font-mono text-white">{row.posts}</span>
            </div>

            {/* Growth */}
            <div className="px-5 py-3.5 flex items-center">
              <span
                className={`text-[11px] font-mono inline-flex items-center gap-0.5 ${row.positive ? "text-[#22c55e]" : "text-[#e05252]"}`}
              >
                {row.positive ? (
                  <ChevronUp size={10} />
                ) : (
                  <ChevronDown size={10} />
                )}
                {row.growth}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
