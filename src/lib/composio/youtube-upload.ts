import { createHash } from "crypto";
import https from "node:https";

export type YouTubeUploadOptions = {
  entityId: string;
  /** Optional explicit connected account id; if omitted, Composio resolves
   *  the single account under the entity (same pattern as Instagram). */
  connectedAccountId?: string;
  /** Public URL of the video (from your storage/R2) */
  videoUrl: string;
  /** Original filename for the video */
  videoFilename: string;
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: "public" | "private" | "unlisted";
};

export type YouTubeUploadResult = {
  success: boolean;
  videoId?: string;
  error?: string;
};

function getComposioBaseUrl(): string {
  return process.env.COMPOSIO_BASE_URL ?? "https://backend.composio.dev";
}

/**
 * Node's fetch throws a generic "fetch failed" and hides the real reason in
 * `error.cause`. This surfaces the underlying code/message (ENOTFOUND,
 * ECONNREFUSED, UND_ERR_CONNECT_TIMEOUT, TLS errors, etc.).
 */
function describeError(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as { cause?: unknown }).cause;
    if (cause instanceof Error) {
      const code = (cause as { code?: string }).code;
      return `${error.message} (cause: ${code ? `${code} - ` : ""}${cause.message})`;
    }
    if (cause) {
      return `${error.message} (cause: ${String(cause)})`;
    }
    return error.message;
  }
  return String(error);
}

/**
 * Fetch wrapper used ONLY for the R2 storage download. When the dev machine's
 * system clock is set into the future (this project is sometimes tested with a
 * 2026 clock), Cloudflare's otherwise-valid R2 certificate falls outside its
 * ~90-day validity window and Node rejects it with `CERT_HAS_EXPIRED`. This is
 * a dev-only escape hatch: it disables TLS verification for the single download
 * request and restores the previous setting immediately after.
 *
 * It is gated behind COMPOSIO_ALLOW_INSECURE_TLS=true and applied to NO other
 * request (Composio API calls stay fully verified). NEVER enable this in
 * production — Vercel runs on the correct clock and must keep verification on.
 */
function insecureTlsEnabled(): boolean {
  return process.env.COMPOSIO_ALLOW_INSECURE_TLS === "true";
}

type StorageDownload = { ok: boolean; status: number; body: ArrayBuffer };

/**
 * Download the R2 video via node:https.
 *
 * Dev-only insecure mode (COMPOSIO_ALLOW_INSECURE_TLS=true) uses an https.Agent
 * with `rejectUnauthorized: false` to skip certificate verification. This is
 * preferred over flipping NODE_TLS_REJECT_UNAUTHORIZED: setting that env var
 * makes Node emit a security warning, which next.config.mjs re-emits via
 * process.emitWarning and crashes the dev server
 * (RangeError: Map maximum size exceeded). The https.Agent path emits no
 * warning at all. Production never sets the flag, so verification stays on.
 */
function downloadStorageVideo(url: string): Promise<StorageDownload> {
  const insecure = insecureTlsEnabled();
  const agent = insecure
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

  // Cloudflare's public r2.dev endpoint returns 403 for requests that don't
  // look like a browser (Node's default has no User-Agent). Composio and real
  // browsers send one and succeed, so we mirror a browser here.
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    Accept: "*/*",
  };

  const get = (target: string, redirectsLeft: number): Promise<StorageDownload> =>
    new Promise<StorageDownload>((resolve, reject) => {
      const req = https.get(target, { agent, headers }, (res) => {
        const status = res.statusCode ?? 0;

        if (
          redirectsLeft > 0 &&
          [301, 302, 307, 308].includes(status) &&
          res.headers.location
        ) {
          res.resume();
          const next = new URL(res.headers.location, target).toString();
          resolve(get(next, redirectsLeft - 1));
          return;
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            ok: status >= 200 && status < 300,
            status,
            body: Buffer.concat(chunks).buffer as ArrayBuffer,
          });
        });
      });
      req.on("error", reject);
    });

  return get(url, 3);
}

/**
 * Stage a file to Composio S3 storage via presigned URL.
 * Returns the s3key that can be used in subsequent tool calls.
 */
