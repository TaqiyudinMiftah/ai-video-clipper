"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Range = "7d" | "30d" | "90d";

const PLATFORM_META = {
  instagram: { color: "#e7bc4b" },
  twitter: { color: "#39ff14" },
  tiktok: { color: "#38bdf8" },
  youtube: { color: "#ffb4ab" },
};

const engagementData = [
  {
    date: "Jun 1",
    instagram: 4200,
    twitter: 2800,
    tiktok: 8400,
    youtube: 1900,
  },
  {
    date: "Jun 5",
    instagram: 5100,
    twitter: 3100,
    tiktok: 9200,
    youtube: 2200,
  },
  {
    date: "Jun 10",
    instagram: 4700,
    twitter: 2600,
    tiktok: 11000,
    youtube: 2800,
  },
  {
    date: "Jun 15",
    instagram: 6300,
    twitter: 4200,
    tiktok: 13400,
    youtube: 3100,
  },
  {
    date: "Jun 20",
    instagram: 5800,
    twitter: 3800,
    tiktok: 12100,
    youtube: 3400,
  },
  {
    date: "Jun 25",
    instagram: 7200,
    twitter: 4900,
    tiktok: 15600,
    youtube: 4000,
  },
  {
    date: "Jul 1",
    instagram: 8100,
    twitter: 5400,
    tiktok: 18200,
    youtube: 4600,
  },
  {
    date: "Jul 8",
    instagram: 9400,
    twitter: 6100,
    tiktok: 21500,
    youtube: 5200,
  },
];

const postPerformance = [
  { platform: "Instagram", reach: 84, engagement: 67, saves: 91 },
  { platform: "X / Twitter", reach: 71, engagement: 82, saves: 44 },
  { platform: "TikTok", reach: 96, engagement: 89, saves: 78 },
  { platform: "YouTube", reach: 63, engagement: 74, saves: 85 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[rgba(231,188,75,0.25)] bg-[#032e1a] p-3 text-xs font-mono shadow-xl">
      <p className="text-[#b8d4c2] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span
            className="size-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-[#b8d4c2] capitalize">{p.name}</span>
          <span className="ml-auto pl-4 text-white">
            {p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DashboardCharts() {
  const [activeRange, setActiveRange] = useState<Range>("30d");
  const [activePlatforms, setActivePlatforms] = useState<Set<string>>(
    new Set(["instagram", "twitter", "tiktok", "youtube"]),
  );

  function togglePlatform(p: string) {
    setActivePlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) {
        if (next.size > 1) next.delete(p);
      } else {
        next.add(p);
      }
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Engagement trend */}
      <div className="lg:col-span-2 rounded-lg border border-[rgba(231,188,75,0.18)] bg-[#032e1a] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-sm font-black tracking-[-0.04em] text-white">
              Engagement Trend
            </h2>
            <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
              interactions per day
            </p>
          </div>
          <div className="flex items-center gap-1">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setActiveRange(r)}
                className="font-[family-name:var(--font-mono)] text-xs px-2.5 py-1 rounded transition-colors"
                style={{
                  background:
                    activeRange === r ? "rgba(231,188,75,0.15)" : "transparent",
                  color: activeRange === r ? "#e7bc4b" : "#b8d4c2",
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 flex-wrap">
          {Object.entries(PLATFORM_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => togglePlatform(key)}
              className="flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[11px] transition-opacity"
              style={{ opacity: activePlatforms.has(key) ? 1 : 0.3 }}
            >
              <span
                className="size-2 rounded-full"
                style={{ background: meta.color }}
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={engagementData}>
            <defs>
              {Object.entries(PLATFORM_META).map(([key, meta]) => (
                <linearGradient
                  key={key}
                  id={`grad-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={meta.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              dataKey="date"
              tick={{
                fontSize: 10,
                fill: "#b8d4c2",
                fontFamily: "var(--font-mono)",
              }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{
                fontSize: 10,
                fill: "#b8d4c2",
                fontFamily: "var(--font-mono)",
              }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${v / 1000}K` : `${v}`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            {Object.entries(PLATFORM_META).map(([key, meta]) =>
              activePlatforms.has(key) ? (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={meta.color}
                  strokeWidth={1.5}
                  fill={`url(#grad-${key})`}
                />
              ) : null,
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Platform score bars */}
      <div className="rounded-lg border border-[rgba(231,188,75,0.18)] bg-[#032e1a] p-4">
        <div className="mb-4">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-black tracking-[-0.04em] text-white">
            Platform Score
          </h2>
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
            reach · eng · saves
          </p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={postPerformance} layout="vertical" barGap={2}>
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
            />
            <XAxis
              type="number"
              tick={{
                fontSize: 10,
                fill: "#b8d4c2",
                fontFamily: "var(--font-mono)",
              }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="platform"
              tick={{
                fontSize: 10,
                fill: "#b8d4c2",
                fontFamily: "var(--font-mono)",
              }}
              tickLine={false}
              axisLine={false}
              width={68}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="reach"
              fill="#e7bc4b"
              radius={[0, 2, 2, 0]}
              maxBarSize={6}
            />
            <Bar
              dataKey="engagement"
              fill="#39ff14"
              radius={[0, 2, 2, 0]}
              maxBarSize={6}
            />
            <Bar
              dataKey="saves"
              fill="#38bdf8"
              radius={[0, 2, 2, 0]}
              maxBarSize={6}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3">
          {[
            { label: "Reach", color: "#e7bc4b" },
            { label: "Eng.", color: "#39ff14" },
            { label: "Saves", color: "#38bdf8" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: color }}
              />
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
