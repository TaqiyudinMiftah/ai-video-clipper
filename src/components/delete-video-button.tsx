"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteVideoButtonProps {
  id: string;
  compact?: boolean;
}

const COOLDOWN_SECONDS = 5;

export function DeleteVideoButton({ id, compact }: DeleteVideoButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Delete failed (${res.status})`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setDeleting(false);
      setOpen(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    startCooldown();
  };

  const handleClose = () => {
    if (deleting) return;
    setOpen(false);
    setCooldown(0);
    setError(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={deleting}
        className={
          compact
            ? "inline-flex min-h-0 items-center justify-center gap-2 rounded-lg border border-[rgba(255,180,171,0.30)] bg-[rgba(30,32,32,0.70)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.16em] text-[#ffb4ab] transition hover:-translate-y-0.5 hover:border-[#ffb4ab] hover:text-[#ffb4ab]"
            : "inline-flex min-h-0 items-center justify-center gap-2 rounded-lg border border-[rgba(255,180,171,0.30)] bg-[rgba(30,32,32,0.70)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.16em] text-[#ffb4ab] transition hover:-translate-y-0.5 hover:border-[#ffb4ab] hover:text-[#ffb4ab]"
        }
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="mx-4 max-w-md rounded-xl border border-[rgba(255,180,171,0.25)] bg-[rgba(22,21,20,0.96)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.60)] backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-[family-name:var(--font-mono)] text-xs font-bold uppercase leading-4 tracking-[0.25em] text-[#ffb4ab]">
              Confirm Deletion
            </p>
            <h3 className="mt-3 font-[family-name:var(--font-display)] text-xl font-black tracking-[-0.04em] text-white">
              Are you sure?
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#c6c9ab]">
              This action{" "}
              <strong className="font-bold text-[#ffb4ab]">
                cannot be undone
              </strong>
              . The entire video task, including all clips and upload targets,
              will be permanently removed from the database.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={deleting}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[rgba(223,254,0,0.15)] bg-[rgba(30,32,32,0.70)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.16em] text-[#c6c9ab] transition hover:-translate-y-0.5 hover:border-[rgba(223,254,0,0.42)] hover:text-[#dffe00]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={cooldown > 0 || deleting}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[rgba(255,180,171,0.30)] bg-[rgba(255,180,171,0.12)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs font-bold uppercase tracking-[0.16em] text-[#ffb4ab] transition hover:-translate-y-0.5 hover:border-[#ffb4ab] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {deleting
                  ? "Deleting…"
                  : cooldown > 0
                    ? `Hold (${cooldown}s)`
                    : "Delete permanently"}
              </button>
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-[#ffb4ab] bg-[rgba(255,180,171,0.10)] px-3 py-2 text-sm font-bold text-[#ffb4ab]">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
