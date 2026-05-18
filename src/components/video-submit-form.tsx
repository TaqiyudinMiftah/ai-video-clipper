"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function VideoSubmitForm() {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const sourceFile = formData.get("sourceFile");
    const hasSourceFile = sourceFile instanceof File && sourceFile.size > 0;
    const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();

    if (!hasSourceFile && !sourceUrl) {
      setState("error");
      setMessage("Add a video URL or choose an MP4, MOV, or WEBM file.");
      return;
    }

    const response = hasSourceFile
      ? await fetch("/api/videos", {
          method: "POST",
          body: formData,
        })
      : await fetch("/api/videos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceType: "url",
            sourceUrl,
            title: String(formData.get("title") ?? ""),
            platformTargets: ["tiktok"],
          }),
        });

    const result = await response.json();

    if (!response.ok) {
      setState("error");
      setMessage([result.error, result.details].filter(Boolean).join(" ") || "Unable to create video task.");
      return;
    }

    setState("success");
    setMessage("Video task created. Redirecting to detail...");
    router.push(`/videos/${result.videoId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[0_24px_80px_rgba(30,26,21,0.10)] backdrop-blur">
      <div className="grid gap-5">
        <input type="hidden" name="sourceType" value="file" />

        <label className="grid gap-2">
          <span className="text-sm font-black uppercase tracking-[0.22em] text-[color:var(--moss)]">Video URL</span>
          <input
            name="sourceUrl"
            type="url"
            placeholder="https://example.com/video.mp4"
            className="rounded-2xl border border-[color:var(--line)] bg-[#fffaf0] px-4 py-3 text-base outline-none transition focus:border-[color:var(--ember)] focus:ring-4 focus:ring-[#e8552f]/15"
          />
          <span className="text-xs font-bold text-[color:var(--muted)]">Use a URL, or choose a file below. If both are set, the file upload wins.</span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black uppercase tracking-[0.22em] text-[color:var(--moss)]">Source file</span>
          <input
            name="sourceFile"
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            className="rounded-2xl border border-dashed border-[color:var(--line)] bg-[#fffaf0] px-4 py-3 text-base outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[color:var(--ink)] file:px-4 file:py-2 file:text-sm file:font-black file:text-[#fffaf0] focus:border-[color:var(--ember)] focus:ring-4 focus:ring-[#e8552f]/15"
          />
          <span className="text-xs font-bold text-[color:var(--muted)]">Allowed formats: MP4, MOV, WEBM.</span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black uppercase tracking-[0.22em] text-[color:var(--moss)]">Working title</span>
          <input
            name="title"
            type="text"
            placeholder="Podcast episode 17, launch webinar, customer interview..."
            className="rounded-2xl border border-[color:var(--line)] bg-[#fffaf0] px-4 py-3 text-base outline-none transition focus:border-[color:var(--ember)] focus:ring-4 focus:ring-[#e8552f]/15"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-black uppercase tracking-[0.22em] text-[color:var(--moss)]">Target platform</span>
          <select
            name="platform"
            defaultValue="tiktok"
            className="rounded-2xl border border-[color:var(--line)] bg-[#fffaf0] px-4 py-3 text-base outline-none transition focus:border-[color:var(--ember)] focus:ring-4 focus:ring-[#e8552f]/15"
          >
            <option value="tiktok">TikTok only for MVP</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={state === "submitting"}
          className="rounded-2xl bg-[color:var(--ink)] px-5 py-4 text-base font-black text-[#fffaf0] shadow-[0_18px_40px_rgba(30,26,21,0.18)] transition hover:-translate-y-0.5 hover:bg-[color:var(--ember)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === "submitting" ? "Creating task..." : "Create clipping task"}
        </button>

        {message ? (
          <p className={`rounded-2xl border px-4 py-3 text-sm font-bold ${state === "error" ? "border-[#d45f47] bg-[#ffe4dc] text-[#8a2d1d]" : "border-[#6c8b53] bg-[#e6efdf] text-[#39502d]"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
