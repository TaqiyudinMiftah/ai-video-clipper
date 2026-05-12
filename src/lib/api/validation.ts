export function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeHashtags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((item) => (item.startsWith("#") ? item : `#${item}`));
}

const allowedVideoExtensions = ["mp4", "mov", "webm"] as const;
const allowedVideoMimeTypes = ["video/mp4", "video/quicktime", "video/webm", "video/mov"];

export type AllowedVideoExtension = (typeof allowedVideoExtensions)[number];

export function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ?? "";
}

export function isAllowedVideoExtension(extension: string): extension is AllowedVideoExtension {
  return allowedVideoExtensions.includes(extension as AllowedVideoExtension);
}

export function isAllowedVideoFile(file: File) {
  const extension = getFileExtension(file.name);

  if (!isAllowedVideoExtension(extension)) {
    return false;
  }

  return !file.type || allowedVideoMimeTypes.includes(file.type);
}

export function getAllowedVideoFileTypesLabel() {
  return allowedVideoExtensions.map((extension) => `.${extension}`).join(", ");
}
