-- Add missing columns to orders table for production Railway database
ALTER TABLE "public"."orders" 
  ADD COLUMN IF NOT EXISTS "airwayBillGenerated" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "airwayBillGeneratedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "airwayBillNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "airwayBillUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "trackingUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "courierServiceDetail" TEXT,
  ADD COLUMN IF NOT EXISTS "selectedDropoffPointId" TEXT,
  ADD COLUMN IF NOT EXISTS "scheduledPickupDate" DATE,
  ADD COLUMN IF NOT EXISTS "overriddenByAdmin" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "adminOverrideReason" TEXT,
  ADD COLUMN IF NOT EXISTS "failedBookingAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastBookingError" TEXT,
  ADD COLUMN IF NOT EXISTS "autoStatusUpdate" BOOLEAN NOT NULL DEFAULT true;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS "orders_trackingNumber_idx" ON "public"."orders"("trackingNumber");

