const statusStyles: Record<string, string> = {
  pending: "border-[#c49d3c] bg-[#fff4cc] text-[#6f5010]",
  queued: "border-[#7b8da8] bg-[#e8eef7] text-[#273746]",
  completed: "border-[#6c8b53] bg-[#e6efdf] text-[#39502d]",
  failed: "border-[#d45f47] bg-[#ffe4dc] text-[#8a2d1d]",
  ready_to_upload: "border-[#516a43] bg-[#e6efdf] text-[#39502d]",
  uploading_to_tiktok: "border-[#273746] bg-[#e8eef7] text-[#273746]",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
        statusStyles[status] ?? "border-[color:var(--line)] bg-[#fffaf0] text-[color:var(--muted)]"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
