/**
 * Database Seeding Script
 * Creates test users, products, and basic data for testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Seeding users...');

  // Use production-ready admin password or environment variable
  const adminPassword = process.env.ADMIN_PASSWORD || 'ParitRaja9396#$%';
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Hash password for test users (keep simple for testing)
  const testPassword = await bcrypt.hash('password123', 12);

  console.log('📧 Admin credentials will be:');
  console.log('  Super Admin: superadmin@jrm.com');
  console.log('  Admin: admin@jrm.com');
  console.log(`  Password: ${adminPassword}`);
  console.log('  Test users password: password123');

  // Create Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@jrm.com' },
    update: {},
    create: {
      email: 'superadmin@jrm.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      phone: '+60123456789',
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      isMember: true,
      memberSince: new Date(),
      membershipTotal: 5000.00,
    },
  });

  // Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@jrm.com' },
    update: {},
    create: {
      email: 'admin@jrm.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+60123456790',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      isMember: false,
    },
  });

  // Create Staff
  await prisma.user.upsert({
    where: { email: 'staff@jrm.com' },
    update: {},
    create: {
      email: 'staff@jrm.com',
      password: testPassword,
      firstName: 'Staff',
      lastName: 'Member',
      phone: '+60123456791',
      role: 'STAFF',
      status: 'ACTIVE',
      emailVerified: new Date(),
      isMember: false,
    },
  });

  // Create Premium Member Customer
  await prisma.user.upsert({
    where: { email: 'member@test.com' },
    update: {},
    create: {
      email: 'member@test.com',
      password: testPassword,
      firstName: 'John',
      lastName: 'Member',
      phone: '+60123456792',
      dateOfBirth: new Date('1990-01-15'),
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      isMember: true,
      memberSince: new Date('2023-01-01'),
      membershipTotal: 2500.50,
    },
  });

  // Create Regular Customer
  await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      password: testPassword,
      firstName: 'Jane',
      lastName: 'Customer',
      phone: '+60123456793',
      dateOfBirth: new Date('1985-05-20'),
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: new Date(),
      isMember: false,
    },
  });

  // Create Test Customer with Pending Status
  await prisma.user.upsert({
    where: { email: 'pending@test.com' },
    update: {},
    create: {
      email: 'pending@test.com',
      password: testPassword,
      firstName: 'Pending',
      lastName: 'User',
      phone: '+60123456794',
      role: 'CUSTOMER',
      status: 'PENDING_VERIFICATION',
      isMember: false,
    },
  });

  console.log('✅ Users seeded successfully');
}

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  // Main categories
  const electronicsCategory = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
    },
  });

  const fashionCategory = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Clothing, shoes, and accessories',
    },
  });

  const homeCategory = await prisma.category.upsert({
    where: { slug: 'home-living' },
    update: {},
    create: {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Home decor, furniture, and living essentials',
    },
  });

  // Sub-categories
  await prisma.category.upsert({
    where: { slug: 'smartphones' },
    update: {},
    create: {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and accessories',
      parentId: electronicsCategory.id,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'laptops' },
    update: {},
    create: {
      name: 'Laptops',
      slug: 'laptops',
      description: 'Laptops and computers',
      parentId: electronicsCategory.id,
    },
  });

  console.log('✅ Categories seeded successfully');
}

async function seedProducts() {
  console.log('🌱 Seeding products...');

  const electronicsCategory = await prisma.category.findUnique({
    where: { slug: 'electronics' },
  });

  const smartphoneCategory = await prisma.category.findUnique({
    where: { slug: 'smartphones' },
  });

  if (electronicsCategory && smartphoneCategory) {
    // Sample products
    await prisma.product.upsert({
      where: { sku: 'PHONE-001' },
      update: {},
      create: {
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        description: 'Latest iPhone with advanced features',
        shortDescription: 'Premium smartphone with Pro camera system',
        sku: 'PHONE-001',
        regularPrice: 4999.00,
        memberPrice: 4499.00,
        stockQuantity: 50,
        weight: 0.2,
        dimensions: '15.0 x 7.1 x 0.8 cm',
        status: 'ACTIVE',
        featured: true,
        categoryId: smartphoneCategory.id,
      },
    });

    await prisma.product.upsert({
      where: { sku: 'PHONE-002' },
      update: {},
      create: {
        name: 'Samsung Galaxy S24',
        slug: 'samsung-galaxy-s24',
        description: 'Flagship Samsung smartphone',
        shortDescription: 'Powerful Android smartphone',
        sku: 'PHONE-002',
        regularPrice: 3999.00,
        memberPrice: 3599.00,
        stockQuantity: 30,
        weight: 0.18,
        dimensions: '14.7 x 7.0 x 0.79 cm',
        status: 'ACTIVE',
        featured: true,
        categoryId: smartphoneCategory.id,
      },
    });

    await prisma.product.upsert({
      where: { sku: 'LAPTOP-001' },
      update: {},
      create: {
        name: 'MacBook Pro 14"',
        slug: 'macbook-pro-14',
        description: 'Professional laptop for creators',
        shortDescription: 'High-performance laptop',
        sku: 'LAPTOP-001',
        regularPrice: 8999.00,
        memberPrice: 8099.00,
        stockQuantity: 15,
        weight: 1.6,
        dimensions: '31.26 x 22.12 x 1.55 cm',
        status: 'ACTIVE',
        featured: true,
        categoryId: electronicsCategory.id,
      },
    });
  }

  console.log('✅ Products seeded successfully');
}

async function seedAddresses() {
  console.log('🌱 Seeding addresses...');

  const member = await prisma.user.findUnique({
    where: { email: 'member@test.com' },
  });

  const customer = await prisma.user.findUnique({
    where: { email: 'customer@test.com' },
  });

  if (member) {
    await prisma.address.create({
      data: {
        userId: member.id,
        type: 'HOME',
        firstName: 'John',
        lastName: 'Member',
        addressLine1: 'No. 123, Jalan Bukit Bintang',
        addressLine2: 'Pavilion Residences',
        city: 'Kuala Lumpur',
        state: 'KUL',
        postalCode: '55100',
        country: 'Malaysia',
        phone: '+60123456792',
        isDefault: true,
      },
    });
  }

  if (customer) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        type: 'HOME',
        firstName: 'Jane',
        lastName: 'Customer',
        addressLine1: 'No. 456, Jalan Damansara',
        city: 'Petaling Jaya',
        state: 'SEL',
        postalCode: '47400',
        country: 'Malaysia',
        phone: '+60123456793',
        isDefault: true,
      },
    });
  }

  console.log('✅ Addresses seeded successfully');
}

async function main() {
  console.log('🚀 Starting database seeding...');
  
  await seedUsers();
  await seedCategories();
  await seedProducts();
  await seedAddresses();
  
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });