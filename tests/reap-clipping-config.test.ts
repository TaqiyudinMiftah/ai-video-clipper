import assert from "node:assert/strict";
import test from "node:test";
import { buildCreateClipsPayload, reapClippingConfigSchema } from "../src/lib/reap/clipping-config";

const validConfig = {
  genre: "talking",
  captionsPreset: "system_beasty",
  enableEmojis: true,
  enableHighlights: true,
  reframeClips: true,
  language: null,
  translationLanguage: null,
  transcriptionScript: "native",
  exportOrientation: "portrait",
  exportResolution: 1080,
  selectedStart: null,
  selectedEnd: null,
  clipDurations: [[30, 60]],
  topics: ["bitcoin", "rupiah"],
} as const;

test("accepts a complete Reap clipping config", () => {
  const parsed = reapClippingConfigSchema.safeParse(validConfig);

  assert.equal(parsed.success, true);
});

test("rejects unsupported clip duration ranges", () => {
  const parsed = reapClippingConfigSchema.safeParse({
    ...validConfig,
    clipDurations: [[10, 45]],
  });

  assert.equal(parsed.success, false);
});

test("omits language from Reap payload when auto-detect is selected", () => {
  const parsed = reapClippingConfigSchema.parse(validConfig);
  const payload = buildCreateClipsPayload(parsed, { sourceUrl: "https://example.com/video.mp4" });

  assert.equal("language" in payload, false);
  assert.equal(payload.sourceUrl, "https://example.com/video.mp4");
});

test("normalizes empty language values to null", () => {
  const parsed = reapClippingConfigSchema.parse({
    ...validConfig,
    language: " ",
    translationLanguage: "",
  });

  assert.equal(parsed.language, null);
  assert.equal(parsed.translationLanguage, null);
});
