const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true
      }
    });

    console.log('=== Admin Users ===');
    console.log(JSON.stringify(admins, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdminUsers();
