export type OpusClipProcessingInput = {
  videoId: string;
  sourceUrl?: string | null;
  sourceStoragePath?: string | null;
};

export async function processVideoWithOpusClip(_input: OpusClipProcessingInput) {
  throw new Error("OpusClip Playwright automation is a later-phase worker integration and is not implemented yet.");
}
