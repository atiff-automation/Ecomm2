-- Drop foreign key constraints first
ALTER TABLE "product_categories" DROP CONSTRAINT IF EXISTS "product_categories_productId_fkey";
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_productId_fkey";
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_productId_fkey";
ALTER TABLE "recently_viewed" DROP CONSTRAINT IF EXISTS "recently_viewed_productId_fkey";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_productId_fkey";

-- Drop tables that depend on foreign keys from Product and User
DROP TABLE IF EXISTS "wishlist_items" CASCADE;
DROP TABLE IF EXISTS "member_referral" CASCADE;
DROP TABLE IF EXISTS "referral_reward" CASCADE;
DROP TABLE IF EXISTS "referral_settings" CASCADE;

-- Remove removed enum values if they exist
-- (Note: PostgreSQL doesn't allow removing enum values, so we leave them)

-- Recreate foreign key constraints (they should still exist, this is a safety check)
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
