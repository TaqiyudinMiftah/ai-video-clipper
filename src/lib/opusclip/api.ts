import { getStorageService } from "@/lib/storage";
import type {
  DownloadedOpusClip,
  OpusClipAutomationInput,
  OpusClipAutomationResult,
  OpusClipGeneratedClip,
} from "@/lib/opusclip/types";

type OpusClipApiConfig = {
  apiBaseUrl: string;
  apiKey: string;
  orgId?: string;
  pollIntervalMs: number;
  maxWaitMs: number;
  clipDurationSeconds: number;
  curationModel: string;
  sourceLang: string;
};

type UploadLinkResponse = {
  url?: string;
  uploadId?: string;
};

type RawOpusClip = {
  id?: string;
  projectId?: string;
  title?: string;
  uri?: string;
  uriForPreview?: string;
  uriForExport?: string;
  durationMs?: number;
  description?: string;
  text?: string;
  hashtags?: string | string[];
};

function getNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getOpusClipApiConfig(): OpusClipApiConfig {
  const apiKey = process.env.OPUSCLIP_API_KEY;

  if (!apiKey) {
    throw new Error("OPUSCLIP_API_KEY is required when OPUSCLIP_USE_API=true.");
  }

  return {
    apiBaseUrl: trimTrailingSlash(process.env.OPUSCLIP_API_BASE_URL ?? "https://api.opus.pro/api"),
    apiKey,
    orgId: process.env.OPUSCLIP_ORG_ID || undefined,
    pollIntervalMs: getNumberEnv("OPUSCLIP_API_POLL_INTERVAL_MS", 30_000),
    maxWaitMs: getNumberEnv("OPUSCLIP_API_MAX_WAIT_MS", 30 * 60 * 1000),
    clipDurationSeconds: getNumberEnv("OPUSCLIP_API_CLIP_DURATION_SECONDS", 90),
    curationModel: process.env.OPUSCLIP_API_CURATION_MODEL ?? "ClipBasic",
    sourceLang: process.env.OPUSCLIP_API_SOURCE_LANG ?? "auto",
  };
}

export function isOpusClipApiEnabled() {
  return process.env.OPUSCLIP_USE_API === "true";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiHeaders(config: OpusClipApiConfig, includeJson = true) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(config.orgId ? { "x-opus-org-id": config.orgId } : {}),
  };
}

async function readApiError(response: Response) {
  const body = await response.text().catch(() => "");
  const message = body ? ` ${body.slice(0, 500)}` : "";
  return `OpusClip API request failed (${response.status} ${response.statusText}).${message}`;
}

async function opusFetchJson<T>(config: OpusClipApiConfig, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...getApiHeaders(config),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as T;
}

async function createUploadLink(config: OpusClipApiConfig) {
  const data = await opusFetchJson<UploadLinkResponse>(config, "/upload-links", {
    method: "POST",
    body: JSON.stringify({
      video: {
        usecase: "LocalUpload",
      },
    }),
  });

  if (!data.url || !data.uploadId) {
    throw new Error("OpusClip upload-link response did not include both url and uploadId.");
  }

  return {
    url: data.url,
    uploadId: data.uploadId,
  };
}

async function startResumableUpload(uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Length": "0",
      "x-goog-resumable": "start",
    },
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const location = response.headers.get("location");

  if (!location) {
    throw new Error("OpusClip resumable upload response did not include a location header.");
  }

  return location;
}

function toArrayBuffer(data: Uint8Array) {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy.buffer;
}

