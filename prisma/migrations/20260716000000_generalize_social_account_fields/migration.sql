-- Rename Instagram-specific SocialAccount columns to platform-generic names.
-- Uses RENAME COLUMN to preserve existing data (Instagram accounts, etc.).
ALTER TABLE "social_accounts" RENAME COLUMN "ig_user_id" TO "platform_user_id";
ALTER TABLE "social_accounts" RENAME COLUMN "ig_username" TO "platform_username";
