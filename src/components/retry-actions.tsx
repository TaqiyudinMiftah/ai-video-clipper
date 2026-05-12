"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type RetryButtonProps = {
  id: string;
  label?: string;
  compact?: boolean;
};

function buttonClassName(compact: boolean) {
  return compact
    ? "rounded-full border border-[#d45f47] bg-[#ffe4dc] px-4 py-2 text-sm font-black text-[#8a2d1d] transition hover:-translate-y-0.5 hover:bg-[#ffd2c5] disabled:cursor-not-allowed disabled:opacity-60"
    : "rounded-2xl bg-[color:var(--ember)] px-5 py-3 font-black text-[#fffaf0] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";
}

export function RetryVideoButton({ id, label = "Retry video task", compact = false }: RetryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState("");
  const busy = isPending || isRetrying;

  async function retry() {
    setIsRetrying(true);
    setError("");

    const response = await fetch(`/api/videos/${id}/retry`, {
      method: "POST",
    });
    const result = await response.json();

    setIsRetrying(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to retry video task.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <button type="button" onClick={retry} disabled={busy} className={buttonClassName(compact)}>
        {busy ? "Retrying..." : label}
      </button>
      {error ? <p className="text-xs font-bold text-[#8a2d1d]">{error}</p> : null}
    </div>
  );
}

export function RetryClipUploadButton({ id, label = "Retry TikTok upload", compact = false }: RetryButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState("");
  const busy = isPending || isRetrying;

  async function retry() {
    setIsRetrying(true);
    setError("");

    const response = await fetch(`/api/clips/${id}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform: "tiktok",
      }),
    });
    const result = await response.json();

    setIsRetrying(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to retry TikTok upload.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <button type="button" onClick={retry} disabled={busy} className={buttonClassName(compact)}>
        {busy ? "Queueing..." : label}
      </button>
      {error ? <p className="text-xs font-bold text-[#8a2d1d]">{error}</p> : null}
    </div>
  );
}
