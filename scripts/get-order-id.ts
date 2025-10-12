import { prisma } from '../src/lib/prisma';

async function getOrderId() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
    },
  });

  console.log('Recent Orders:');
  orders.forEach((order) => {
    console.log(`${order.id} | ${order.orderNumber} | ${order.status}`);
  });

  if (orders.length > 0) {
    console.log(`\nUse this order ID for testing: ${orders[0].id}`);
  }

  await prisma.$disconnect();
}

getOrderId();
