const statusStyles: Record<string, string> = {
  pending: "border-[#909378] bg-[rgba(144,147,120,0.15)] text-[#c6c9ab]",
  queued: "border-[#909378] bg-[rgba(144,147,120,0.15)] text-[#c6c9ab]",
  active: "border-[#dffe00] bg-[rgba(223,254,0,0.10)] text-[#dffe00]",
  completed: "border-[#39ff14] bg-[rgba(57,255,20,0.10)] text-[#39ff14]",
  failed: "border-[#ffb4ab] bg-[rgba(255,180,171,0.10)] text-[#ffb4ab]",
  created: "border-[#909378] bg-[rgba(144,147,120,0.15)] text-[#c6c9ab]",
  stored: "border-[#39ff14] bg-[rgba(57,255,20,0.10)] text-[#39ff14]",
  uploading: "border-[#dffe00] bg-[rgba(223,254,0,0.10)] text-[#dffe00]",
  uploaded: "border-[#39ff14] bg-[rgba(57,255,20,0.10)] text-[#39ff14]",
  cancelled: "border-[#909378] bg-[rgba(144,147,120,0.15)] text-[#c6c9ab]",
  publishing: "border-[#dffe00] bg-[rgba(223,254,0,0.10)] text-[#dffe00]",
  "not queued":
    "border-[rgba(223,254,0,0.15)] bg-[rgba(30,32,32,0.70)] text-[#909378]",
  uploading_to_reap:
    "border-[#dffe00] bg-[rgba(223,254,0,0.10)] text-[#dffe00]",
  processing_in_reap:
    "border-[#dffe00] bg-[rgba(223,254,0,0.10)] text-[#dffe00]",
  downloading_from_reap:
    "border-[#39ff14] bg-[rgba(57,255,20,0.10)] text-[#39ff14]",
  storing_clips: "border-[#39ff14] bg-[rgba(57,255,20,0.10)] text-[#39ff14]",
  generating_caption:
    "border-[#dffe00] bg-[rgba(223,254,0,0.10)] text-[#dffe00]",
  ready_to_upload: "border-[#39ff14] bg-[rgba(57,255,20,0.10)] text-[#39ff14]",
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
        "border-[rgba(223,254,0,0.15)] bg-[rgba(30,32,32,0.70)] text-[#909378]"
      }`}
    >
      {displayName}
    </span>
  );
}
