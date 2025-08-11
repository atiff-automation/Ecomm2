/*
  Warnings:

  - You are about to drop the column `categoryId` on the `products` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropIndex
DROP INDEX "public"."products_categoryId_idx";

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "categoryId";

-- CreateTable
CREATE TABLE "public"."product_categories" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."site_themes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#FDE047',
    "backgroundColor" TEXT NOT NULL DEFAULT '#F8FAFC',
    "textColor" TEXT NOT NULL DEFAULT '#1E293B',
    "logoUrl" TEXT,
    "logoWidth" INTEGER DEFAULT 120,
    "logoHeight" INTEGER DEFAULT 40,
    "faviconUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "site_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hero_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Welcome to JRM E-commerce',
    "subtitle" TEXT NOT NULL DEFAULT 'Malaysia''s premier online marketplace',
    "description" TEXT NOT NULL DEFAULT 'Intelligent membership benefits, dual pricing, and local payment integration.',
    "ctaPrimaryText" TEXT NOT NULL DEFAULT 'Join as Member',
    "ctaPrimaryLink" TEXT NOT NULL DEFAULT '/auth/signup',
    "ctaSecondaryText" TEXT NOT NULL DEFAULT 'Browse Products',
    "ctaSecondaryLink" TEXT NOT NULL DEFAULT '/products',
    "backgroundType" "public"."MediaType" NOT NULL DEFAULT 'IMAGE',
    "backgroundImage" TEXT,
    "backgroundVideo" TEXT,
    "overlayOpacity" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "textAlignment" TEXT NOT NULL DEFAULT 'left',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "hero_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_uploads" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "mediaType" "public"."MediaType" NOT NULL,
    "usage" TEXT,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_categories_productId_idx" ON "public"."product_categories"("productId");

-- CreateIndex
CREATE INDEX "product_categories_categoryId_idx" ON "public"."product_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_productId_categoryId_key" ON "public"."product_categories"("productId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "site_themes_name_key" ON "public"."site_themes"("name");

-- AddForeignKey
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."site_themes" ADD CONSTRAINT "site_themes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hero_sections" ADD CONSTRAINT "hero_sections_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_uploads" ADD CONSTRAINT "media_uploads_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
