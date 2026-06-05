import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { getReapConfig } from "@/lib/reap/config";
import type { ReapCreateClipsRequest, ReapGenre, ReapOrientation, ReapTranscriptionScript } from "@/lib/reap/types";

export const allowedClipDurationRanges = [
  [0, 30],
  [30, 60],
  [60, 90],
  [90, 180],
] as const;

const clipDurationRangeSchema = z
  .tuple([z.number().int().min(0), z.number().int().positive()])
  .refine(
    ([min, max]) => allowedClipDurationRanges.some(([allowedMin, allowedMax]) => min === allowedMin && max === allowedMax),
    "Unsupported clip duration range.",
  );

const nullableTrimmedStringSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable();

export const reapClippingConfigSchema = z
  .strictObject({
    genre: z.enum(["talking", "screenshare", "gaming"]),
    captionsPreset: nullableTrimmedStringSchema,
    enableEmojis: z.boolean(),
    enableHighlights: z.boolean(),
    reframeClips: z.boolean(),
    language: nullableTrimmedStringSchema,
    translationLanguage: nullableTrimmedStringSchema,
    transcriptionScript: z.enum(["native", "roman"]),
    exportOrientation: z.enum(["portrait", "landscape", "square"]),
    exportResolution: z.union([z.literal(720), z.literal(1080), z.literal(1440), z.literal(2160)]),
    selectedStart: z.number().min(0).nullable(),
    selectedEnd: z.number().positive().nullable(),
    clipDurations: z.array(clipDurationRangeSchema).min(1).max(4),
    topics: z.array(z.string().trim().min(1).max(80)).max(20),
  })
  .refine(
    (value) => value.selectedStart === null || value.selectedEnd === null || value.selectedStart < value.selectedEnd,
    {
      message: "selectedStart must be less than selectedEnd.",
      path: ["selectedEnd"],
    },
  );

export type ReapClippingConfig = z.infer<typeof reapClippingConfigSchema>;

export function getDefaultReapClippingConfig(): ReapClippingConfig {
  const envConfig = getReapConfig();

  return {
    genre: ["talking", "screenshare", "gaming"].includes(envConfig.defaultGenre)
      ? (envConfig.defaultGenre as ReapGenre)
      : "talking",
    captionsPreset: envConfig.defaultCaptionsPreset,
    enableEmojis: envConfig.defaultEnableEmojis,
    enableHighlights: envConfig.defaultEnableHighlights,
    reframeClips: envConfig.defaultReframe,
    language: null,
    translationLanguage: null,
    transcriptionScript: "native",
    exportOrientation: ["portrait", "landscape", "square"].includes(envConfig.defaultOrientation)
      ? (envConfig.defaultOrientation as ReapOrientation)
      : "portrait",
    exportResolution: [720, 1080, 1440, 2160].includes(envConfig.defaultResolution)
      ? (envConfig.defaultResolution as 720 | 1080 | 1440 | 2160)
      : 1080,
    selectedStart: null,
    selectedEnd: null,
    clipDurations: [[30, 60]],
    topics: [],
  };
}

export function parseTopicsInput(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function readReapClippingConfig(value: Prisma.JsonValue | null | undefined): ReapClippingConfig {
  const parsed = reapClippingConfigSchema.safeParse(value);

  if (parsed.success) {
    return parsed.data;
  }

  return getDefaultReapClippingConfig();
}

export function buildCreateClipsPayload(
  config: ReapClippingConfig,
  source: { sourceUrl?: string | null; uploadId?: string | null },
): ReapCreateClipsRequest {
  return {
    ...(source.sourceUrl ? { sourceUrl: source.sourceUrl } : {}),
    ...(source.uploadId ? { uploadId: source.uploadId } : {}),
    genre: config.genre as ReapGenre,
    exportOrientation: config.exportOrientation as ReapOrientation,
    exportResolution: config.exportResolution,
    reframeClips: config.reframeClips,
    captionsPreset: config.captionsPreset,
    enableEmojis: config.enableEmojis,
    enableHighlights: config.enableHighlights,
    ...(config.language ? { language: config.language } : {}),
    ...(config.translationLanguage ? { translationLanguage: config.translationLanguage } : {}),
    transcriptionScript: config.transcriptionScript as ReapTranscriptionScript,
    ...(config.selectedStart !== null ? { selectedStart: config.selectedStart } : {}),
    ...(config.selectedEnd !== null ? { selectedEnd: config.selectedEnd } : {}),
    clipDurations: config.clipDurations,
    ...(config.topics.length > 0 ? { topics: config.topics } : {}),
  };
}
