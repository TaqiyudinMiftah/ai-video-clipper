"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { CaptionPresetPreview } from "@/components/caption-preset-preview";
import type { ReapClippingConfig } from "@/lib/reap/clipping-config";
import { formatStorageUploadError } from "@/lib/storage/upload-errors";
import { getYouTubeThumbnailUrl } from "@/lib/video-source-preview";

// ── Color constants (from Figma) ──
const NAV_YELLOW = "#e8c000";
const NAV_GREEN = "#22c55e";
const NAV_BLUE = "#38bdf8";

// ── Inline SVG Icons (no lucide-react) ──
function Link2Icon() {
  return (
    <svg
      aria-hidden="true"
      className="inline-block w-[11px] h-[11px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileVideoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline-block w-[11px] h-[11px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="14 2 14 8 20 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m10 11 5 3-5 3v-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline-block w-[18px] h-[18px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="17 8 12 3 7 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline-block w-[11px] h-[11px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 2H2v10l9.29 9.29a2 2 0 0 0 2.83 0l6.17-6.17a2 2 0 0 0 0-2.83L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="7"
        y1="7"
        x2="7.01"
        y2="7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline-block w-[12px] h-[12px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline-block w-[14px] h-[14px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <polyline
        points="9 18 15 12 9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircle2Icon() {
  return (
    <svg
      aria-hidden="true"
      className="inline-block w-[12px] h-[12px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <polyline
        points="9 12 11 14 15 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline-block w-[15px] h-[15px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3a6 6 0 0 0 9 9 6 6 0 0 0-9-9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 3v4m-2-2h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      className="inline-block w-[12px] h-[12px]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Types ──
type SubmitState = "idle" | "submitting" | "success" | "error";
type ActiveStep = "source" | "configure";
type PreparedSource =
  | {
      type: "url";
      sourceUrl: string;
      thumbnailUrl: string | null;
      title: string;
      platform: string;
    }
  | {
      type: "file";
      sourceFile: File;
      title: string;
      platform: string;
    };

type ApiResult = {
  error?: string;
  details?: unknown;
  videoId?: string;
  signedUploadUrl?: string;
};

// ── Reap preset types ──
type ReapPreset = {
  id: string;
  name: string;
  source: "system" | "user";
  preferences: Record<string, unknown>;
};

type PresetsResponse = {
  data?: ReapPreset[];
  error?: string;
};

// ── Helper functions ──
async function readJsonResponse(response: Response): Promise<ApiResult> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as ApiResult;
  } catch {
    return { error: text };
  }
}

function formatApiError(result: ApiResult, fallback: string) {
  const details = typeof result.details === "string" ? result.details : "";
  return [result.error, details].filter(Boolean).join(" ") || fallback;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve());
    });
  });
}

async function preloadImage(src: string) {
  if (typeof window === "undefined") return false;
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(() => resolve(false), 1600);
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(true);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(false);
    };
    image.referrerPolicy = "no-referrer";
    image.src = src;
  });
}

async function uploadToSignedUrl(signedUploadUrl: string, sourceFile: File) {
  const uploadFormData = new FormData();
  uploadFormData.append("cacheControl", "3600");
  uploadFormData.append("", sourceFile);
  const response = await fetch(signedUploadUrl, {
    method: "PUT",
    body: uploadFormData,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(formatStorageUploadError(response.status, body));
  }
}

// ── Stepper (Figma style) ──
function Stepper({
  activeStep,
  onStepClick,
}: {
  activeStep: ActiveStep;
  onStepClick: (step: ActiveStep) => void;
}) {
  const steps = [
    { n: 1, id: "source" as const, label: "SOURCE", sub: "Add URL or file" },
    {
      n: 2,
      id: "configure" as const,
      label: "CONFIGURE",
      sub: "AI clip settings",
    },
  ];

  const currentNum = activeStep === "source" ? 1 : 2;

  return (
    <div className="flex items-center gap-0 max-w-xl">
      {steps.map(({ n, id, label, sub }, i) => {
        const isActive = currentNum === n;
        const isDone = currentNum > n;

        return (
          <div key={n} className="flex items-center gap-0 flex-1">
            <button
              type="button"
              onClick={() => onStepClick(id)}
              className={`flex items-center gap-3 flex-1 px-4 py-3 rounded-lg border transition-all ${isActive ? "border-[#e8c000] bg-[#e8c00010]" : "border-[rgba(255,255,255,0.08)]"}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-[family-name:var(--font-mono)] font-bold shrink-0 ${isActive ? "bg-[#e8c000] text-[#12131a]" : isDone ? "bg-[#22c55e] text-[#12131a]" : "bg-[rgba(255,255,255,0.08)] text-[#7a8090]"}`}
              >
                {isDone ? <CheckCircle2Icon /> : n}
              </span>
              <div className="text-left">
                <div
                  className={`text-[10px] font-[family-name:var(--font-mono)] tracking-[0.25em] font-bold ${isActive ? "text-[#e8c000]" : "text-[#7a8090]"}`}
                >
                  {label}
                </div>
                <div className="text-[11px] text-[#7a8090]">{sub}</div>
              </div>
            </button>
            {i === 0 && <ChevronRightIcon />}
          </div>
        );
      })}
    </div>
  );
}

// ── Toggle Switch ──
function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${checked ? "bg-[#38bdf8]" : "bg-[rgba(255,255,255,0.15)]"}`}
      disabled={disabled}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? "left-[calc(100%-18px)]" : "left-[2px]"}`}
      />
    </button>
  );
}

