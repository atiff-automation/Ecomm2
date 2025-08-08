-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "earlyAccessStart" TIMESTAMP(3),
ADD COLUMN     "memberOnlyUntil" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "products_memberOnlyUntil_idx" ON "public"."products"("memberOnlyUntil");

-- CreateIndex
CREATE INDEX "products_earlyAccessStart_idx" ON "public"."products"("earlyAccessStart");
