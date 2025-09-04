-- CreateTable
CREATE TABLE "public"."telegram_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "botToken" TEXT,
    "botUsername" TEXT,
    "ordersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ordersChatId" TEXT,
    "inventoryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inventoryChatId" TEXT,
    "dailySummaryEnabled" BOOLEAN NOT NULL DEFAULT false,
    "summaryTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "lastHealthCheck" TIMESTAMP(3),
    "healthStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."site_themes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default Theme',
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#FDE047',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F8FAFC',
    "textColor" TEXT NOT NULL DEFAULT '#1E293B',
    "logoUrl" TEXT,
    "logoWidth" INTEGER NOT NULL DEFAULT 120,
    "logoHeight" INTEGER NOT NULL DEFAULT 40,
    "faviconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "site_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."site_customization" (
    "id" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_customization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_configs_userId_key" ON "public"."telegram_configs"("userId");

-- CreateIndex
CREATE INDEX "telegram_configs_userId_idx" ON "public"."telegram_configs"("userId");

-- CreateIndex
CREATE INDEX "telegram_configs_verified_idx" ON "public"."telegram_configs"("verified");

-- CreateIndex
CREATE INDEX "telegram_configs_healthStatus_idx" ON "public"."telegram_configs"("healthStatus");

-- CreateIndex
CREATE INDEX "site_themes_isActive_idx" ON "public"."site_themes"("isActive");

-- CreateIndex
CREATE INDEX "site_customization_isActive_idx" ON "public"."site_customization"("isActive");

-- CreateIndex
CREATE INDEX "site_customization_version_idx" ON "public"."site_customization"("version");

-- CreateIndex
CREATE INDEX "site_customization_createdAt_idx" ON "public"."site_customization"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."telegram_configs" ADD CONSTRAINT "telegram_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."site_themes" ADD CONSTRAINT "site_themes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."site_customization" ADD CONSTRAINT "site_customization_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
