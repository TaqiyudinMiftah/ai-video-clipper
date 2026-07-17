"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { YouTubeAccountSelector } from "@/components/youtube-account-selector";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";

type UploadTargetSummary = {
  id: string;
  platform: string;
  uploadStatus: string;
  uploadedUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
};

type YouTubeUploadPanelProps = {
  clipId: string;
  storagePath: string | null;
  uploadTargets: UploadTargetSummary[];
};

type UploadResult = {
  accountId: string;
  platform: string;
  uploadTargetId: string;
  status: string;
  videoId?: string;
  error?: string;
};

export function YouTubeUploadPanel({
  clipId,
  storagePath,
  uploadTargets,
}: YouTubeUploadPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [results, setResults] = useState<UploadResult[]>([]);

  const latestYouTubeUpload = uploadTargets.find(
    (target) => target.platform === "youtube",
  );
  const hasActiveUpload = ["queued", "uploading", "publishing"].includes(
    latestYouTubeUpload?.uploadStatus ?? "",
  );
  const uploadFailed = latestYouTubeUpload?.uploadStatus === "failed";

  const busy = isPending || isUploading;
  const canUpload =
    storagePath && !hasActiveUpload && !busy && selectedAccountIds.length > 0;

  const statusLabel = hasActiveUpload
    ? (latestYouTubeUpload?.uploadStatus ?? "queued")
    : latestYouTubeUpload?.uploadStatus === "completed"
      ? "completed"
      : uploadFailed
        ? "failed"
        : "idle";

  async function uploadToYouTube() {
    if (!canUpload) return;

    setIsUploading(true);
    setMessage("");
    setError("");
    setResults([]);

    try {
      const res = await fetch(`/api/clips/${clipId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "youtube",
          connectedAccountIds: selectedAccountIds,
        }),
      });
      const data = await res.json();

      if (data.results) {
        setResults(data.results);
      }

      if (!res.ok) {
        setError(data.error || "Failed to queue YouTube upload");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="grid gap-3 rounded-xl border border-[rgba(223,254,0,0.15)] bg-[#1e2130] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#dffe00]">
            YouTube upload
          </p>
          <p className="mt-1 text-sm leading-6 text-[#c6c9ab]">
            Uploads this clip directly to YouTube via Composio.
          </p>
        </div>
        <StatusBadge status={statusLabel} />
      </div>

      {results.length > 0 ? (
        <div className="grid gap-1">
          {results.map((r) => (
            <div
              key={r.uploadTargetId}
              className={`rounded-lg border px-3 py-2 text-sm ${
                r.status === "completed"
                  ? "border-[rgba(223,254,0,0.30)] bg-[rgba(223,254,0,0.06)]"
                  : "border-[#ffb4ab] bg-[rgba(255,180,171,0.10)]"
              }`}
            >
              <span className="font-bold text-[#e2e2e1]">
                Account {r.accountId.slice(0, 8)}
              </span>
              {" — "}
              {r.status === "completed" ? (
                <span className="text-[#dffe00]">
                  Uploaded ✓{r.videoId ? ` (${r.videoId})` : ""}
                </span>
              ) : (
                <span className="text-[#ffb4ab]">{r.error || "Failed"}</span>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {latestYouTubeUpload ? (
        <div className="rounded-lg border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] px-4 py-3 text-sm leading-6 text-[#c6c9ab]">
          <p>
            Latest attempt:{" "}
            <span className="font-bold text-[#e2e2e1]">
              {formatDate(latestYouTubeUpload.createdAt)}
            </span>
          </p>
          {latestYouTubeUpload.errorMessage ? (
            <p className="mt-1 font-bold text-[#ffb4ab] break-all whitespace-pre-wrap">
              {latestYouTubeUpload.errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {!storagePath ? (
        <p className="rounded-lg border border-[#c6c9ab] bg-[#1e2130] px-4 py-3 text-sm font-bold text-[#c6c9ab]">
          This clip needs a storage path before YouTube upload can be queued.
        </p>
      ) : null}

      <YouTubeAccountSelector
        selectedAccountIds={selectedAccountIds}
        onSelect={setSelectedAccountIds}
      />

      {selectedAccountIds.length === 0 ? (
        <p className="text-xs text-[#c6c9ab]">
          Select at least one account above to enable upload.
        </p>
      ) : null}

      <button
        type="button"
        onClick={uploadToYouTube}
        disabled={!canUpload}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ff0000] via-[#cc0000] to-[#990000] px-5 py-3 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {latestYouTubeUpload?.uploadStatus === "completed"
          ? "Uploaded to YouTube ✓"
          : hasActiveUpload
            ? "Upload in progress"
            : busy
              ? "Uploading..."
              : uploadFailed
                ? "Retry YouTube upload"
                : "Upload to YouTube"}
      </button>

      {message ? (
        <p className="rounded-lg border border-[#dffe00] bg-[rgba(57,255,20,0.10)] px-4 py-3 text-sm font-bold text-[#dffe00] break-words">
          {message}
        </p>
      ) : null}
      {error && results.length === 0 ? (
        <p className="rounded-lg border border-[#ffb4ab] bg-[rgba(255,180,171,0.10)] px-4 py-3 text-sm font-bold text-[#ffb4ab] break-all">
          {error}
        </p>
      ) : null}
    </section>
  );
}
