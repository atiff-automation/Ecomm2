-- CreateTable
CREATE TABLE "public"."admin_telegram_config" (
    "id" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "ordersChatId" TEXT NOT NULL,
    "inventoryChatId" TEXT,
    "ordersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inventoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailySummaryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_telegram_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_telegram_config_isActive_idx" ON "public"."admin_telegram_config"("isActive");

-- CreateIndex
CREATE INDEX "admin_telegram_config_ordersEnabled_idx" ON "public"."admin_telegram_config"("ordersEnabled");

-- CreateIndex
CREATE INDEX "admin_telegram_config_inventoryEnabled_idx" ON "public"."admin_telegram_config"("inventoryEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_admin_telegram_config" ON "public"."admin_telegram_config"("isActive");

-- AddForeignKey
ALTER TABLE "public"."admin_telegram_config" ADD CONSTRAINT "admin_telegram_config_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_telegram_config" ADD CONSTRAINT "admin_telegram_config_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
