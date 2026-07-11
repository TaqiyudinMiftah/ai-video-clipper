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

const PLATFORM_META: Record<
  string,
  { color: string; dotClass: string; label: string }
> = {
  instagram: { color: "#e8c000", dotClass: "bg-[#e8c000]", label: "Instagram" },
  tiktok: { color: "#22c55e", dotClass: "bg-[#22c55e]", label: "TikTok" },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[rgba(232,192,0,0.25)] bg-[#1b1d26] p-3 text-xs font-mono shadow-xl">
      <p className="text-[#b8d4c2] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span
            className={`size-2 rounded-full ${
              p.name === "instagram"
                ? "bg-[#e8c000]"
                : p.name === "tiktok"
                  ? "bg-[#22c55e]"
                  : "bg-white"
            }`}
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

type DashboardChartsProps = {
  enabledPlatforms: string[];
};

export function DashboardCharts({ enabledPlatforms }: DashboardChartsProps) {
  const [activeRange, setActiveRange] = useState<Range>("30d");
  const [activePlatforms, setActivePlatforms] = useState<Set<string>>(
    new Set(
      enabledPlatforms.filter((p) => p === "instagram" || p === "tiktok"),
    ),
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

  const hasData = activePlatforms.size > 0 && enabledPlatforms.length > 0;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Engagement trend */}
      <div className="lg:col-span-2 rounded-lg border border-[rgba(232,192,0,0.18)] bg-[#1e2130] p-4">
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
                className={`font-[family-name:var(--font-mono)] text-xs px-2.5 py-1 rounded transition-colors ${
                  activeRange === r
                    ? "bg-[rgba(232,192,0,0.15)] text-[#e8c000]"
                    : "bg-transparent text-[#b8d4c2]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-[rgba(232,192,0,0.18)] bg-[#1e2130]">
            <div className="text-center">
              <p className="font-[family-name:var(--font-display)] font-black tracking-[-0.04em] text-white">
                No analytics data yet.
              </p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
                Connect TikTok or Instagram to see engagement trends.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              {Object.entries(PLATFORM_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => togglePlatform(key)}
                  className={`flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[11px] transition-opacity ${
                    activePlatforms.has(key) ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <span className={`size-2 rounded-full ${meta.dotClass}`} />
                  {meta.label}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={[
                  ...(enabledPlatforms.includes("instagram")
                    ? [{ date: "Jun 1", instagram: 4200, tiktok: 0 }]
                    : []),
                  ...(enabledPlatforms.includes("tiktok")
                    ? [{ date: "Jun 1", tiktok: 8400 }]
                    : []),
                ].map((d, i, arr) => {
                  const merged: any = { date: "" };
                  for (const entry of arr) {
                    merged.date = entry.date;
                    if (entry.instagram !== undefined)
                      merged.instagram = entry.instagram;
                    if (entry.tiktok !== undefined)
                      merged.tiktok = entry.tiktok;
                  }
                  return merged;
                })}
              >
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
                      <stop
                        offset="5%"
                        stopColor={meta.color}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor={meta.color}
                        stopOpacity={0}
                      />
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
          </>
        )}
      </div>

      {/* Platform score bars */}
      <div className="rounded-lg border border-[rgba(232,192,0,0.18)] bg-[#1e2130] p-4">
        <div className="mb-4">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-black tracking-[-0.04em] text-white">
            Platform Score
          </h2>
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
            reach · eng · saves
          </p>
        </div>

        {!hasData ? (
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-[rgba(232,192,0,0.18)] bg-[rgba(27,29,38,0.70)]">
            <div className="text-center">
              <p className="font-[family-name:var(--font-display)] font-black tracking-[-0.04em] text-white">
                No data yet.
              </p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
                Connect a platform to see your score.
              </p>
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  ...(enabledPlatforms.includes("instagram")
                    ? [
                        {
                          platform: "Instagram",
                          reach: 84,
                          engagement: 67,
                          saves: 91,
                        },
                      ]
                    : []),
                  ...(enabledPlatforms.includes("tiktok")
                    ? [
                        {
                          platform: "TikTok",
                          reach: 96,
                          engagement: 89,
                          saves: 78,
                        },
                      ]
                    : []),
                ]}
                layout="vertical"
                barGap={2}
              >
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
                  fill="#e8c000"
                  radius={[0, 2, 2, 0]}
                  maxBarSize={6}
                />
                <Bar
                  dataKey="engagement"
                  fill="#22c55e"
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
                { label: "Reach", color: "#e8c000", dotClass: "bg-[#e8c000]" },
                { label: "Eng.", color: "#22c55e", dotClass: "bg-[#22c55e]" },
                { label: "Saves", color: "#38bdf8", dotClass: "bg-[#38bdf8]" },
              ].map(({ label, dotClass }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${dotClass}`} />
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[#b8d4c2]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
