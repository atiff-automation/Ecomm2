-- CreateEnum
CREATE TYPE "public"."ReceiptTemplateType" AS ENUM ('THERMAL_RECEIPT', 'BUSINESS_INVOICE', 'MINIMAL_RECEIPT', 'DETAILED_INVOICE');

-- AlterTable
ALTER TABLE "public"."business_profile" ADD COLUMN     "logoHeight" INTEGER DEFAULT 40,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "logoWidth" INTEGER DEFAULT 120;

-- CreateTable
CREATE TABLE "public"."receipt_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateType" "public"."ReceiptTemplateType" NOT NULL,
    "templateContent" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "previewImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "receipt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "guestEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'delivered',
    "webhookAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_webhook_queue" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_webhook_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "receipt_templates_templateType_idx" ON "public"."receipt_templates"("templateType");

-- CreateIndex
CREATE INDEX "receipt_templates_isDefault_isActive_idx" ON "public"."receipt_templates"("isDefault", "isActive");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "public"."chat_sessions"("userId");

-- CreateIndex
CREATE INDEX "chat_sessions_status_idx" ON "public"."chat_sessions"("status");

-- CreateIndex
CREATE INDEX "chat_sessions_expiresAt_idx" ON "public"."chat_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "public"."chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "chat_messages_status_idx" ON "public"."chat_messages"("status");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "public"."chat_messages"("createdAt");

-- CreateIndex
CREATE INDEX "chat_webhook_queue_status_idx" ON "public"."chat_webhook_queue"("status");

-- CreateIndex
CREATE INDEX "chat_webhook_queue_nextRetryAt_idx" ON "public"."chat_webhook_queue"("nextRetryAt");

-- CreateIndex
CREATE INDEX "chat_webhook_queue_messageId_idx" ON "public"."chat_webhook_queue"("messageId");

-- AddForeignKey
ALTER TABLE "public"."chat_sessions" ADD CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_webhook_queue" ADD CONSTRAINT "chat_webhook_queue_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
