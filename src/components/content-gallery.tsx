"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/status-badge";

type PublishedItem = {
  id: string;
  platform: string;
  uploadedUrl: string | null;
  publishedAt: string;
  clip: {
    id: string;
    title: string | null;
    previewUrl: string | null;
    storagePath: string | null;
    video: {
      id: string;
      title: string | null;
      sourceUrl: string | null;
    } | null;
  } | null;
};

export function ContentGallery() {
  const router = useRouter();
  const [items, setItems] = useState<PublishedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch("/api/dashboard/content");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to fetch published content.");
        }
        setItems(data.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error.");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const formatDate = (value: string) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  };

  const getPlatformLabel = (platform: string) => {
    if (platform === "tiktok") return "TikTok";
    if (platform === "instagram") return "Instagram";
    return platform;
  };

  if (loading) {
    return (
      <section className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white">
          Published Content
        </h2>
        <p className="mt-1 text-sm text-[#c6c9ab]">
          Loading published clips...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white">
          Published Content
        </h2>
        <p className="mt-2 text-sm font-bold text-[#ffb4ab]">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[rgba(223,254,0,0.15)] bg-[rgba(22,21,20,0.84)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.40)] backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white">
            Published Content
          </h2>
          <p className="text-sm text-[#c6c9ab]">
            {items.length} clip{items.length === 1 ? "" : "s"} published to
            social platforms.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[rgba(223,254,0,0.15)] bg-[rgba(30,32,32,0.70)] p-6 text-center">
          <p className="font-[family-name:var(--font-display)] font-black tracking-[-0.04em] text-white">
            No published content yet.
          </p>
          <p className="mt-1 text-sm text-[#c6c9ab]">
            Clips that have been uploaded to TikTok or Instagram will appear
            here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="grid gap-3 rounded-lg border border-[rgba(223,254,0,0.15)] bg-[rgba(30,32,32,0.70)] p-4 transition hover:-translate-y-0.5 hover:border-[rgba(223,254,0,0.40)]"
            >
              {item.clip?.previewUrl ? (
                <video
                  src={item.clip.previewUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-[9/16] w-full rounded-md bg-black object-cover"
                />
              ) : (
                <div className="aspect-[9/16] w-full rounded-md bg-[linear-gradient(160deg,#0b0a09,#1e2020)]" />
              )}

              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={
                      item.platform === "tiktok" ? "uploaded" : "uploaded"
                    }
                  />
                  <StatusBadge
                    status={item.platform === "tiktok" ? "tiktok" : "instagram"}
                  />
                </div>

                <div className="min-w-0">
                  <h3 className="truncate font-[family-name:var(--font-mono)] text-[13px] font-medium leading-[18px] text-white">
                    {item.clip?.title ??
                      item.clip?.video?.title ??
                      "Untitled clip"}
                  </h3>
                  <p className="text-xs leading-5 text-[#c6c9ab]">
                    Published {formatDate(item.publishedAt)}
                  </p>
                </div>

                {item.uploadedUrl ? (
                  <a
                    href={item.uploadedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-0 items-center justify-center rounded-lg border border-[rgba(223,254,0,0.15)] bg-[rgba(30,32,32,0.70)] px-3 py-2 font-[family-name:var(--font-mono)] text-[11px] font-bold uppercase tracking-[0.16em] text-[#dffe00] transition hover:-translate-y-0.5 hover:border-[rgba(223,254,0,0.42)]"
                  >
                    Open {getPlatformLabel(item.platform)} post ↗
                  </a>
                ) : (
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#909378]">
                    No public URL
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
