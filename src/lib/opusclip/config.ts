import { existsSync } from "node:fs";
import { resolve } from "node:path";

export type OpusClipConfig = {
  baseUrl: string;
  appUrl: string;
  loginUrl: string;
  storageStatePath: string;
  artifactsDir: string;
  downloadsDir: string;
  headless: boolean;
};

export function getOpusClipConfig(): OpusClipConfig {
  const baseUrl = process.env.OPUSCLIP_BASE_URL ?? "https://www.opus.pro";

  return {
    baseUrl,
    appUrl: process.env.OPUSCLIP_APP_URL ?? `${baseUrl}/clip`,
    loginUrl: process.env.OPUSCLIP_LOGIN_URL ?? `${baseUrl}/clip`,
    storageStatePath: resolve(process.env.OPUSCLIP_STORAGE_STATE_PATH ?? "./playwright/.auth/opusclip.json"),
    artifactsDir: resolve(process.env.OPUSCLIP_ARTIFACTS_DIR ?? "./artifacts/opusclip"),
    downloadsDir: resolve(process.env.OPUSCLIP_DOWNLOADS_DIR ?? "./downloads/opusclip"),
    headless: process.env.OPUSCLIP_HEADLESS !== "false",
  };
}

export function hasSavedOpusClipSession(config = getOpusClipConfig()) {
  return existsSync(config.storageStatePath);
}
