#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateProductCategories() {
  console.log('Starting product category migration...');
  
  try {
    // Get all products that have a categoryId (old single category)
    const productsWithOldCategory = await prisma.$queryRaw`
      SELECT id, "categoryId" FROM products WHERE "categoryId" IS NOT NULL;
    `;
    
    console.log(`Found ${productsWithOldCategory.length} products with existing categories`);
    
    for (const product of productsWithOldCategory) {
      console.log(`Migrating product ${product.id} with category ${product.categoryId}`);
      
      // Check if relationship already exists
      const existingRelation = await prisma.productCategory.findFirst({
        where: {
          productId: product.id,
          categoryId: product.categoryId,
        },
      });
      
      if (!existingRelation) {
        // Create the relationship
        await prisma.productCategory.create({
          data: {
            productId: product.id,
            categoryId: product.categoryId,
          },
        });
        console.log(`✅ Created relationship for product ${product.id}`);
      } else {
        console.log(`⚠️ Relationship already exists for product ${product.id}`);
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Show summary
    const totalRelations = await prisma.productCategory.count();
    console.log(`Total product-category relationships: ${totalRelations}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateProductCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });