-- Remove uploading_to_tiktok from VideoStatus enum
-- Any rows with status 'uploading_to_tiktok' will be remapped to 'ready_to_upload'

-- First, update any existing rows that have the old status
UPDATE "videos" SET "status" = 'ready_to_upload' WHERE "status" = 'uploading_to_tiktok';

-- Create a new enum type without uploading_to_tiktok
CREATE TYPE "VideoStatus_new" AS ENUM ('pending', 'queued', 'uploading_to_reap', 'processing_in_reap', 'downloading_from_reap', 'storing_clips', 'generating_caption', 'ready_to_upload', 'completed', 'failed', 'cancelled');

-- Alter the table to use the new enum
ALTER TABLE "videos" ALTER COLUMN "status" TYPE "VideoStatus_new" USING ("status"::text::"VideoStatus_new");

-- Drop the old enum
DROP TYPE "VideoStatus" CASCADE;

-- Rename the new enum to the original name
ALTER TYPE "VideoStatus_new" RENAME TO "VideoStatus";