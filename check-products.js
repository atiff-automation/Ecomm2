#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
      },
    });
    
    console.log(`Found ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.sku}) - Status: ${product.status}`);
    });
    
    // Check categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    
    console.log(`\nFound ${categories.length} categories:`);
    categories.forEach((category, index) => {
      console.log(`${index + 1}. ${category.name} (${category.id})`);
    });
    
    // Check existing product-category relationships
    const relations = await prisma.productCategory.findMany({
      include: {
        product: { select: { name: true } },
        category: { select: { name: true } },
      },
    });
    
    console.log(`\nExisting product-category relationships: ${relations.length}`);
    relations.forEach((rel, index) => {
      console.log(`${index + 1}. ${rel.product.name} -> ${rel.category.name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();