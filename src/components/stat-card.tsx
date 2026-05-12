export function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ember" | "moss" | "steel";
}) {
  const toneClass = {
    neutral: "bg-[#fffaf0]",
    ember: "bg-[color:var(--ember)] text-[#fffaf0]",
    moss: "bg-[color:var(--moss)] text-[#fffaf0]",
    steel: "bg-[color:var(--steel)] text-[#fffaf0]",
  }[tone];

  return (
    <article className={`rounded-[1.75rem] border border-[color:var(--line)] p-5 shadow-[0_20px_50px_rgba(30,26,21,0.08)] ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.28em] opacity-70">{label}</p>
      <p className="mt-5 text-4xl font-black tracking-[-0.06em]">{value}</p>
    </article>
  );
}
