/*
  Warnings:

  - You are about to drop the `api_cost_tracking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fulfillment_decisions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fulfillment_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shipping_calculations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shipping_rule_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shipping_rule_sets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shipping_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `shipping_zones` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."TrackingJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."TrackingJobType" AS ENUM ('UPDATE', 'RETRY', 'MANUAL', 'CLEANUP');

-- DropForeignKey
ALTER TABLE "public"."api_cost_tracking" DROP CONSTRAINT "api_cost_tracking_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."api_cost_tracking" DROP CONSTRAINT "api_cost_tracking_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."fulfillment_settings" DROP CONSTRAINT "fulfillment_settings_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."fulfillment_settings" DROP CONSTRAINT "fulfillment_settings_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_calculations" DROP CONSTRAINT "shipping_calculations_orderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_calculations" DROP CONSTRAINT "shipping_calculations_ruleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_calculations" DROP CONSTRAINT "shipping_calculations_ruleSetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_calculations" DROP CONSTRAINT "shipping_calculations_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_calculations" DROP CONSTRAINT "shipping_calculations_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_rule_history" DROP CONSTRAINT "shipping_rule_history_ruleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_rule_history" DROP CONSTRAINT "shipping_rule_history_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_rule_sets" DROP CONSTRAINT "shipping_rule_sets_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_rules" DROP CONSTRAINT "shipping_rules_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_rules" DROP CONSTRAINT "shipping_rules_ruleSetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_rules" DROP CONSTRAINT "shipping_rules_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_rules" DROP CONSTRAINT "shipping_rules_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_zones" DROP CONSTRAINT "shipping_zones_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipping_zones" DROP CONSTRAINT "shipping_zones_updatedBy_fkey";

-- AlterTable
ALTER TABLE "public"."hero_sections" ADD COLUMN     "showCTA" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showTitle" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "public"."api_cost_tracking";

-- DropTable
DROP TABLE "public"."fulfillment_decisions";

-- DropTable
DROP TABLE "public"."fulfillment_settings";

-- DropTable
DROP TABLE "public"."shipping_calculations";

-- DropTable
DROP TABLE "public"."shipping_rule_history";

-- DropTable
DROP TABLE "public"."shipping_rule_sets";

-- DropTable
DROP TABLE "public"."shipping_rules";

-- DropTable
DROP TABLE "public"."shipping_zones";

-- DropEnum
DROP TYPE "public"."CalculationMethod";

-- DropEnum
DROP TYPE "public"."DecisionMethod";

-- DropEnum
DROP TYPE "public"."OperationType";

-- DropEnum
DROP TYPE "public"."RuleType";

-- DropEnum
DROP TYPE "public"."ServiceType";

-- DropEnum
DROP TYPE "public"."SettingType";

-- CreateTable
CREATE TABLE "public"."tracking_cache" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "courierTrackingNumber" TEXT NOT NULL,
    "courierService" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "lastStatusUpdate" TIMESTAMP(3) NOT NULL,
    "trackingEvents" JSONB NOT NULL DEFAULT '[]',
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "deliveryLocation" TEXT,
    "lastApiUpdate" TIMESTAMP(3) NOT NULL,
    "nextUpdateDue" TIMESTAMP(3) NOT NULL,
    "updateFrequencyMinutes" INTEGER NOT NULL DEFAULT 120,
    "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
    "isDelivered" BOOLEAN NOT NULL DEFAULT false,
    "isFailed" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresAttention" BOOLEAN NOT NULL DEFAULT false,
    "lastApiResponse" JSONB,
    "apiResponseHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tracking_update_logs" (
    "id" TEXT NOT NULL,
    "trackingCacheId" TEXT NOT NULL,
    "updateType" TEXT NOT NULL,
    "triggeredBy" TEXT,
    "apiCallSuccess" BOOLEAN NOT NULL,
    "apiResponseTimeMs" INTEGER,
    "apiStatusCode" INTEGER,
    "apiErrorMessage" TEXT,
    "statusChanged" BOOLEAN NOT NULL DEFAULT false,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "eventsAdded" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracking_update_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tracking_job_queue" (
    "id" TEXT NOT NULL,
    "trackingCacheId" TEXT NOT NULL,
    "jobType" "public"."TrackingJobType" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "status" "public"."TrackingJobStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_job_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracking_cache_orderId_key" ON "public"."tracking_cache"("orderId");

-- CreateIndex
CREATE INDEX "tracking_cache_orderId_idx" ON "public"."tracking_cache"("orderId");

-- CreateIndex
CREATE INDEX "tracking_cache_courierTrackingNumber_idx" ON "public"."tracking_cache"("courierTrackingNumber");

-- CreateIndex
CREATE INDEX "tracking_cache_nextUpdateDue_idx" ON "public"."tracking_cache"("nextUpdateDue");

-- CreateIndex
CREATE INDEX "tracking_cache_isActive_isDelivered_idx" ON "public"."tracking_cache"("isActive", "isDelivered");

-- CreateIndex
CREATE INDEX "tracking_cache_currentStatus_idx" ON "public"."tracking_cache"("currentStatus");

-- CreateIndex
CREATE INDEX "tracking_cache_requiresAttention_idx" ON "public"."tracking_cache"("requiresAttention");

-- CreateIndex
CREATE UNIQUE INDEX "tracking_cache_orderId_courierTrackingNumber_key" ON "public"."tracking_cache"("orderId", "courierTrackingNumber");

-- CreateIndex
CREATE INDEX "tracking_update_logs_trackingCacheId_idx" ON "public"."tracking_update_logs"("trackingCacheId");

-- CreateIndex
CREATE INDEX "tracking_update_logs_startedAt_idx" ON "public"."tracking_update_logs"("startedAt");

-- CreateIndex
CREATE INDEX "tracking_update_logs_apiCallSuccess_idx" ON "public"."tracking_update_logs"("apiCallSuccess");

-- CreateIndex
CREATE INDEX "tracking_update_logs_updateType_idx" ON "public"."tracking_update_logs"("updateType");

-- CreateIndex
CREATE INDEX "tracking_job_queue_scheduledFor_status_idx" ON "public"."tracking_job_queue"("scheduledFor", "status");

-- CreateIndex
CREATE INDEX "tracking_job_queue_trackingCacheId_idx" ON "public"."tracking_job_queue"("trackingCacheId");

-- CreateIndex
CREATE INDEX "tracking_job_queue_status_idx" ON "public"."tracking_job_queue"("status");

-- CreateIndex
CREATE INDEX "tracking_job_queue_priority_idx" ON "public"."tracking_job_queue"("priority");

-- CreateIndex
CREATE INDEX "tracking_job_queue_jobType_idx" ON "public"."tracking_job_queue"("jobType");

-- AddForeignKey
ALTER TABLE "public"."tracking_cache" ADD CONSTRAINT "tracking_cache_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracking_update_logs" ADD CONSTRAINT "tracking_update_logs_trackingCacheId_fkey" FOREIGN KEY ("trackingCacheId") REFERENCES "public"."tracking_cache"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tracking_job_queue" ADD CONSTRAINT "tracking_job_queue_trackingCacheId_fkey" FOREIGN KEY ("trackingCacheId") REFERENCES "public"."tracking_cache"("id") ON DELETE CASCADE ON UPDATE CASCADE;
