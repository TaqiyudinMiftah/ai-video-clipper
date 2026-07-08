"use client";

import { useState, useEffect, useCallback } from "react";
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

type ContentResponse = {
  items: PublishedItem[];
  count: number;
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

const DEFAULT_PAGE_SIZE = 12;

export function ContentGallery() {
  const [items, setItems] = useState<PublishedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchContent = useCallback(async (pageNum: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
        `/api/dashboard/content?page=${pageNum}&pageSize=${DEFAULT_PAGE_SIZE}`,
      );
      const data: ContentResponse = await response.json();
      if (!response.ok) {
        throw new Error(
          (data as unknown as { error?: string }).error ??
            "Failed to fetch published content.",
        );
      }
      if (append) {
        setItems((prev) => [...prev, ...(data.items ?? [])]);
      } else {
        setItems(data.items ?? []);
      }
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchContent(1, false);
  }, [fetchContent]);

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchContent(page + 1, true);
    }
  };

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
      <section className="rounded-xl border border-[rgba(231,188,75,0.18)] bg-[#032e1a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white">
          Published Content
        </h2>
        <p className="mt-1 text-sm text-[#b8d4c2]">
          Loading published clips...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-[rgba(231,188,75,0.18)] bg-[#032e1a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white">
          Published Content
        </h2>
        <p className="mt-2 text-sm font-bold text-[#ffb4ab]">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[rgba(231,188,75,0.18)] bg-[#032e1a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-black tracking-[-0.04em] text-white">
            Published Content
          </h2>
          <p className="text-sm text-[#b8d4c2]">
            {items.length} clip{items.length === 1 ? "" : "s"} published to
            social platforms.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[rgba(231,188,75,0.18)] bg-[rgba(3,46,26,0.70)] p-6 text-center">
          <p className="font-[family-name:var(--font-display)] font-black tracking-[-0.04em] text-white">
            No published content yet.
          </p>
          <p className="mt-1 text-sm text-[#b8d4c2]">
            Clips that have been uploaded to TikTok or Instagram will appear
            here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="grid gap-3 rounded-lg border border-[rgba(231,188,75,0.18)] bg-[rgba(3,46,26,0.70)] p-4 transition hover:-translate-y-0.5 hover:border-[rgba(231,188,75,0.40)]"
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
                  <div className="aspect-[9/16] w-full rounded-md bg-[linear-gradient(160deg,#022a18,#032e1a)]" />
                )}

                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={
                        item.platform === "tiktok" ? "uploaded" : "uploaded"
                      }
                    />
                    <StatusBadge
                      status={
                        item.platform === "tiktok" ? "tiktok" : "instagram"
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-[family-name:var(--font-mono)] text-[13px] font-medium leading-[18px] text-white">
                      {item.clip?.title ??
                        item.clip?.video?.title ??
                        "Untitled clip"}
                    </h3>
                    <p className="text-xs leading-5 text-[#b8d4c2]">
                      Published {formatDate(item.publishedAt)}
                    </p>
                  </div>

                  {item.uploadedUrl ? (
                    <a
                      href={item.uploadedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="button-secondary"
                    >
                      Open {getPlatformLabel(item.platform)} post ↗
                    </a>
                  ) : (
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b8d4c2]">
                      No public URL
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {page < totalPages && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[rgba(231,188,75,0.25)] bg-[rgba(3,46,26,0.70)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.16em] text-[#e7bc4b] transition hover:-translate-y-0.5 hover:border-[#e7bc4b] hover:text-[#f5d78a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore
                  ? "Loading..."
                  : `Load more (${totalCount - items.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
