-- Manual FAQ CMS Schema Migration
-- Run this to create FAQ tables and enums

-- Create FAQCategory enum if not exists
DO $$ BEGIN
    CREATE TYPE "FAQCategory" AS ENUM ('ABOUT_US', 'PRODUCTS', 'SHIPPING', 'PAYMENT', 'MEMBERSHIP', 'SAFETY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create FAQStatus enum if not exists
DO $$ BEGIN
    CREATE TYPE "FAQStatus" AS ENUM ('ACTIVE', 'INACTIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create faqs table if not exists
CREATE TABLE IF NOT EXISTS "faqs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question" VARCHAR(500) NOT NULL,
    "answer" TEXT NOT NULL,
    "category" "FAQCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "FAQStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "faqs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "faqs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes if not exists
CREATE INDEX IF NOT EXISTS "faqs_category_idx" ON "faqs"("category");
CREATE INDEX IF NOT EXISTS "faqs_status_idx" ON "faqs"("status");
CREATE INDEX IF NOT EXISTS "faqs_sortOrder_idx" ON "faqs"("sortOrder");
CREATE INDEX IF NOT EXISTS "faqs_createdAt_idx" ON "faqs"("createdAt");

-- Verify table was created
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'faqs'
);
