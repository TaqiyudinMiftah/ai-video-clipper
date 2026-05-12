export type ClipCaptionInput = {
  clipId: string;
  clipTitle?: string | null;
  existingCaption?: string | null;
  existingHashtags?: string[];
  videoTitle?: string | null;
  sourceUrl?: string | null;
};

export type GeneratedClipMetadata = {
  title: string;
  caption: string;
  hashtags: string[];
  provider: "placeholder";
  message: string;
};

function compactTitle(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export async function generateClipMetadata(input: ClipCaptionInput): Promise<GeneratedClipMetadata> {
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
  const baseTitle = compactTitle(input.clipTitle) ?? compactTitle(input.videoTitle) ?? "Untitled short clip";
  const title = baseTitle.startsWith("Clip:") ? baseTitle : `Clip: ${baseTitle}`;
  const hashtags = input.existingHashtags?.length ? input.existingHashtags : ["#shorts", "#tiktok", "#creator"];

  if (!hasOpenAiKey) {
    return {
      title,
      caption:
        input.existingCaption?.trim() ||
        "Placeholder caption: add the strongest hook, one useful takeaway, and a simple call to watch the full story.",
      hashtags,
      provider: "placeholder",
      message: "OPENAI_API_KEY is missing, so a safe placeholder caption was generated instead.",
    };
  }

  return {
    title,
    caption:
      input.existingCaption?.trim() ||
      "Placeholder caption: OpenAI configuration is present, but real LLM caption generation is not wired in this MVP phase yet.",
    hashtags,
    provider: "placeholder",
    message: "Placeholder caption generated. Real OpenAI integration is intentionally deferred.",
  };
}
