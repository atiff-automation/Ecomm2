-- CreateEnum
CREATE TYPE "public"."SettingType" AS ENUM ('API_CONFIG', 'CSV_CONFIG', 'DECISION_RULES', 'COST_LIMITS', 'ALERT_SETTINGS');

-- CreateEnum
CREATE TYPE "public"."DecisionMethod" AS ENUM ('API', 'CSV', 'HYBRID');

-- CreateTable
CREATE TABLE "public"."fulfillment_settings" (
    "id" TEXT NOT NULL,
    "settingName" TEXT NOT NULL,
    "settingValue" JSONB NOT NULL,
    "settingType" "public"."SettingType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "fulfillment_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fulfillment_decisions" (
    "id" TEXT NOT NULL,
    "orderIds" TEXT[],
    "decisionMethod" "public"."DecisionMethod" NOT NULL,
    "decisionReason" VARCHAR(100) NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "totalValue" DECIMAL(10,2) NOT NULL,
    "priorityDistribution" JSONB,
    "apiHealthStatus" VARCHAR(20),
    "currentApiBudgetUsage" DECIMAL(5,2),
    "processingStartedAt" TIMESTAMP(3),
    "processingCompletedAt" TIMESTAMP(3),
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "totalProcessingTimeMs" INTEGER,
    "averageProcessingTimeMs" INTEGER,
    "costEstimate" DECIMAL(8,2),
    "actualCost" DECIMAL(8,2),
    "decisionData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fulfillment_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_cost_tracking" (
    "id" TEXT NOT NULL,
    "apiProvider" VARCHAR(50) NOT NULL,
    "operationType" VARCHAR(50) NOT NULL,
    "endpoint" VARCHAR(200),
    "httpMethod" VARCHAR(10),
    "requestSizeBytes" INTEGER,
    "responseSizeBytes" INTEGER,
    "responseTimeMs" INTEGER NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "costAmount" DECIMAL(8,4) NOT NULL,
    "costCurrency" CHAR(3) NOT NULL DEFAULT 'MYR',
    "billingUnit" VARCHAR(20),
    "orderId" TEXT,
    "sessionId" VARCHAR(255),
    "requestData" JSONB,
    "responseSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "api_cost_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fulfillment_settings_settingName_key" ON "public"."fulfillment_settings"("settingName");

-- CreateIndex
CREATE INDEX "fulfillment_settings_settingType_isActive_idx" ON "public"."fulfillment_settings"("settingType", "isActive");

-- CreateIndex
CREATE INDEX "fulfillment_settings_effectiveFrom_effectiveTo_idx" ON "public"."fulfillment_settings"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE INDEX "fulfillment_decisions_decisionMethod_createdAt_idx" ON "public"."fulfillment_decisions"("decisionMethod", "createdAt");

-- CreateIndex
CREATE INDEX "fulfillment_decisions_decisionReason_createdAt_idx" ON "public"."fulfillment_decisions"("decisionReason", "createdAt");

-- CreateIndex
CREATE INDEX "fulfillment_decisions_totalProcessingTimeMs_orderCount_idx" ON "public"."fulfillment_decisions"("totalProcessingTimeMs", "orderCount");

-- CreateIndex
CREATE INDEX "fulfillment_decisions_costEstimate_actualCost_createdAt_idx" ON "public"."fulfillment_decisions"("costEstimate", "actualCost", "createdAt");

-- CreateIndex
CREATE INDEX "api_cost_tracking_apiProvider_createdAt_idx" ON "public"."api_cost_tracking"("apiProvider", "createdAt");

-- CreateIndex
CREATE INDEX "api_cost_tracking_operationType_costAmount_createdAt_idx" ON "public"."api_cost_tracking"("operationType", "costAmount", "createdAt");

-- CreateIndex
CREATE INDEX "api_cost_tracking_responseTimeMs_success_createdAt_idx" ON "public"."api_cost_tracking"("responseTimeMs", "success", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."fulfillment_settings" ADD CONSTRAINT "fulfillment_settings_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."fulfillment_settings" ADD CONSTRAINT "fulfillment_settings_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_cost_tracking" ADD CONSTRAINT "api_cost_tracking_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_cost_tracking" ADD CONSTRAINT "api_cost_tracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
