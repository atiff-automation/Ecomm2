const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTemplates() {
  try {
    const templates = await prisma.receiptTemplate.findMany({
      select: {
        id: true,
        name: true,
        templateType: true,
        isDefault: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('📋 Current Template States:');
    console.log('============================');
    
    templates.forEach(template => {
      console.log(`${template.templateType}:`);
      console.log(`  - ID: ${template.id}`);
      console.log(`  - Name: ${template.name}`);
      console.log(`  - Is Default: ${template.isDefault}`);
      console.log(`  - Is Active: ${template.isActive}`);
      console.log(`  - Created: ${template.createdAt.toISOString().split('T')[0]}`);
      console.log('');
    });

    const defaultCount = templates.filter(t => t.isDefault).length;
    console.log(`🔍 Templates marked as default: ${defaultCount}`);
    
    if (defaultCount > 1) {
      console.log('❌ ERROR: Multiple templates are marked as default!');
      console.log('🔧 This needs to be fixed - only one template should be default.');
    } else if (defaultCount === 1) {
      const defaultTemplate = templates.find(t => t.isDefault);
      console.log(`✅ Correct: Only one default template (${defaultTemplate.templateType})`);
    } else {
      console.log('⚠️  WARNING: No default template found!');
    }

  } catch (error) {
    console.error('Error checking templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();