-- DropForeignKey
ALTER TABLE "public"."admin_telegram_config" DROP CONSTRAINT "admin_telegram_config_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."admin_telegram_config" DROP CONSTRAINT "admin_telegram_config_updatedBy_fkey";

-- AlterTable
ALTER TABLE "public"."admin_telegram_config" ALTER COLUMN "createdBy" DROP NOT NULL,
ALTER COLUMN "updatedBy" DROP NOT NULL;
