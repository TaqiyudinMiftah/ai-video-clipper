export function formatStorageUploadError(status: number, body: string) {
  let message = body.trim();

  try {
    const parsed = JSON.parse(body) as {
      error?: string;
      message?: string;
    };

    message = parsed.message || parsed.error || message;
  } catch {
    // Non-JSON storage errors are shown as-is below.
  }

  if (status === 413 || /payload too large/i.test(message) || /exceeded the maximum allowed size/i.test(message)) {
    return "Cloudflare R2 Storage rejected this video because it exceeds the bucket file size limit. Raise the clips bucket limit or upload a smaller video.";
  }

  return message || `Storage upload failed with status ${status}.`;
}
