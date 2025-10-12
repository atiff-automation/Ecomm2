import { prisma } from '../src/lib/prisma';

async function getOrderIdByNumber() {
  const orderNumber = process.argv[2] || 'ORD-20251012-NJCX';

  console.log(`Looking for order: ${orderNumber}`);

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
    },
  });

  if (!order) {
    console.log(`❌ Order ${orderNumber} not found`);
    process.exit(1);
  }

  console.log('\n✅ Order found:');
  console.log(`ID: ${order.id}`);
  console.log(`Order Number: ${order.orderNumber}`);
  console.log(`Status: ${order.status}`);
  console.log(`Created: ${order.createdAt}`);
  console.log(`\nUse this order ID for testing: ${order.id}`);

  await prisma.$disconnect();
}

getOrderIdByNumber();