async function stageVideoToComposio(
  apiKey: string,
  videoUrl: string,
  filename: string,
): Promise<{ s3key: string; error?: string }> {
  // Derive the MIME type from the filename so the staged object matches the
  // actual video (mp4 / mov / webm).
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimetype =
    ext === "mov"
      ? "video/quicktime"
      : ext === "webm"
        ? "video/webm"
        : "video/mp4";

  // Step 1: Download the video first so we can compute its md5. Composio's
  // /files/upload/request endpoint requires the `md5` of the file.
  let videoBody: ArrayBuffer;
  try {
    const downloadRes = await downloadStorageVideo(videoUrl);
    if (!downloadRes.ok) {
      const bodySnippet = Buffer.from(downloadRes.body)
        .toString("utf8")
        .replace(/\s+/g, " ")
        .slice(0, 200);
      return {
        s3key: "",
        error: `Failed to download video from storage (${downloadRes.status}). URL: ${videoUrl}${bodySnippet ? ` — ${bodySnippet}` : ""}`,
      };
    }
    videoBody = downloadRes.body;
  } catch (error) {
    return {
      s3key: "",
      error: `Could not reach video storage URL (${videoUrl}): ${describeError(error)} [insecureTls=${insecureTlsEnabled() ? "on" : "off"}]`,
    };
  }

  const md5 = createHash("md5").update(new Uint8Array(videoBody)).digest("hex");

  // Step 2: Request a presigned upload URL from Composio (now with md5).
  let presignedUrl = "";
  let storageKey = "";
  try {
    const presignedRes = await fetch(
      `${getComposioBaseUrl()}/api/v3.1/files/upload/request`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          mimetype,
          md5,
          tool_slug: "YOUTUBE_MULTIPART_UPLOAD_VIDEO",
          toolkit_slug: "youtube",
        }),
      },
    );

    if (!presignedRes.ok) {
      const text = await presignedRes.text();
      return {
        s3key: "",
        error: `Failed to get presigned URL: ${text.slice(0, 200)}`,
      };
    }

    const presignedData = (await presignedRes.json()) as {
      new_presigned_url?: string;
      key?: string;
      newPresignedUrl?: string;
    };

    presignedUrl =
      presignedData.new_presigned_url ?? presignedData.newPresignedUrl ?? "";
    storageKey = presignedData.key ?? "";
  } catch (error) {
    return {
      s3key: "",
      error: `Could not reach Composio presigned endpoint: ${describeError(error)}`,
    };
  }

  if (!presignedUrl || !storageKey) {
    return { s3key: "", error: "No presigned URL or storage key returned" };
  }

  // Step 3: Upload the downloaded buffer to Composio's presigned URL.
  try {
    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mimetype,
      },
      body: videoBody,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text().catch(() => "");
      return {
        s3key: "",
        error: `Failed to upload to Composio storage (${uploadRes.status}): ${text.slice(0, 200)}`,
      };
    }
  } catch (error) {
    return {
      s3key: "",
      error: `Could not upload to Composio storage URL: ${describeError(error)}`,
    };
  }

  return { s3key: storageKey };
}

export async function uploadYouTubeVideo(
  options: YouTubeUploadOptions,
): Promise<YouTubeUploadResult> {
  const {
    entityId,
    connectedAccountId,
    videoUrl,
    videoFilename,
    title,
    description = "",
    tags = [],
    categoryId = "22",
    privacyStatus = "public",
  } = options;

  const apiKey = process.env.COMPOSIO_API_KEY;

  if (!apiKey) {
    return { success: false, error: "COMPOSIO_API_KEY is not configured" };
  }

  try {
    // Step 1: Stage the video file to Composio S3
    const { s3key, error: stageError } = await stageVideoToComposio(
      apiKey,
      videoUrl,
      videoFilename,
    );

    if (stageError) {
      return { success: false, error: `Staging failed: ${stageError}` };
    }

    // Step 2: Upload to YouTube using the staged file
    let response: Response;
    try {
      response = await fetch(
      `${getComposioBaseUrl()}/api/v3.1/tools/execute/YOUTUBE_MULTIPART_UPLOAD_VIDEO`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: entityId,
          entity_id: entityId,
          ...(connectedAccountId
            ? { connected_account_id: connectedAccountId }
            : {}),
          arguments: {
            title,
            description,
            tags,
            categoryId,
            privacyStatus,
            videoFile: {
              name: videoFilename,
              mimetype: "video/mp4",
              s3key,
            },
          },
        }),
      },
    );
    } catch (error) {
      return {
        success: false,
        error: `Could not reach Composio upload endpoint: ${describeError(error)}`,
      };
    }

    if (!response.ok) {
      const text = await response.text();
      return {
        success: false,
        error: `Failed to upload YouTube video (${response.status}): ${text.slice(0, 300)}`,
      };
    }

    const data = await response.json();
    const videoId = data?.data?.video?.id ?? data?.data?.id ?? data?.id ?? "";

    if (!videoId) {
      return {
        success: false,
        error: "No video ID returned from YouTube upload",
      };
    }

    return {
      success: true,
      videoId,
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error during YouTube upload: ${describeError(error)}`,
    };
  }
}