// ── Preset Card (for caption styles) ──
function PresetCard({
  preset,
  selected,
  onSelect,
  radio = false,
}: {
  preset: ReapPreset;
  selected: boolean;
  onSelect: () => void;
  radio?: boolean;
}) {
  const captionsDisabled = preset.id === "__none";

  return (
    <button
      type="button"
      onClick={onSelect}
      role={radio ? "radio" : undefined}
      aria-checked={radio ? selected : undefined}
      aria-pressed={radio ? undefined : selected}
      className={`flex flex-col items-center gap-0 rounded-lg border transition-all flex-1 overflow-hidden ${selected ? "border-[#38bdf8] bg-[#38bdf807]" : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]"}`}
    >
      <div className="w-full h-29 flex items-center justify-center overflow-hidden bg-black/60">
        <CaptionPresetPreview
          presetId={preset.id}
          presetName={preset.name}
          disabled={captionsDisabled}
        />
      </div>
      <div className="flex items-center gap-1.5 w-full px-3 py-2.5 border-t border-white/5">
        <div
          className={`w-3 h-3 rounded-full border shrink-0 flex items-center justify-center ${selected ? "border-[#38bdf8]" : "border-[#7a8090]"}`}
        >
          {selected && (
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"
            />
          )}
        </div>
        <span
          className={`text-[10px] font-[family-name:var(--font-mono)] text-left truncate ${selected ? "text-[#eaedf5]" : "text-[#7a8090]"}`}
        >
          {preset.name}
        </span>
      </div>
    </button>
  );
}

