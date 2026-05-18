export const opusClipSelectors = {
  uploadButton: process.env.OPUSCLIP_UPLOAD_BUTTON_SELECTOR ?? "",
  fileInput: process.env.OPUSCLIP_FILE_INPUT_SELECTOR ?? 'input[type="file"]',
  urlInput: process.env.OPUSCLIP_URL_INPUT_SELECTOR ?? 'input[type="url"], input[placeholder*="http"], textarea[placeholder*="http"]',
  submitButton: process.env.OPUSCLIP_SUBMIT_BUTTON_SELECTOR ?? "",
  processingCompleteIndicator: process.env.OPUSCLIP_PROCESSING_COMPLETE_SELECTOR ?? "",
  generatedClipCard: process.env.OPUSCLIP_GENERATED_CLIP_CARD_SELECTOR ?? "",
  clipDownloadButton: process.env.OPUSCLIP_CLIP_DOWNLOAD_BUTTON_SELECTOR ?? "",
  newProjectButton: process.env.OPUSCLIP_NEW_PROJECT_BUTTON_SELECTOR ?? "",
} as const;
