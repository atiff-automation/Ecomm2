const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    // New password: Admin123!
    const newPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const admin = await prisma.user.update({
      where: {
        email: 'admin@jrm.com'
      },
      data: {
        password: hashedPassword
      }
    });

    console.log('✅ Admin password reset successfully!');
    console.log('');
    console.log('=== LOGIN CREDENTIALS ===');
    console.log('Email: admin@jrm.com');
    console.log('Password: Admin123!');
    console.log('========================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
