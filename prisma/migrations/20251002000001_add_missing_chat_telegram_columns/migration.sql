-- Add missing columns to chat_sessions table
ALTER TABLE "public"."chat_sessions"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "guestPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "sessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- Add unique constraint and index for sessionId if column was just added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_sessions_sessionId_key'
  ) THEN
    -- Update existing rows to have unique sessionId values
    UPDATE "public"."chat_sessions" SET "sessionId" = "id" WHERE "sessionId" IS NULL;

    -- Make sessionId NOT NULL
    ALTER TABLE "public"."chat_sessions" ALTER COLUMN "sessionId" SET NOT NULL;

    -- Add unique constraint
    ALTER TABLE "public"."chat_sessions" ADD CONSTRAINT "chat_sessions_sessionId_key" UNIQUE ("sessionId");
  END IF;
END $$;

-- Add indexes for chat_sessions
CREATE INDEX IF NOT EXISTS "chat_sessions_sessionId_idx" ON "public"."chat_sessions"("sessionId");
CREATE INDEX IF NOT EXISTS "chat_sessions_lastActivity_idx" ON "public"."chat_sessions"("lastActivity");
CREATE INDEX IF NOT EXISTS "chat_sessions_guestPhone_idx" ON "public"."chat_sessions"("guestPhone");

-- Add missing columns to admin_telegram_config table
ALTER TABLE "public"."admin_telegram_config"
  ADD COLUMN IF NOT EXISTS "chatManagementChatId" TEXT,
  ADD COLUMN IF NOT EXISTS "chatManagementEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "systemAlertsChatId" TEXT,
  ADD COLUMN IF NOT EXISTS "systemAlertsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- Make createdBy and updatedBy nullable (schema shows they should be optional)
ALTER TABLE "public"."admin_telegram_config"
  ALTER COLUMN "createdBy" DROP NOT NULL,
  ALTER COLUMN "updatedBy" DROP NOT NULL;

-- Add indexes for admin_telegram_config
CREATE INDEX IF NOT EXISTS "admin_telegram_config_chatManagementEnabled_idx" ON "public"."admin_telegram_config"("chatManagementEnabled");
CREATE INDEX IF NOT EXISTS "admin_telegram_config_systemAlertsEnabled_idx" ON "public"."admin_telegram_config"("systemAlertsEnabled");

-- Create chat_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."chat_config" (
    "id" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "apiKey" TEXT,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "guestSessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 13,
    "authenticatedSessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 19,
    "maxMessageLength" INTEGER NOT NULL DEFAULT 4000,
    "rateLimitMessages" INTEGER NOT NULL DEFAULT 20,
    "rateLimitWindowMs" INTEGER NOT NULL DEFAULT 60000,
    "queueEnabled" BOOLEAN NOT NULL DEFAULT true,
    "queueMaxRetries" INTEGER NOT NULL DEFAULT 3,
    "queueRetryDelayMs" INTEGER NOT NULL DEFAULT 5000,
    "queueBatchSize" INTEGER NOT NULL DEFAULT 10,
    "welcomeMessage" TEXT DEFAULT 'Hi! How can we help you today?',
    "agentName" TEXT DEFAULT 'Customer Support',
    "botIconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "lastHealthCheck" TIMESTAMP(3),
    "healthStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_config_pkey" PRIMARY KEY ("id")
);

-- Add indexes and unique constraints for chat_config
CREATE INDEX IF NOT EXISTS "chat_config_isActive_idx" ON "public"."chat_config"("isActive");
CREATE INDEX IF NOT EXISTS "chat_config_verified_idx" ON "public"."chat_config"("verified");
CREATE INDEX IF NOT EXISTS "chat_config_healthStatus_idx" ON "public"."chat_config"("healthStatus");
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_chat_config" ON "public"."chat_config"("isActive");

-- Create chat_backups table if it doesn't exist (found in schema but might be missing)
CREATE TABLE IF NOT EXISTS "public"."chat_backups" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileSize" BIGINT NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "chat_backups_pkey" PRIMARY KEY ("id")
);

-- Add indexes and constraints for chat_backups
CREATE UNIQUE INDEX IF NOT EXISTS "chat_backups_filename_key" ON "public"."chat_backups"("filename");
CREATE UNIQUE INDEX IF NOT EXISTS "chat_backups_month_year_key" ON "public"."chat_backups"("month", "year");
CREATE INDEX IF NOT EXISTS "chat_backups_year_month_idx" ON "public"."chat_backups"("year", "month");
CREATE INDEX IF NOT EXISTS "chat_backups_status_idx" ON "public"."chat_backups"("status");
CREATE INDEX IF NOT EXISTS "chat_backups_createdAt_idx" ON "public"."chat_backups"("createdAt");
