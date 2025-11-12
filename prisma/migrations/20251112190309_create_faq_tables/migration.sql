-- Migration: Create FAQ Tables from Scratch
-- This creates both faq_categories and faqs tables for a brand new FAQ system

-- Step 1: Create the FAQStatus enum
CREATE TYPE "FAQStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- Step 2: Create the faq_categories table
CREATE TABLE "faq_categories" (
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

-- Step 3: Create indexes for faq_categories
CREATE UNIQUE INDEX "faq_categories_nameEnglish_key" ON "faq_categories"("nameEnglish");
CREATE INDEX "faq_categories_nameEnglish_idx" ON "faq_categories"("nameEnglish");
CREATE INDEX "faq_categories_sortOrder_idx" ON "faq_categories"("sortOrder");
CREATE INDEX "faq_categories_isActive_idx" ON "faq_categories"("isActive");

-- Step 4: Create the faqs table
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "question" VARCHAR(500) NOT NULL,
    "answer" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "FAQStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create indexes for faqs
CREATE INDEX "faqs_categoryId_idx" ON "faqs"("categoryId");
CREATE INDEX "faqs_status_idx" ON "faqs"("status");
CREATE INDEX "faqs_sortOrder_idx" ON "faqs"("sortOrder");
CREATE INDEX "faqs_createdAt_idx" ON "faqs"("createdAt");

-- Step 6: Add foreign key constraints
ALTER TABLE "faq_categories"
ADD CONSTRAINT "faq_categories_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "faq_categories"
ADD CONSTRAINT "faq_categories_updatedBy_fkey"
FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "faqs"
ADD CONSTRAINT "faqs_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "faq_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "faqs"
ADD CONSTRAINT "faqs_createdBy_fkey"
FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "faqs"
ADD CONSTRAINT "faqs_updatedBy_fkey"
FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 7: Insert the 6 default categories with predefined IDs
INSERT INTO "faq_categories" ("id", "nameEnglish", "nameMalay", "description", "icon", "sortOrder", "updatedAt")
VALUES
    ('faqcat_about_us_001', 'About Us', 'Tentang Kami', 'Questions about company and brand', 'Info', 0, CURRENT_TIMESTAMP),
    ('faqcat_products_002', 'Products', 'Produk', 'Questions about products', 'Package', 1, CURRENT_TIMESTAMP),
    ('faqcat_shipping_003', 'Shipping', 'Penghantaran', 'Questions about shipping and delivery', 'Truck', 2, CURRENT_TIMESTAMP),
    ('faqcat_payment_004', 'Payment', 'Pembayaran', 'Questions about payment methods', 'CreditCard', 3, CURRENT_TIMESTAMP),
    ('faqcat_membership_005', 'Membership', 'Keahlian', 'Questions about membership program', 'Users', 4, CURRENT_TIMESTAMP),
    ('faqcat_safety_006', 'Safety', 'Keselamatan', 'Questions about product safety', 'Shield', 5, CURRENT_TIMESTAMP)
ON CONFLICT ("nameEnglish") DO NOTHING;
