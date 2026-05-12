"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type ClipMetadata = {
  id: string;
  title: string | null;
  caption: string | null;
  hashtags: string[];
};

function hashtagsToInput(hashtags: string[]) {
  return hashtags.join(", ");
}

function inputToHashtags(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("#") ? item : `#${item}`));
}

export function ClipMetadataEditor({ clip }: { clip: ClipMetadata }) {
  const router = useRouter();
  const [metadata, setMetadata] = useState({
    title: clip.title ?? "",
    caption: clip.caption ?? "",
    hashtags: hashtagsToInput(clip.hashtags),
  });
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"save" | "generate" | null>(null);

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  async function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAction("save");
    setError("");
    setMessage("");

    const response = await fetch(`/api/clips/${clip.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: metadata.title,
        caption: metadata.caption,
        hashtags: inputToHashtags(metadata.hashtags),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setAction(null);
      setError(result.error ?? "Unable to save clip metadata.");
      return;
    }

    setMetadata({
      title: result.title ?? "",
      caption: result.caption ?? "",
      hashtags: hashtagsToInput(result.hashtags ?? []),
    });
    setMessage("Metadata saved.");
    setAction(null);
    refresh();
  }

  async function generateCaption() {
    setAction("generate");
    setError("");
    setMessage("");

    const response = await fetch(`/api/clips/${clip.id}/generate-caption`, {
      method: "POST",
    });

    const result = await response.json();

    if (!response.ok) {
      setAction(null);
      setError(result.error ?? "Unable to generate placeholder caption.");
      return;
    }

    setMetadata({
      title: result.title ?? "",
      caption: result.caption ?? "",
      hashtags: hashtagsToInput(result.hashtags ?? []),
    });
    setMessage(result.message ?? "Placeholder caption generated.");
    setAction(null);
    refresh();
  }

  const busy = Boolean(action) || isPending;

  return (
    <form onSubmit={saveMetadata} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-xs font-black uppercase tracking-[0.24em] text-[color:var(--moss)]">Title</span>
        <input
          value={metadata.title}
          onChange={(event) => setMetadata((current) => ({ ...current, title: event.target.value }))}
          className="rounded-2xl border border-[color:var(--line)] bg-[#fffaf0] px-4 py-3 outline-none transition focus:border-[color:var(--ember)] focus:ring-4 focus:ring-[#e8552f]/15"
          placeholder="A sharp title for this short"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-black uppercase tracking-[0.24em] text-[color:var(--moss)]">Caption</span>
        <textarea
          value={metadata.caption}
          onChange={(event) => setMetadata((current) => ({ ...current, caption: event.target.value }))}
          rows={5}
          className="rounded-2xl border border-[color:var(--line)] bg-[#fffaf0] px-4 py-3 outline-none transition focus:border-[color:var(--ember)] focus:ring-4 focus:ring-[#e8552f]/15"
          placeholder="Hook, takeaway, call to action..."
        />
      </label>

      <label className="grid gap-2">
        <span className="text-xs font-black uppercase tracking-[0.24em] text-[color:var(--moss)]">Hashtags</span>
        <input
          value={metadata.hashtags}
          onChange={(event) => setMetadata((current) => ({ ...current, hashtags: event.target.value }))}
          className="rounded-2xl border border-[color:var(--line)] bg-[#fffaf0] px-4 py-3 outline-none transition focus:border-[color:var(--ember)] focus:ring-4 focus:ring-[#e8552f]/15"
          placeholder="#shorts, #ai, #creator"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-2xl bg-[color:var(--ink)] px-5 py-3 font-black text-[#fffaf0] transition hover:-translate-y-0.5 hover:bg-[color:var(--ember)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {action === "save" ? "Saving..." : "Save metadata"}
        </button>
        <button
          type="button"
          onClick={generateCaption}
          disabled={busy}
          className="flex-1 rounded-2xl border border-[color:var(--line)] bg-[#fffaf0] px-5 py-3 font-black text-[color:var(--steel)] transition hover:-translate-y-0.5 hover:border-[color:var(--ember)] hover:text-[color:var(--ember)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {action === "generate" ? "Generating..." : "Generate caption"}
        </button>
      </div>

      {message ? <p className="rounded-2xl border border-[#6c8b53] bg-[#e6efdf] px-4 py-3 text-sm font-bold text-[#39502d]">{message}</p> : null}
      {error ? <p className="rounded-2xl border border-[#d45f47] bg-[#ffe4dc] px-4 py-3 text-sm font-bold text-[#8a2d1d]">{error}</p> : null}
    </form>
  );
}
