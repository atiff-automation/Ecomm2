-- Migration: Convert FAQ Categories from ENUM to Dynamic Table
-- This migration preserves existing FAQ data

-- Step 1: Create the new faq_categories table
CREATE TABLE IF NOT EXISTS "faq_categories" (
    "id" TEXT NOT NULL,
    "nameEnglish" TEXT NOT NULL,
    "nameMalay" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes for faq_categories
CREATE UNIQUE INDEX IF NOT EXISTS "faq_categories_nameEnglish_key" ON "faq_categories"("nameEnglish");
CREATE INDEX IF NOT EXISTS "faq_categories_nameEnglish_idx" ON "faq_categories"("nameEnglish");
CREATE INDEX IF NOT EXISTS "faq_categories_sortOrder_idx" ON "faq_categories"("sortOrder");
CREATE INDEX IF NOT EXISTS "faq_categories_isActive_idx" ON "faq_categories"("isActive");

-- Step 3: Insert the 6 existing categories with predefined IDs
INSERT INTO "faq_categories" ("id", "nameEnglish", "nameMalay", "description", "icon", "sortOrder", "updatedAt")
VALUES
    ('faqcat_about_us_001', 'About Us', 'Tentang Kami', 'Questions about company and brand', 'Info', 0, CURRENT_TIMESTAMP),
    ('faqcat_products_002', 'Products', 'Produk', 'Questions about products', 'Package', 1, CURRENT_TIMESTAMP),
    ('faqcat_shipping_003', 'Shipping', 'Penghantaran', 'Questions about shipping and delivery', 'Truck', 2, CURRENT_TIMESTAMP),
    ('faqcat_payment_004', 'Payment', 'Pembayaran', 'Questions about payment methods', 'CreditCard', 3, CURRENT_TIMESTAMP),
    ('faqcat_membership_005', 'Membership', 'Keahlian', 'Questions about membership program', 'Users', 4, CURRENT_TIMESTAMP),
    ('faqcat_safety_006', 'Safety', 'Keselamatan', 'Questions about product safety', 'Shield', 5, CURRENT_TIMESTAMP)
ON CONFLICT ("nameEnglish") DO NOTHING;

-- Step 4: Add categoryId column to faqs table (nullable first)
ALTER TABLE "faqs" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;

-- Step 5: Migrate existing FAQ data from enum to categoryId
UPDATE "faqs"
SET "categoryId" = CASE
    WHEN "category"::TEXT = 'ABOUT_US' THEN 'faqcat_about_us_001'
    WHEN "category"::TEXT = 'PRODUCTS' THEN 'faqcat_products_002'
    WHEN "category"::TEXT = 'SHIPPING' THEN 'faqcat_shipping_003'
    WHEN "category"::TEXT = 'PAYMENT' THEN 'faqcat_payment_004'
    WHEN "category"::TEXT = 'MEMBERSHIP' THEN 'faqcat_membership_005'
    WHEN "category"::TEXT = 'SAFETY' THEN 'faqcat_safety_006'
    ELSE NULL
END
WHERE "categoryId" IS NULL;

-- Step 6: Make categoryId required and add foreign key
ALTER TABLE "faqs" ALTER COLUMN "categoryId" SET NOT NULL;

-- Step 7: Add foreign key constraint
ALTER TABLE "faqs"
ADD CONSTRAINT "faqs_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "faq_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Create index on categoryId
CREATE INDEX IF NOT EXISTS "faqs_categoryId_idx" ON "faqs"("categoryId");

-- Step 9: Drop the old category enum column
ALTER TABLE "faqs" DROP COLUMN IF EXISTS "category";

-- Step 10: Drop the FAQCategory enum type
DROP TYPE IF EXISTS "FAQCategory";

-- Step 11: Add foreign keys for audit relations
ALTER TABLE "faq_categories"
ADD CONSTRAINT "faq_categories_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "faq_categories"
ADD CONSTRAINT "faq_categories_updatedBy_fkey"
FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
