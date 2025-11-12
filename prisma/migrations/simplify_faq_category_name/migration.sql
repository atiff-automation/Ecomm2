-- Migration: Simplify FAQ Category Name
-- Merge nameEnglish and nameMalay into single 'name' field
-- Keeps nameEnglish values (About Us, Shipping, Payment, etc.)

-- Step 1: Add new 'name' column
ALTER TABLE "faq_categories" ADD COLUMN "name" TEXT;

-- Step 2: Copy data from nameEnglish to name
UPDATE "faq_categories" SET "name" = "nameEnglish";

-- Step 3: Make 'name' NOT NULL
ALTER TABLE "faq_categories" ALTER COLUMN "name" SET NOT NULL;

-- Step 4: Drop old unique constraint on nameEnglish
ALTER TABLE "faq_categories" DROP CONSTRAINT IF EXISTS "faq_categories_nameEnglish_key";

-- Step 5: Add unique constraint on new 'name' column
ALTER TABLE "faq_categories" ADD CONSTRAINT "faq_categories_name_key" UNIQUE ("name");

-- Step 6: Drop old index on nameEnglish
DROP INDEX IF EXISTS "faq_categories_nameEnglish_idx";

-- Step 7: Create index on new 'name' column
CREATE INDEX "faq_categories_name_idx" ON "faq_categories"("name");

-- Step 8: Drop old columns
ALTER TABLE "faq_categories" DROP COLUMN "nameEnglish";
ALTER TABLE "faq_categories" DROP COLUMN "nameMalay";
