export function StatCard({
  label,
  value,
  tone = "neutral",
  trend,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ember" | "moss" | "steel";
  trend?: { value: number; label?: string };
}) {
  const toneBorder = {
    neutral: "border-[rgba(231,188,75,0.18)]",
    ember: "border-[#ffb4ab]/40",
    moss: "border-[#39ff14]/40",
    steel: "border-[#e7bc4b]/40",
  }[tone];

  const toneBg = {
    neutral: "bg-[#032e1a]",
    ember: "bg-[rgba(255,180,171,0.08)]",
    moss: "bg-[rgba(57,255,20,0.06)]",
    steel: "bg-[rgba(231,188,75,0.08)]",
  }[tone];

  const trendColor =
    trend && trend.value >= 0 ? "text-[#39ff14]" : "text-[#ffb4ab]";
  const trendArrow = trend && trend.value >= 0 ? "▲" : "▼";

  return (
    <article
      className={`rounded-xl border ${toneBorder} ${toneBg} p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl`}
    >
      <p className="font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase leading-4 tracking-[0.25em] text-[#b8d4c2]">
        {label}
      </p>
      <div className="mt-3 flex items-baseline gap-3">
        <p className="font-[family-name:var(--font-display)] text-3xl font-black tracking-[-0.04em] text-white">
          {value}
        </p>
        {trend ? (
          <span
            className={`flex items-center gap-1 text-[11px] font-bold ${trendColor}`}
          >
            <span>{trendArrow}</span>
            <span>{Math.abs(trend.value)}%</span>
            {trend.label ? (
              <span className="text-[#b8d4c2]">{trend.label}</span>
            ) : null}
          </span>
        ) : null}
      </div>
    </article>
  );
}
