import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const PLATFORM_META = {
  tiktok: { label: "TikTok", color: "#38bdf8" },
  instagram: { label: "Instagram", color: "#e7bc4b" },
  twitter: { label: "X / Twitter", color: "#39ff14" },
  youtube: { label: "YouTube", color: "#ffb4ab" },
};

type PlatformSummaryCardsProps = {
  items: Array<{
    platform: keyof typeof PLATFORM_META;
    followers: string;
    engagement: string;
    posts: number;
  }>;
};

export function PlatformSummaryCards({ items }: PlatformSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ platform, followers, engagement, posts }) => {
        const meta = PLATFORM_META[platform];
        return (
          <Link
            key={platform}
            href={`/settings/integrations`}
            className="group rounded-lg border border-[rgba(231,188,75,0.18)] bg-[#032e1a] p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(231,188,75,0.40)]"
          >
            <div className="flex items-center justify-between">
              <span
                className="font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.25em]"
                style={{ color: meta.color }}
              >
                {meta.label}
              </span>
              <ArrowUpRight className="size-4 text-[#b8d4c2] transition-colors group-hover:text-[#e7bc4b]" />
            </div>
            <div className="mt-3 font-[family-name:var(--font-display)] text-xl font-black tracking-[-0.04em] text-white">
              {followers}
            </div>
            <div className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
              followers
            </div>
            <div className="mt-3 flex items-center gap-4 border-t border-[rgba(231,188,75,0.18)] pt-3">
              <div>
                <div className="font-[family-name:var(--font-mono)] text-xs font-semibold text-white">
                  {engagement}
                </div>
                <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#b8d4c2]">
                  eng rate
                </div>
              </div>
              <div>
                <div className="font-[family-name:var(--font-mono)] text-xs font-semibold text-white">
                  {posts}
                </div>
                <div className="font-[family-name:var(--font-mono)] text-[10px] text-[#b8d4c2]">
                  posts
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
