export type TikTokUploadInput = {
  clipId: string;
  title?: string | null;
  caption?: string | null;
  hashtags?: string[];
};

export async function uploadClipToTikTok(_input: TikTokUploadInput) {
  throw new Error("Composio TikTok upload is a Phase 5 integration and is not implemented yet.");
}
