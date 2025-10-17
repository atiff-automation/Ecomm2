-- AlterTable
ALTER TABLE "orders"
  DROP COLUMN IF EXISTS "selectedCourierId",
  DROP COLUMN IF EXISTS "deliveryInstructions",
  DROP COLUMN IF EXISTS "estimatedDeliveryDate",
  DROP COLUMN IF EXISTS "airwayBillNumber";
