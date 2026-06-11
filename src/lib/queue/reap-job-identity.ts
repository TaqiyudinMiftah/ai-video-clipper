import { createHash } from "node:crypto";

function formatUuidFromHash(seed: string) {
  const bytes = Buffer.from(createHash("sha256").update(seed).digest("hex").slice(0, 32), "hex");

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getReapPollingJobId(videoId: string, reapProjectId: string) {
  return formatUuidFromHash(`reap-polling:${videoId}:${reapProjectId}`);
}

export function getReapClipDownloadJobId(videoId: string, reapProjectId: string) {
  return formatUuidFromHash(`reap-download:${videoId}:${reapProjectId}`);
}
