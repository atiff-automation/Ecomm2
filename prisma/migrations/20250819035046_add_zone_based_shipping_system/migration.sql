/*
  Warnings:

  - The `dimensions` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `faviconUrl` on the `site_themes` table. All the data in the column will be lost.
  - You are about to drop the column `logoHeight` on the `site_themes` table. All the data in the column will be lost.
  - You are about to drop the column `logoUrl` on the `site_themes` table. All the data in the column will be lost.
  - You are about to drop the column `logoWidth` on the `site_themes` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ShippingClass" AS ENUM ('STANDARD', 'FRAGILE', 'HAZARDOUS');

-- CreateEnum
CREATE TYPE "public"."ShipmentStatus" AS ENUM ('DRAFT', 'RATE_CALCULATED', 'BOOKED', 'LABEL_GENERATED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."WebhookStatus" AS ENUM ('PENDING', 'RETRY', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."RuleType" AS ENUM ('STANDARD', 'PROMOTIONAL', 'SEASONAL', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('STANDARD', 'EXPRESS', 'OVERNIGHT', 'ECONOMY');

-- CreateEnum
CREATE TYPE "public"."OperationType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE', 'BULK_UPDATE');

-- CreateEnum
CREATE TYPE "public"."CalculationMethod" AS ENUM ('STANDARD', 'FALLBACK', 'EMERGENCY', 'CACHED');

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "deliveryInstructions" TEXT,
ADD COLUMN     "estimatedDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "selectedCourierId" TEXT,
ADD COLUMN     "shippingPreferences" JSONB;

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "customsDescription" TEXT,
ADD COLUMN     "hsCode" TEXT,
ADD COLUMN     "shippingClass" "public"."ShippingClass" NOT NULL DEFAULT 'STANDARD',
DROP COLUMN "dimensions",
ADD COLUMN     "dimensions" JSONB;

-- AlterTable
ALTER TABLE "public"."site_themes" DROP COLUMN "faviconUrl",
DROP COLUMN "logoHeight",
DROP COLUMN "logoUrl",
DROP COLUMN "logoWidth";

-- CreateTable
CREATE TABLE "public"."shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "easyParcelShipmentId" TEXT,
    "trackingNumber" TEXT,
    "courierId" TEXT NOT NULL,
    "courierName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "pickupAddress" JSONB NOT NULL,
    "deliveryAddress" JSONB NOT NULL,
    "parcelDetails" JSONB NOT NULL,
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "finalPrice" DECIMAL(10,2) NOT NULL,
    "insuranceAmount" DECIMAL(10,2),
    "codAmount" DECIMAL(10,2),
    "status" "public"."ShipmentStatus" NOT NULL DEFAULT 'DRAFT',
    "statusDescription" TEXT,
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),
    "labelUrl" TEXT,
    "labelGenerated" BOOLEAN NOT NULL DEFAULT false,
    "pickupScheduled" BOOLEAN NOT NULL DEFAULT false,
    "pickupDate" TIMESTAMP(3),
    "pickupTimeSlot" TEXT,
    "specialInstructions" TEXT,
    "signatureRequired" BOOLEAN NOT NULL DEFAULT false,
    "insuranceRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipment_tracking" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
    "source" TEXT NOT NULL DEFAULT 'EASYPARCEL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webhook_queue" (
    "id" TEXT NOT NULL,
    "trackingNumber" TEXT NOT NULL,
    "eventCode" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "shipmentId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "public"."WebhookStatus" NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "webhook_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipping_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "states" TEXT[],
    "postcodeRanges" TEXT[],
    "multiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    "deliveryTimeMin" INTEGER NOT NULL DEFAULT 1,
    "deliveryTimeMax" INTEGER NOT NULL DEFAULT 7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipping_rule_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" "public"."RuleType" NOT NULL DEFAULT 'STANDARD',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "shipping_rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipping_rules" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "weightMin" DECIMAL(6,3) NOT NULL,
    "weightMax" DECIMAL(6,3) NOT NULL,
    "price" DECIMAL(8,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'MYR',
    "serviceType" "public"."ServiceType" NOT NULL DEFAULT 'STANDARD',
    "description" VARCHAR(200),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "shipping_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipping_rule_history" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "operation" "public"."OperationType" NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB NOT NULL,
    "changeReason" TEXT,
    "changeDescription" TEXT,
    "userIp" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "shipping_rule_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shipping_calculations" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "sessionId" TEXT,
    "customerState" CHAR(3) NOT NULL,
    "customerCity" VARCHAR(100),
    "customerPostcode" VARCHAR(10),
    "totalWeight" DECIMAL(6,3) NOT NULL,
    "orderValue" DECIMAL(10,2) NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "zoneId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "basePrice" DECIMAL(8,2) NOT NULL,
    "finalPrice" DECIMAL(8,2) NOT NULL,
    "discountApplied" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "freeShippingApplied" BOOLEAN NOT NULL DEFAULT false,
    "calculationMethod" "public"."CalculationMethod" NOT NULL DEFAULT 'STANDARD',
    "calculationData" JSONB,
    "responseTimeMs" INTEGER,
    "userType" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "shipping_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_orderId_key" ON "public"."shipments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_easyParcelShipmentId_key" ON "public"."shipments"("easyParcelShipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_trackingNumber_key" ON "public"."shipments"("trackingNumber");

-- CreateIndex
CREATE INDEX "shipments_orderId_idx" ON "public"."shipments"("orderId");

-- CreateIndex
CREATE INDEX "shipments_easyParcelShipmentId_idx" ON "public"."shipments"("easyParcelShipmentId");

-- CreateIndex
CREATE INDEX "shipments_trackingNumber_idx" ON "public"."shipments"("trackingNumber");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "public"."shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_courierId_idx" ON "public"."shipments"("courierId");

-- CreateIndex
CREATE INDEX "shipment_tracking_shipmentId_idx" ON "public"."shipment_tracking"("shipmentId");

-- CreateIndex
CREATE INDEX "shipment_tracking_eventCode_idx" ON "public"."shipment_tracking"("eventCode");

-- CreateIndex
CREATE INDEX "shipment_tracking_eventTime_idx" ON "public"."shipment_tracking"("eventTime");

-- CreateIndex
CREATE INDEX "webhook_queue_status_idx" ON "public"."webhook_queue"("status");

-- CreateIndex
CREATE INDEX "webhook_queue_trackingNumber_idx" ON "public"."webhook_queue"("trackingNumber");

-- CreateIndex
CREATE INDEX "webhook_queue_nextRetryAt_idx" ON "public"."webhook_queue"("nextRetryAt");

-- CreateIndex
CREATE INDEX "webhook_queue_createdAt_idx" ON "public"."webhook_queue"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_queue_eventCode_idx" ON "public"."webhook_queue"("eventCode");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_zones_code_key" ON "public"."shipping_zones"("code");

-- CreateIndex
CREATE INDEX "shipping_zones_isActive_sortOrder_idx" ON "public"."shipping_zones"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "shipping_zones_code_idx" ON "public"."shipping_zones"("code");

-- CreateIndex
CREATE INDEX "shipping_rule_sets_isActive_isDefault_idx" ON "public"."shipping_rule_sets"("isActive", "isDefault");

-- CreateIndex
CREATE INDEX "shipping_rule_sets_validFrom_validTo_idx" ON "public"."shipping_rule_sets"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "shipping_rule_sets_priority_idx" ON "public"."shipping_rule_sets"("priority");

-- CreateIndex
CREATE INDEX "shipping_rules_zoneId_weightMin_weightMax_idx" ON "public"."shipping_rules"("zoneId", "weightMin", "weightMax");

-- CreateIndex
CREATE INDEX "shipping_rules_ruleSetId_isActive_effectiveFrom_effectiveTo_idx" ON "public"."shipping_rules"("ruleSetId", "isActive", "effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "shipping_rules_zoneId_ruleSetId_weightMin_weightMax_isActiv_idx" ON "public"."shipping_rules"("zoneId", "ruleSetId", "weightMin", "weightMax", "isActive");

-- CreateIndex
CREATE INDEX "shipping_rules_serviceType_idx" ON "public"."shipping_rules"("serviceType");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_rules_zoneId_ruleSetId_weightMin_weightMax_service_key" ON "public"."shipping_rules"("zoneId", "ruleSetId", "weightMin", "weightMax", "serviceType");

-- CreateIndex
CREATE INDEX "shipping_rule_history_ruleId_createdAt_idx" ON "public"."shipping_rule_history"("ruleId", "createdAt");

-- CreateIndex
CREATE INDEX "shipping_rule_history_userId_createdAt_idx" ON "public"."shipping_rule_history"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "shipping_rule_history_operation_createdAt_idx" ON "public"."shipping_rule_history"("operation", "createdAt");

-- CreateIndex
CREATE INDEX "shipping_rule_history_zoneId_createdAt_idx" ON "public"."shipping_rule_history"("zoneId", "createdAt");

-- CreateIndex
CREATE INDEX "shipping_calculations_zoneId_createdAt_idx" ON "public"."shipping_calculations"("zoneId", "createdAt");

-- CreateIndex
CREATE INDEX "shipping_calculations_basePrice_finalPrice_createdAt_idx" ON "public"."shipping_calculations"("basePrice", "finalPrice", "createdAt");

-- CreateIndex
CREATE INDEX "shipping_calculations_orderId_idx" ON "public"."shipping_calculations"("orderId");

-- CreateIndex
CREATE INDEX "shipping_calculations_userType_createdAt_idx" ON "public"."shipping_calculations"("userType", "createdAt");

-- CreateIndex
CREATE INDEX "shipping_calculations_freeShippingApplied_createdAt_idx" ON "public"."shipping_calculations"("freeShippingApplied", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipment_tracking" ADD CONSTRAINT "shipment_tracking_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "public"."shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_zones" ADD CONSTRAINT "shipping_zones_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_zones" ADD CONSTRAINT "shipping_zones_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_rule_sets" ADD CONSTRAINT "shipping_rule_sets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_rules" ADD CONSTRAINT "shipping_rules_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."shipping_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_rules" ADD CONSTRAINT "shipping_rules_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "public"."shipping_rule_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_rules" ADD CONSTRAINT "shipping_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_rules" ADD CONSTRAINT "shipping_rules_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_rule_history" ADD CONSTRAINT "shipping_rule_history_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."shipping_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_rule_history" ADD CONSTRAINT "shipping_rule_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_calculations" ADD CONSTRAINT "shipping_calculations_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."shipping_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_calculations" ADD CONSTRAINT "shipping_calculations_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."shipping_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_calculations" ADD CONSTRAINT "shipping_calculations_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "public"."shipping_rule_sets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_calculations" ADD CONSTRAINT "shipping_calculations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipping_calculations" ADD CONSTRAINT "shipping_calculations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
