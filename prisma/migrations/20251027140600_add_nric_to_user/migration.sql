-- Add NRIC field to User table for Malaysia NRIC membership system
-- NRIC serves as permanent Member ID

-- Add NRIC column (nullable to allow existing users)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nric" VARCHAR(12);

-- Add unique constraint (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_nric_key'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_nric_key" UNIQUE ("nric");
    END IF;
END $$;

-- Add index for faster lookups (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'users_nric_idx'
    ) THEN
        CREATE INDEX "users_nric_idx" ON "users"("nric") WHERE "nric" IS NOT NULL;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN "users"."nric" IS 'Malaysia National Registration Identity Card number (12 digits) - serves as Member ID. Format: 12 digits only, no dashes or symbols.';