async function uploadVideoBytes(location: string, data: Uint8Array, contentType: string) {
  const body = new Blob([toArrayBuffer(data)], {
    type: contentType,
  });
  const response = await fetch(location, {
    method: "PUT",
    headers: {
      "Content-Length": String(data.byteLength),
      "Content-Type": contentType,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }
}

async function getSourceUploadId(config: OpusClipApiConfig, sourceStoragePath: string) {
  const sourceFile = await getStorageService().downloadFile(sourceStoragePath);
  const sourceBytes = new Uint8Array(await sourceFile.data.arrayBuffer());
  const uploadLink = await createUploadLink(config);
  const uploadLocation = await startResumableUpload(uploadLink.url);

  await uploadVideoBytes(uploadLocation, sourceBytes, sourceFile.data.type || "application/octet-stream");

  return uploadLink.uploadId;
}

function buildCreateProjectBody(config: OpusClipApiConfig, videoUrl: string, title?: string | null) {
  return {
    videoUrl,
    ...(title
      ? {
          uploadedVideoAttr: {
            title,
          },
        }
      : {}),
    curationPref: {
      model: config.curationModel,
      clipDurations: [[0, config.clipDurationSeconds]],
      genre: "Auto",
      range: {},
      skipCurate: false,
    },
    importPref: {
      sourceLang: config.sourceLang,
    },
  };
}

function findProjectId(responseBody: unknown, response: Response) {
  const candidates = [
    response.headers.get("x-opus-project-id"),
    response.headers.get("x-project-id"),
  ];

  if (responseBody && typeof responseBody === "object") {
    const body = responseBody as Record<string, unknown>;
    const data = typeof body.data === "object" && body.data ? (body.data as Record<string, unknown>) : undefined;
    const project = typeof body.project === "object" && body.project ? (body.project as Record<string, unknown>) : undefined;

    candidates.push(
      typeof body.projectId === "string" ? body.projectId : null,
      typeof body.id === "string" ? body.id : null,
      typeof data?.projectId === "string" ? data.projectId : null,
      typeof data?.id === "string" ? data.id : null,
      typeof project?.id === "string" ? project.id : null,
    );
  }

  return candidates.find((candidate): candidate is string => Boolean(candidate));
}

async function createClipProject(config: OpusClipApiConfig, videoUrl: string, title?: string | null) {
  const response = await fetch(`${config.apiBaseUrl}/clip-projects`, {
    method: "POST",
    headers: getApiHeaders(config),
    body: JSON.stringify(buildCreateProjectBody(config, videoUrl, title)),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const body = (await response.json().catch(() => null)) as unknown;
  const projectId = findProjectId(body, response);

  if (!projectId) {
    throw new Error("OpusClip create-project response did not include a project id.");
  }

  return {
    projectId,
    response: body,
  };
}

function normalizeHashtags(value: RawOpusClip["hashtags"]) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
}

function normalizeClip(clip: RawOpusClip): OpusClipGeneratedClip | null {
  if (!clip.id) {
    return null;
  }

  return {
    opusclipClipId: clip.id,
    title: clip.title,
    pageUrl: clip.uri,
    previewUrl: clip.uriForPreview,
    exportUrl: clip.uriForExport,
    caption: clip.description || clip.text,
    hashtags: normalizeHashtags(clip.hashtags),
    durationSeconds: typeof clip.durationMs === "number" ? Math.round(clip.durationMs / 1000) : undefined,
  };
}

function readClipsResponse(body: unknown) {
  if (Array.isArray(body)) {
    return body as RawOpusClip[];
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;

    if (Array.isArray(record.clips)) {
      return record.clips as RawOpusClip[];
    }

    if (Array.isArray(record.data)) {
      return record.data as RawOpusClip[];
    }
  }

  return [];
}

async function listExportableClips(config: OpusClipApiConfig, projectId: string) {
  const params = new URLSearchParams({
    q: "findByProjectId",
    projectId,
    pageNum: "1",
    pageSize: "50",
  });
  const data = await opusFetchJson<unknown>(config, `/exportable-clips?${params.toString()}`, {
    method: "GET",
  });

  return readClipsResponse(data).map(normalizeClip).filter((clip): clip is OpusClipGeneratedClip => Boolean(clip));
}

async function waitForExportableClips(config: OpusClipApiConfig, projectId: string) {
  const deadline = Date.now() + config.maxWaitMs;
  let latestClips: OpusClipGeneratedClip[] = [];

  while (Date.now() < deadline) {
    latestClips = await listExportableClips(config, projectId);

    if (latestClips.some((clip) => clip.exportUrl || clip.previewUrl)) {
      return latestClips;
    }

    await sleep(config.pollIntervalMs);
  }

  throw new Error(
    `Timed out waiting for OpusClip exportable clips after ${Math.round(config.maxWaitMs / 1000)} seconds.`,
  );
}

function getClipDownloadUrl(clip: OpusClipGeneratedClip) {
  return clip.exportUrl || clip.previewUrl;
}

async function downloadExportableClip(clip: OpusClipGeneratedClip): Promise<DownloadedOpusClip> {
  const downloadUrl = getClipDownloadUrl(clip);

  if (!downloadUrl) {
    throw new Error(`OpusClip clip ${clip.opusclipClipId} did not include an export or preview URL.`);
  }

  const response = await fetch(downloadUrl);

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const data = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "video/mp4";

  return {
    clip,
    data,
    contentType,
    fileName: `${clip.opusclipClipId.replace(/[^a-zA-Z0-9._-]/g, "_")}.mp4`,
  };
}

export async function runOpusClipApiProcessing(input: OpusClipAutomationInput): Promise<OpusClipAutomationResult> {
  const config = getOpusClipApiConfig();
  const videoUrl = input.sourceStoragePath
    ? await getSourceUploadId(config, input.sourceStoragePath)
    : input.sourceUrl;

  if (!videoUrl) {
    throw new Error("No source URL or source storage path was provided for OpusClip API processing.");
  }

  const project = await createClipProject(config, videoUrl, input.title);
  const clips = await waitForExportableClips(config, project.projectId);
  const downloadableClips = clips.filter((clip) => clip.exportUrl || clip.previewUrl);
  const downloadedClips = await Promise.all(downloadableClips.map(downloadExportableClip));

  return {
    clips,
    downloadedClips,
    simulated: false,
  };
}
