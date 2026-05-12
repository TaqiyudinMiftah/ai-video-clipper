export type StorageProvider = "supabase";

export type UploadFileInput = {
  path: string;
  file: Blob | ArrayBuffer | Uint8Array | Buffer;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
};

export type UploadFileResult = {
  path: string;
  bucket: string;
};

export type DownloadFileResult = {
  path: string;
  data: Blob;
};

export type SignedUrlResult = {
  path: string;
  signedUrl: string;
  expiresInSeconds: number;
};

export interface StorageService {
  uploadFile(input: UploadFileInput): Promise<UploadFileResult>;
  downloadFile(path: string): Promise<DownloadFileResult>;
  getSignedUrl(path: string, expiresInSeconds?: number): Promise<SignedUrlResult>;
  deleteFile(path: string): Promise<void>;
}
