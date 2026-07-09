const statusStyles: Record<string, string> = {
  pending: "border-[#b8d4c2] bg-[rgba(184,212,194,0.10)] text-[#b8d4c2]",
  queued: "border-[#b8d4c2] bg-[rgba(184,212,194,0.10)] text-[#b8d4c2]",
  active: "border-[#e8c000] bg-[rgba(232,192,0,0.10)] text-[#e8c000]",
  completed: "border-[#22c55e] bg-[rgba(34,197,94,0.10)] text-[#22c55e]",
  failed: "border-[#ffb4ab] bg-[rgba(255,180,171,0.10)] text-[#ffb4ab]",
  created: "border-[#b8d4c2] bg-[rgba(184,212,194,0.10)] text-[#b8d4c2]",
  stored: "border-[#22c55e] bg-[rgba(34,197,94,0.10)] text-[#22c55e]",
  uploading: "border-[#e8c000] bg-[rgba(232,192,0,0.10)] text-[#e8c000]",
  uploaded: "border-[#22c55e] bg-[rgba(34,197,94,0.10)] text-[#22c55e]",
  cancelled: "border-[#b8d4c2] bg-[rgba(184,212,194,0.10)] text-[#b8d4c2]",
  publishing: "border-[#e8c000] bg-[rgba(232,192,0,0.10)] text-[#e8c000]",
  "not queued": "border-[rgba(232,192,0,0.20)] bg-[#1b1d26] text-[#b8d4c2]",
  uploading_to_reap:
    "border-[#e8c000] bg-[rgba(232,192,0,0.10)] text-[#e8c000]",
  processing_in_reap:
    "border-[#e8c000] bg-[rgba(232,192,0,0.10)] text-[#e8c000]",
  downloading_from_reap:
    "border-[#22c55e] bg-[rgba(34,197,94,0.10)] text-[#22c55e]",
  storing_clips: "border-[#22c55e] bg-[rgba(34,197,94,0.10)] text-[#22c55e]",
  generating_caption:
    "border-[#e8c000] bg-[rgba(232,192,0,0.10)] text-[#e8c000]",
  ready_to_upload: "border-[#22c55e] bg-[rgba(34,197,94,0.10)] text-[#22c55e]",
};

const displayNames: Record<string, string> = {
  pending: "Pending",
  queued: "Queued",
  active: "Active",
  completed: "Completed ✅",
  failed: "Failed",
  created: "Created",
  stored: "Stored",
  uploading: "Uploading",
  uploaded: "Uploaded",
  cancelled: "Cancelled",
  publishing: "Publishing",
  "not queued": "Not Queued",
  uploading_to_reap: "Sending to Reap",
  processing_in_reap: "Processing in Reap",
  downloading_from_reap: "Downloading from Reap",
  storing_clips: "Storing Clips",
  generating_caption: "Generating Caption",
  ready_to_upload: "Ready to Upload",
};

const tooltips: Record<string, string> = {
  pending: "Task is waiting to be processed.",
  queued: "Task is in the queue.",
  active: "Task is currently active.",
  completed: "All clips uploaded into your sosmed.",
  failed: "Task encountered an error.",
  created: "Clip record has been created.",
  stored: "Clip file has been stored.",
  uploading: "Clip is being uploaded.",
  uploaded: "Clip has been uploaded.",
  cancelled: "Task was cancelled.",
  publishing: "Clip is being published to the platform.",
  "not queued": "No upload has been queued yet.",
  uploading_to_reap: "Source video is being sent to Reap.",
  processing_in_reap: "Reap is analyzing the video and finding clips.",
  downloading_from_reap: "Generated clips are being downloaded from Reap.",
  storing_clips: "Clip files are being saved to storage.",
  generating_caption: "Titles and captions are being prepared.",
  ready_to_upload: "Clips are ready. Waiting to be published.",
};

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();
  const dynamicStyle =
    statusStyles[normalizedStatus] ??
    (normalizedStatus.includes("failed")
      ? statusStyles.failed
      : normalizedStatus.includes("completed") ||
          normalizedStatus.includes("uploaded")
        ? statusStyles.completed
        : normalizedStatus.includes("queued") ||
            normalizedStatus.includes("uploading")
          ? statusStyles.queued
          : undefined);

  const displayName =
    displayNames[normalizedStatus] ?? status.replaceAll("_", " ");
  const tooltip = tooltips[normalizedStatus] ?? undefined;

  return (
    <span
      title={tooltip}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] font-bold uppercase tracking-[0.18em] ${
        dynamicStyle ??
        "border-[rgba(232,192,0,0.20)] bg-[#1b1d26] text-[#b8d4c2]"
      }`}
    >
      {displayName}
    </span>
  );
}