// ── Select Field ──
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label
        className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold text-muted-foreground mb-2 block text-[#7a8090]"
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2.5 text-sm text-[#eaedf5] focus:outline-none focus:border-[#38bdf8]/50 font-[family-name:var(--font-mono)] transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Number Field ──
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | "";
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label
        className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold mb-2 block text-[#7a8090]"
      >
        {label}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2.5 text-sm text-[#eaedf5] placeholder:text-[#7a8090] focus:outline-none focus:border-[#38bdf8]/50 font-[family-name:var(--font-mono)] transition-colors"
      />
    </div>
  );
}

// ── Pipeline Steps data ──
const PIPELINE_STEPS = [
  {
    label: "Create source draft",
    desc: "A draft task record is written to the database with status pending.",
  },
  {
    label: "Choose AI clip config",
    desc: "Select shot length, caption style, and clip count before the worker starts.",
  },
  {
    label: "Enqueue processing job",
    desc: "A BullMQ job is dispatched to the worker pool for AI clip generation.",
  },
  {
    label: "Store clips server-side",
    desc: "Finished clips land in Supabase Storage — never exposed directly to the browser.",
  },
];

// ==================================================================
// Main Component
// ==================================================================
export function VideoSubmitForm({
  initialConfig,
}: {
  initialConfig: ReapClippingConfig;
}) {
  const router = useRouter();

  // ── Step 1 state ──
  const [step, setStep] = useState<ActiveStep>("source");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Step 2 state ──
  const [config, setConfig] = useState<ReapClippingConfig>(initialConfig);
  const [presets, setPresets] = useState<ReapPreset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetError, setPresetError] = useState("");
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [modalPresetId, setModalPresetId] = useState<string | null>(
    initialConfig.captionsPreset,
  );
  const [topicsInput, setTopicsInput] = useState(
    initialConfig.topics.join(", "),
  );

  // ── Submission state ──
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [preparedSource, setPreparedSource] = useState<PreparedSource | null>(
    null,
  );

  // ── Stepper control ──
  const configureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (step !== "configure" || !preparedSource) return;
    window.requestAnimationFrame(() => {
      configureRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      configureRef.current?.focus({ preventScroll: true });
    });
  }, [step, preparedSource]);

  // ── Load presets from API ──
  useEffect(() => {
    let cancelled = false;
    async function loadPresets() {
      try {
        const response = await fetch("/api/reap/presets");
        const result = (await response
          .json()
          .catch(() => ({}))) as PresetsResponse;
        if (cancelled) return;
        if (!response.ok || !result.data) {
          setPresetError(result.error || "Unable to load Reap presets.");
          setPresets([]);
          return;
        }
        setPresets(result.data);
      } catch {
        if (!cancelled) {
          setPresetError("Unable to load Reap presets.");
          setPresets([]);
        }
      } finally {
        if (!cancelled) setPresetsLoading(false);
      }
    }
    void loadPresets();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Preset modal keyboard ──
  useEffect(() => {
    if (!showAllPresets) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setShowAllPresets(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = prev;
    };
  }, [showAllPresets]);

  // ── Computed presets ──
  const allPresetOptions = useMemo(() => {
    const noCaptions: ReapPreset = {
      id: "__none",
      name: "No captions",
      source: "system",
      preferences: {},
    };
    const fallback =
      config.captionsPreset &&
      !presets.some((p) => p.id === config.captionsPreset)
        ? [
            {
              id: config.captionsPreset,
              name: config.captionsPreset,
              source: "system" as const,
              preferences: {},
            },
          ]
        : [];
    return [noCaptions, ...fallback, ...presets];
  }, [config.captionsPreset, presets]);

  const visiblePresets = useMemo(() => {
    const noCap = allPresetOptions[0];
    const sel = allPresetOptions.find((p) => p.id === config.captionsPreset);
    const rest = allPresetOptions.filter(
      (p) => p.id !== "__none" && p.id !== sel?.id,
    );
    return sel
      ? [sel, noCap, ...rest].slice(0, 5)
      : [noCap, ...rest].slice(0, 5);
  }, [allPresetOptions, config.captionsPreset]);

  // ── Handlers ──
  function updateConfig(patch: Partial<ReapClippingConfig>) {
    setConfig((c) => ({ ...c, ...patch }));
  }

  function selectPreset(presetId: string) {
    updateConfig({ captionsPreset: presetId === "__none" ? null : presetId });
  }

  function handleFile(f: File | undefined) {
    if (f) setFileName(f.name);
  }

  function goToStep(s: ActiveStep) {
    if (s === "configure" && !preparedSource) return;
    setStep(s);
  }

  const genreOptions = [
    { value: "talking" as const, label: "TALKING" },
    { value: "screenshare" as const, label: "PRESENTATION" },
    { value: "gaming" as const, label: "GAMING" },
  ];

  // ── API: submit source ──
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const sourceFile = formData.get("sourceFile");
    const hasSourceFile = sourceFile instanceof File && sourceFile.size > 0;
    const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();
    const formTitle = String(formData.get("title") ?? "").trim();
    const formPlatform = String(formData.get("platform") ?? "tiktok");

    setState("submitting");
    setMessage("Preparing source preview...");
    await waitForNextPaint();

    if (!hasSourceFile && !sourceUrl) {
      setState("error");
      setMessage("Add a video URL or choose an MP4, MOV, or WEBM file.");
      return;
    }

    if (hasSourceFile) {
      await wait(350);
      setPreparedSource({
        type: "file",
        sourceFile,
        title: formTitle,
        platform: formPlatform,
      });
      setStep("configure");
      setState("idle");
      setMessage("Source selected. Configure Reap options before queueing.");
      return;
    }

    const thumbnailUrl = getYouTubeThumbnailUrl(sourceUrl);
    const thumbnailReady = thumbnailUrl
      ? await Promise.race([
          preloadImage(thumbnailUrl),
          wait(1600).then(() => false),
        ])
      : false;
    await wait(250);

    setPreparedSource({
      type: "url",
      sourceUrl,
      thumbnailUrl: thumbnailReady ? thumbnailUrl : null,
      title: formTitle,
      platform: formPlatform,
    });
    setStep("configure");
    setState("idle");
    setMessage("Source selected. Configure Reap options before queueing.");
  }

  // ── API: start clipping ──
  async function startExistingVideoClipping(
    videoId: string,
    clipConfig: ReapClippingConfig,
  ) {
    const response = await fetch(`/api/videos/${videoId}/start-clipping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clipConfig),
    });
    const result = await readJsonResponse(response);
    if (!response.ok) {
      return {
        ok: false as const,
        error: formatApiError(result, "Unable to start clipping."),
      };
    }
    return { ok: true as const };
  }

  async function createAndStartClipping(clipConfig: ReapClippingConfig) {
    if (!preparedSource) {
      return {
        ok: false as const,
        error: "Add a source video before starting clipping.",
      };
    }

    setState("submitting");

    if (preparedSource.type === "file") {
      setMessage("Creating source draft and signed upload URL...");
      const createResponse = await fetch("/api/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "file",
          fileName: preparedSource.sourceFile.name,
          fileSize: preparedSource.sourceFile.size,
          contentType: preparedSource.sourceFile.type || null,
          title: preparedSource.title,
          platform: preparedSource.platform,
        }),
      });
      const createResult = await readJsonResponse(createResponse);

      if (
        !createResponse.ok ||
        !createResult.videoId ||
        !createResult.signedUploadUrl
      ) {
        setState("error");
        return {
          ok: false as const,
          error: formatApiError(
            createResult,
            "Unable to prepare source video upload.",
          ),
        };
      }

      try {
        setMessage("Uploading source video to storage...");
        await uploadToSignedUrl(
          createResult.signedUploadUrl,
          preparedSource.sourceFile,
        );
      } catch (error) {
        setState("error");
        return {
          ok: false as const,
          error:
            error instanceof Error
              ? error.message
              : "Unable to upload source video to storage.",
        };
      }

      setMessage("Confirming source upload...");
      const completeResponse = await fetch(
        `/api/videos/${createResult.videoId}/complete-upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: preparedSource.sourceFile.name,
            fileSize: preparedSource.sourceFile.size,
            contentType: preparedSource.sourceFile.type || null,
          }),
        },
      );
      const completeResult = await readJsonResponse(completeResponse);

      if (!completeResponse.ok) {
        setState("error");
        return {
          ok: false as const,
          error: formatApiError(
            completeResult,
            "Unable to confirm source upload.",
          ),
        };
      }

      setMessage("Queueing clipping job...");
      const startResult = await startExistingVideoClipping(
        completeResult.videoId || createResult.videoId,
        clipConfig,
      );
      if (!startResult.ok) {
        setState("error");
        return startResult;
      }

      setState("success");
      setMessage("Clipping queued. Redirecting to detail...");
      router.push(`/videos/${completeResult.videoId || createResult.videoId}`);
      return { ok: true as const };
    }

    // URL source
    setMessage("Creating source draft...");
    const response = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType: "url",
        sourceUrl: preparedSource.sourceUrl,
        title: preparedSource.title,
        platformTargets: ["tiktok"],
      }),
    });
    const result = await readJsonResponse(response);

    if (!response.ok) {
      setState("error");
      return {
        ok: false as const,
        error: formatApiError(result, "Unable to create video task."),
      };
    }
    if (!result.videoId) {
      setState("error");
      return {
        ok: false as const,
        error: "Video task was created without a video ID.",
      };
    }

    setMessage("Queueing clipping job...");
    const startResult = await startExistingVideoClipping(
      result.videoId,
      clipConfig,
    );
    if (!startResult.ok) {
      setState("error");
      return startResult;
    }

    setState("success");
    setMessage("Clipping queued. Redirecting to detail...");
    router.push(`/videos/${result.videoId}`);
    return { ok: true as const };
  }

  async function onCreateClick() {
    const clippingConfig: ReapClippingConfig = {
      ...config,
      topics: topicsInput
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const result = await createAndStartClipping(clippingConfig);
    if (!result.ok) {
      setState("error");
      setMessage(result.error);
    }
  }

  const busy = state === "submitting";
  const selectedModalPreset =
    allPresetOptions.find((p) =>
      p.id === "__none" ? modalPresetId === null : modalPresetId === p.id,
    ) ?? allPresetOptions[0];

  // ================================================================
  // Render
  // ================================================================
  return (
    <div className="max-w-screen-xl">
      {/* Stepper */}
      <div className="mb-8">
        <Stepper activeStep={step} onStepClick={goToStep} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* ── Left Column ── */}
        <div className="space-y-5">
          {/* ========== STEP 1: SOURCE ========== */}
          {step === "source" && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Video URL */}
                <div className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
                  <label
                    className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold flex items-center gap-2 mb-3 text-[#7a8090]"
                  >
                    <span className="text-current">
                      <Link2Icon />
                    </span>
                    Video URL
                  </label>
                  <input
                    name="sourceUrl"
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2.5 text-sm text-[#eaedf5] placeholder:text-[#7a8090] focus:outline-none focus:border-[#38bdf8]/50 font-[family-name:var(--font-mono)] transition-colors"
                  />
                  <p
                    className="text-[11px] font-[family-name:var(--font-mono)] mt-2 text-[#7a8090]"
                  >
                    Use a URL, or upload a file below. If both are set, the url
                    wins.
                  </p>
                </div>

                {/* File upload (drag-drop) */}
                <div className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
                  <label
                    className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold flex items-center gap-2 mb-3 text-[#7a8090]"
                  >
                    <span className="text-current">
                      <FileVideoIcon />
                    </span>
                    Source File
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      handleFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${dragging ? "border-[#e8c000] bg-[#e8c00008]" : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]"}`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-[#e8c00015]"
                    >
                      <span className="text-[#e8c000]">
                        <UploadIcon />
                      </span>
                    </div>
                    {fileName ? (
                      <div className="text-center">
                        <div className="text-sm font-[family-name:var(--font-mono)] text-[#eaedf5]">
                          {fileName}
                        </div>
                        <div
                          className="text-[11px] font-[family-name:var(--font-mono)] mt-0.5 text-[#7a8090]"
                        >
                          Click to replace
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-sm text-[#eaedf5] font-medium">
                          Drop your video here
                        </div>
                        <div
                          className="text-[11px] font-[family-name:var(--font-mono)] mt-0.5 text-[#7a8090]"
                        >
                          or click to browse
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {["MP4", "MOV", "WEBM"].map((fmt) => (
                        <span
                          key={fmt}
                          className="text-[10px] font-[family-name:var(--font-mono)] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#7a8090]"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    name="sourceFile"
                    type="file"
                    accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>

                {/* Working title */}
                <div className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
                  <label
                    className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold flex items-center gap-2 mb-3 text-[#7a8090]"
                  >
                    <span className="text-current">
                      <TagIcon />
                    </span>
                    Working Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Podcast ep. 17, launch webinar, customer interview…"
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2.5 text-sm text-[#eaedf5] placeholder:text-[#7a8090] focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
                  />
                  <p
                    className="text-[11px] font-[family-name:var(--font-mono)] mt-2 text-[#7a8090]"
                  >
                    Internal label — not published to TikTok or Instagram.
                  </p>
                </div>

                {/* Target Platform */}
                <div className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg p-5">
                  <label
                    className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold mb-3 block text-[#7a8090]"
                  >
                    Target Platform
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        id: "tiktok",
                        label: "TikTok",
                        color: NAV_BLUE,
                        sub: "Publish via TikTok API",
                        activeBorderClass: "border-[#38bdf8]",
                        activeBgClass: "bg-[#38bdf810]",
                        dotClass: "bg-[#38bdf8]",
                        textClass: "text-[#38bdf8]",
                      },
                      {
                        id: "instagram",
                        label: "Instagram",
                        color: NAV_YELLOW,
                        sub: "Reels via Content Publishing API",
                        activeBorderClass: "border-[#e8c000]",
                        activeBgClass: "bg-[#e8c00010]",
                        dotClass: "bg-[#e8c000]",
                        textClass: "text-[#e8c000]",
                      },
                    ].map(
                      ({
                        id,
                        label,
                        color,
                        sub,
                        activeBorderClass,
                        activeBgClass,
                        dotClass,
                        textClass,
                      }) => {
                      const active = platform === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setPlatform(id);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${active ? `${activeBorderClass} ${activeBgClass}` : "border-[rgba(255,255,255,0.08)]"}`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? activeBorderClass : "border-[#7a8090]"}`}
                          >
                            {active && (
                              <div
                                className={`w-2 h-2 rounded-full ${dotClass}`}
                              />
                            )}
                          </div>
                          <div>
                            <div
                              className={`text-sm font-medium ${active ? textClass : "text-[#eaedf5]"}`}
                            >
                              {label}
                            </div>
                            <div
                              className="text-[10px] font-[family-name:var(--font-mono)] mt-0.5 text-[#7a8090]"
                            >
                              {sub}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CTA */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-lg font-[family-name:var(--font-mono)] font-bold text-sm tracking-[0.25em] transition-opacity hover:opacity-90 flex items-center justify-center gap-2 bg-[#e8c000] text-[#12131a]"
                >
                  <span>
                    <SparklesIcon />
                  </span>
                  CONTINUE TO CONFIGURE
                </button>

                {message ? (
                  <p
                    className={`rounded-lg border px-4 py-3 text-sm font-bold ${
                      state === "error"
                        ? "border-[#ffb4ab] bg-[rgba(255,180,171,0.10)] text-[#ffb4ab]"
                        : "border-[#39ff14] bg-[rgba(57,255,20,0.10)] text-[#39ff14]"
                    }`}
                  >
                    {message}
                  </p>
                ) : null}
              </div>
            </form>
          )}

          {/* ========== STEP 2: CONFIGURE ========== */}
          {step === "configure" && (
            <>
              {/* Source summary */}
              <div
                className="bg-[#1e2130] border rounded-lg p-4 flex items-center gap-4 border-[#e8c00030]"
              >
                {preparedSource?.type === "url" &&
                preparedSource.thumbnailUrl ? (
                  <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/40">
                    <img
                      src={preparedSource.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#e8c00015]"
                  >
                    <span className="text-[#e8c000]">
                      <FileVideoIcon />
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[#eaedf5] truncate">
                    {preparedSource?.title || title || "Untitled video"}
                  </div>
                  <div
                    className="text-[11px] font-[family-name:var(--font-mono)] mt-0.5 truncate text-[#7a8090]"
                  >
                    {preparedSource?.type === "file"
                      ? preparedSource?.sourceFile?.name ||
                        fileName ||
                        "No source set"
                      : preparedSource?.sourceUrl ||
                        videoUrl ||
                        "No source set"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("source");
                  }}
                  className="text-[11px] font-[family-name:var(--font-mono)] shrink-0 flex items-center gap-1 transition-colors text-[#7a8090] hover:text-[#eaedf5]"
                >
                  <EditIcon /> Edit
                </button>
              </div>

              {/* Language & Output */}
              <div className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[#eaedf5]">
                  Language & Output
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="LANGUAGE"
                    value={config.language ?? ""}
                    onChange={(v) => updateConfig({ language: v || null })}
                    options={[
                      { value: "", label: "Auto detect" },
                      { value: "id", label: "Indonesian" },
                      { value: "en", label: "English" },
                      { value: "ja", label: "Japanese" },
                    ]}
                  />
                  <SelectField
                    label="TRANSLATE TO"
                    value={config.translationLanguage ?? ""}
                    onChange={(v) =>
                      updateConfig({ translationLanguage: v || null })
                    }
                    options={[
                      { value: "", label: "None" },
                      { value: "en", label: "English" },
                      { value: "id", label: "Indonesian" },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <SelectField
                    label="SCRIPT"
                    value={config.transcriptionScript}
                    onChange={(v) =>
                      updateConfig({
                        transcriptionScript:
                          v as ReapClippingConfig["transcriptionScript"],
                      })
                    }
                    options={[
                      { value: "native", label: "Native" },
                      { value: "roman", label: "Roman" },
                    ]}
                  />
                  <SelectField
                    label="ORIENTATION"
                    value={config.exportOrientation}
                    onChange={(v) =>
                      updateConfig({
                        exportOrientation:
                          v as ReapClippingConfig["exportOrientation"],
                      })
                    }
                    options={[
                      { value: "portrait", label: "Portrait (9:16)" },
                      { value: "landscape", label: "Landscape (16:9)" },
                      { value: "square", label: "Square (1:1)" },
                    ]}
                  />
                  <SelectField
                    label="RESOLUTION"
                    value={String(config.exportResolution)}
                    onChange={(v) =>
                      updateConfig({
                        exportResolution: Number(v) as 720 | 1080 | 1440 | 2160,
                      })
                    }
                    options={[
                      { value: "720", label: "720" },
                      { value: "1080", label: "1080" },
                    ]}
                  />
                </div>
              </div>

              {/* Processing Time Frame + Auto Clip Length */}
              <div className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[#eaedf5]">
                  Processing Time Frame
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="START SECONDS"
                    value={config.selectedStart ?? ""}
                    onChange={(v) =>
                      updateConfig({
                        selectedStart: v === "" ? null : Number(v),
                      })
                    }
                  />
                  <NumberField
                    label="END SECONDS"
                    value={config.selectedEnd ?? ""}
                    onChange={(v) =>
                      updateConfig({ selectedEnd: v === "" ? null : Number(v) })
                    }
                  />
                </div>
                <div>
                  <label
                    className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold mb-3 block text-[#7a8090]"
                  >
                    Auto Clip Length
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "<30S", value: [0, 30] as const },
                      { label: "30S-60S", value: [30, 60] as const },
                      { label: "60S-90S", value: [60, 90] as const },
                      { label: "90S-3MIN", value: [90, 180] as const },
                    ].map(({ label, value }) => {
                      const active = config.clipDurations.some(
                        (d) => d[0] === value[0] && d[1] === value[1],
                      );
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? config.clipDurations.filter(
                                  (d) =>
                                    !(d[0] === value[0] && d[1] === value[1]),
                                )
                              : [
                                  ...config.clipDurations,
                                  [value[0], value[1]] as [number, number],
                                ];
                            updateConfig({
                              clipDurations: next.length ? next : [[30, 60]],
                            });
                          }}
                          className={`py-2.5 rounded-full border text-[11px] font-[family-name:var(--font-mono)] font-bold tracking-wide transition-all ${active ? "border-[#38bdf8] text-[#38bdf8] bg-[#38bdf810]" : "border-[rgba(255,255,255,0.1)] text-[#7a8090]"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Video Genre */}
              <div className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 space-y-3">
                <label
                  className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold block text-[#7a8090]"
                >
                  Select Video Genre
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {genreOptions.map(({ value, label }) => {
                    const active = config.genre === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateConfig({ genre: value })}
                        className={`px-5 py-2.5 rounded-full border text-[11px] font-[family-name:var(--font-mono)] font-bold tracking-[0.15em] transition-all ${active ? "border-[#38bdf8] text-[#38bdf8] bg-[#38bdf812]" : "border-[rgba(255,255,255,0.12)] text-[#7a8090]"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caption Styles */}
              <div className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold text-[#7a8090]"
                  >
                    Caption Styles
                  </label>
                  <ToggleSwitch
                    checked={config.captionsPreset !== null}
                    onChange={(checked) =>
                      updateConfig({
                        captionsPreset: checked
                          ? initialConfig.captionsPreset || "system_zen"
                          : null,
                      })
                    }
                  />
                </div>

                {config.captionsPreset !== null && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {presetsLoading
                        ? Array.from({ length: 5 }, (_, i) => (
                            <div
                              key={i}
                              className="h-[7.5rem] animate-pulse rounded-lg border border-white/10 bg-[rgba(255,255,255,0.04)]"
                            />
                          ))
                        : visiblePresets.map((preset) => (
                            <PresetCard
                              key={preset.id}
                              preset={preset}
                              selected={
                                preset.id === "__none"
                                  ? config.captionsPreset === null
                                  : config.captionsPreset === preset.id
                              }
                              onSelect={() => selectPreset(preset.id)}
                            />
                          ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setModalPresetId(config.captionsPreset);
                          setShowAllPresets(true);
                        }}
                        disabled={presetsLoading}
                        className="text-[11px] font-[family-name:var(--font-mono)] px-4 py-2 rounded-full border transition-colors border-[rgba(255,255,255,0.1)] text-[#7a8090] hover:text-[#eaedf5]"
                      >
                        MORE STYLES
                      </button>
                      {presetError && (
                        <p className="text-sm font-bold text-[#ffb4ab]">
                          {presetError}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Clip Topics */}
              <div className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg p-5 space-y-3">
                <div>
                  <label
                    className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold block mb-0.5 text-[#7a8090]"
                  >
                    Clip Topics{" "}
                    <span className="normal-case opacity-60">(optional)</span>
                  </label>
                  <p
                    className="text-[11px] font-[family-name:var(--font-mono)] text-[#7a8090]"
                  >
                    Add keywords to guide what AI should clip, separated by
                    commas.
                  </p>
                </div>
                <textarea
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  placeholder="e.g. tips, motivation, tutorial, product review…"
                  rows={3}
                  className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-2.5 text-sm text-[#eaedf5] placeholder:text-[#7a8090] focus:outline-none focus:border-[#38bdf8]/50 font-[family-name:var(--font-mono)] transition-colors resize-none"
                />
              </div>

              {/* Toggles */}
              <div
                className="bg-[#1e2130] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden divide-y border-[rgba(255,255,255,0.08)]"
              >
                {[
                  {
                    label: "Auto Text Hooks",
                    desc: "Automatically generate hook text overlays for each clip.",
                    value: false,
                    set: () => undefined,
                    beta: true,
                    disabled: true,
                  },
                  {
                    label: "Face Tracking",
                    desc: "Keep faces centered by reframing clips for the selected orientation.",
                    value: config.reframeClips,
                    set: (v: boolean) => updateConfig({ reframeClips: v }),
                    beta: false,
                    disabled: false,
                  },
                ].map(({ label, desc, value, set, beta, disabled }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#eaedf5]">
                          {label}
                        </span>
                        {beta && (
                          <span
                            className="text-[9px] font-[family-name:var(--font-mono)] font-bold px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.08)] text-[#7a8090]"
                          >
                            BETA
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[11px] font-[family-name:var(--font-mono)] mt-0.5 text-[#7a8090]"
                      >
                        {desc}
                      </p>
                    </div>
                    <ToggleSwitch
                      checked={value}
                      onChange={(v) => set(v)}
                      disabled={disabled}
                    />
                  </div>
                ))}
              </div>

              {/* Final CTA */}
              <button
                type="button"
                onClick={onCreateClick}
                disabled={busy}
                className="w-full py-3.5 rounded-lg font-[family-name:var(--font-mono)] font-bold text-sm tracking-[0.25em] transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed bg-[#e8c000] text-[#12131a]"
              >
                {busy ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#12131a]/30 border-t-[#12131a]" />{" "}
                    QUEUEING…
                  </>
                ) : (
                  <>
                    <SparklesIcon /> CREATE CLIPPING TASK
                  </>
                )}
              </button>

              {message ? (
                <p
                  className={`rounded-lg border px-4 py-3 text-sm font-bold ${
                    state === "error"
                      ? "border-[#ffb4ab] bg-[rgba(255,180,171,0.10)] text-[#ffb4ab]"
                      : state === "success"
                        ? "border-[#39ff14] bg-[rgba(57,255,20,0.10)] text-[#39ff14]"
                        : "border-[rgba(57,255,20,0.30)] bg-[rgba(57,255,20,0.05)] text-[#39ff14]"
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </>
          )}
        </div>

        {/* ── Right: Guardrails Panel ── */}
        <div className="space-y-4">
          {/* How it works */}
          <div
            className="rounded-lg p-5 border bg-[#1e2130] border-[#e8c00020]"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#e8c000]">
                <AlertCircleIcon />
              </span>
              <span
                className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold text-[#e8c000]"
              >
                How it works
              </span>
            </div>
            <h3 className="text-base font-bold text-[#eaedf5] mt-1 mb-3">
              AI Processing Pipeline
            </h3>
            <p
              className="text-[12px] font-[family-name:var(--font-mono)] leading-relaxed text-[#7a8090]"
            >
              Your video is clipped server-side by AI — clips are stored in
              Supabase Storage and never exposed directly to the browser.
              Publishing goes through Composio into TikTok or Instagram Reels.
            </p>
          </div>

          {/* Pipeline Steps */}
          <div
            className="rounded-lg border overflow-hidden bg-[#1e2130] border-[rgba(255,255,255,0.06)]"
          >
            <div
              className="px-5 py-3 border-b border-[rgba(255,255,255,0.06)]"
            >
              <span
                className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold text-[#7a8090]"
              >
                Pipeline Steps
              </span>
            </div>
            <div
              className="divide-y border-[rgba(255,255,255,0.04)]"
            >
              {PIPELINE_STEPS.map(({ label, desc }, i) => (
                <div key={label} className="flex gap-4 px-5 py-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-[family-name:var(--font-mono)] font-bold bg-[#22c55e20] text-[#22c55e]"
                    >
                      {i + 1}
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div
                        className="w-px flex-1 min-h-3 bg-[rgba(34,197,94,0.15)]"
                      />
                    )}
                  </div>
                  <div className="pb-1">
                    <div className="text-xs font-semibold text-[#eaedf5]">
                      {label}
                    </div>
                    <div
                      className="text-[11px] font-[family-name:var(--font-mono)] mt-1 leading-relaxed text-[#7a8090]"
                    >
                      {desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Supported formats */}
          <div
            className="rounded-lg p-4 border bg-[#1e2130] border-[rgba(255,255,255,0.06)]"
          >
            <span
              className="text-[10px] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] font-bold block mb-3 text-[#7a8090]"
            >
              Supported Formats
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { fmt: "MP4", note: "Recommended" },
                { fmt: "MOV", note: "Apple" },
                { fmt: "WEBM", note: "Web" },
              ].map(({ fmt, note }) => (
                <div
                  key={fmt}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[rgba(255,255,255,0.08)]"
                >
                  <span className="text-xs font-[family-name:var(--font-mono)] font-bold text-[#eaedf5]">
                    {fmt}
                  </span>
                  <span
                    className="text-[10px] font-[family-name:var(--font-mono)] text-[#7a8090]"
                  >
                    · {note}
                  </span>
                </div>
              ))}
            </div>
            <p
              className="text-[11px] font-[family-name:var(--font-mono)] mt-3 text-[#7a8090]"
            >
              Max file size: 4 GB. Min duration: 5 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* ── Caption Styles Modal ── */}
      {showAllPresets && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target)
                  setShowAllPresets(false);
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="caption-style-dialog-title"
                className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-white/15 bg-[#161716] shadow-[0_28px_90px_rgba(0,0,0,0.68)]"
              >
                <div className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
                  <h3
                    id="caption-style-dialog-title"
                    className="font-[family-name:var(--font-display)] text-xl font-black text-white sm:text-2xl"
                  >
                    Caption styles
                  </h3>
                  <button
                    type="button"
                    autoFocus
                    aria-label="Close caption styles"
                    onClick={() => setShowAllPresets(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-[#c6c9ab] transition hover:border-[#e8c000] hover:text-[#e8c000]"
                  >
                    x
                  </button>
                </div>
                <div className="mx-5 mt-4 border-b border-white/15 sm:mx-6">
                  <div className="w-32 border-b border-white pb-3 text-sm font-bold text-white">
                    All styles
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                  <div
                    role="radiogroup"
                    aria-label="Caption style"
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    {allPresetOptions.map((preset) => (
                      <PresetCard
                        key={preset.id}
                        preset={preset}
                        selected={
                          preset.id === "__none"
                            ? modalPresetId === null
                            : modalPresetId === preset.id
                        }
                        radio
                        onSelect={() =>
                          setModalPresetId(
                            preset.id === "__none" ? null : preset.id,
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-white/10 bg-[#171817] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="min-w-0 truncate text-sm text-[#aeb19a]">
                    Selected:{" "}
                    <span className="font-bold text-white">
                      {selectedModalPreset.name}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      selectPreset(selectedModalPreset.id);
                      setShowAllPresets(false);
                    }}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-[#111] transition hover:bg-[#e8c000]"
                  >
                    Select Style
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
