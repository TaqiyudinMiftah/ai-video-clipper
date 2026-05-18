-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('url', 'file');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('pending', 'queued', 'uploading_to_opusclip', 'processing_in_opusclip', 'downloading_clips', 'storing_clips', 'generating_caption', 'ready_to_upload', 'uploading_to_tiktok', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ClipStatus" AS ENUM ('created', 'stored', 'ready_to_upload', 'uploading', 'uploaded', 'failed');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('queued', 'uploading', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('opusclip_process', 'upload_tiktok', 'generate_caption');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'queued', 'active', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('info', 'warning', 'error');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "source_url" TEXT,
    "source_storage_path" TEXT,
    "title" TEXT,
    "duration_seconds" INTEGER,
    "status" "VideoStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clips" (
    "id" UUID NOT NULL,
    "video_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "opusclip_clip_id" TEXT,
    "storage_path" TEXT,
    "preview_url" TEXT,
    "duration_seconds" INTEGER,
    "title" TEXT,
    "caption" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ClipStatus" NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_targets" (
    "id" UUID NOT NULL,
    "clip_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "upload_status" "UploadStatus" NOT NULL DEFAULT 'queued',
    "uploaded_url" TEXT,
    "platform_response" JSONB,
    "scheduled_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "video_id" UUID,
    "clip_id" UUID,
    "job_type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" UUID NOT NULL,
    "job_id" UUID,
    "user_id" UUID NOT NULL,
    "level" "LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "videos_user_id_idx" ON "videos"("user_id");

-- CreateIndex
CREATE INDEX "videos_status_idx" ON "videos"("status");

-- CreateIndex
CREATE INDEX "videos_user_id_status_idx" ON "videos"("user_id", "status");

-- CreateIndex
CREATE INDEX "videos_user_id_created_at_idx" ON "videos"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "videos_user_id_updated_at_idx" ON "videos"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "clips_user_id_idx" ON "clips"("user_id");

-- CreateIndex
CREATE INDEX "clips_video_id_idx" ON "clips"("video_id");

-- CreateIndex
CREATE INDEX "clips_status_idx" ON "clips"("status");

-- CreateIndex
CREATE INDEX "clips_user_id_status_idx" ON "clips"("user_id", "status");

-- CreateIndex
CREATE INDEX "clips_video_id_status_idx" ON "clips"("video_id", "status");

-- CreateIndex
CREATE INDEX "upload_targets_user_id_idx" ON "upload_targets"("user_id");

-- CreateIndex
CREATE INDEX "upload_targets_clip_id_idx" ON "upload_targets"("clip_id");

-- CreateIndex
CREATE INDEX "upload_targets_platform_idx" ON "upload_targets"("platform");

-- CreateIndex
CREATE INDEX "upload_targets_upload_status_idx" ON "upload_targets"("upload_status");

-- CreateIndex
CREATE INDEX "upload_targets_user_id_upload_status_idx" ON "upload_targets"("user_id", "upload_status");

-- CreateIndex
CREATE INDEX "upload_targets_clip_id_platform_upload_status_idx" ON "upload_targets"("clip_id", "platform", "upload_status");

-- CreateIndex
CREATE INDEX "jobs_user_id_idx" ON "jobs"("user_id");

-- CreateIndex
CREATE INDEX "jobs_video_id_idx" ON "jobs"("video_id");

-- CreateIndex
CREATE INDEX "jobs_clip_id_idx" ON "jobs"("clip_id");

-- CreateIndex
CREATE INDEX "jobs_job_type_idx" ON "jobs"("job_type");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_user_id_job_type_status_idx" ON "jobs"("user_id", "job_type", "status");

-- CreateIndex
CREATE INDEX "jobs_user_id_created_at_idx" ON "jobs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "logs_job_id_idx" ON "logs"("job_id");

-- CreateIndex
CREATE INDEX "logs_user_id_idx" ON "logs"("user_id");

-- CreateIndex
CREATE INDEX "logs_level_idx" ON "logs"("level");

-- CreateIndex
CREATE INDEX "logs_job_id_created_at_idx" ON "logs"("job_id", "created_at");

-- CreateIndex
CREATE INDEX "logs_user_id_created_at_idx" ON "logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clips" ADD CONSTRAINT "clips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clips" ADD CONSTRAINT "clips_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_targets" ADD CONSTRAINT "upload_targets_clip_id_fkey" FOREIGN KEY ("clip_id") REFERENCES "clips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_targets" ADD CONSTRAINT "upload_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_clip_id_fkey" FOREIGN KEY ("clip_id") REFERENCES "clips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
