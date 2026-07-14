import { CloudflareR2StorageAdapter } from "@/lib/storage/cloudflare-r2-storage-adapter";
import { requireEnv } from "@/lib/env";
import type { StorageService } from "@/lib/storage/types";

let storageService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (storageService) {
    return storageService;
  }

  storageService = new CloudflareR2StorageAdapter({
    accountId: requireEnv("CLOUDFLARE_R2_ACCOUNT_ID"),
    accessKeyId: requireEnv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    bucket: process.env.CLOUDFLARE_R2_BUCKET ?? "ai-video-clipper",
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL,
  });

  return storageService;
}

export type {
  DownloadFileResult,
  PublicUrlResult,
  SignedUploadUrlResult,
  SignedUrlResult,
  StorageService,
  UploadFileInput,
  UploadFileResult,
} from "@/lib/storage/types";
