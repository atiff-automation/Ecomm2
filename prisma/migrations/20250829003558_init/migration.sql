/*
  Warnings:

  - You are about to drop the `site_themes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."site_themes" DROP CONSTRAINT "site_themes_createdBy_fkey";

-- DropTable
DROP TABLE "public"."site_themes";
