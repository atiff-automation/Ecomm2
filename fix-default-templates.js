const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDefaultTemplates() {
  try {
    console.log('🔧 Fixing default template database consistency...');
    
    // First, get all templates marked as default
    const defaultTemplates = await prisma.receiptTemplate.findMany({
      where: {
        isDefault: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`Found ${defaultTemplates.length} templates marked as default:`);
    defaultTemplates.forEach(t => {
      console.log(`  - ${t.templateType} (${t.name})`);
    });

    if (defaultTemplates.length > 1) {
      // Keep the most recently created one as default
      const keepAsDefault = defaultTemplates[defaultTemplates.length - 1];
      const toUnsetDefault = defaultTemplates.slice(0, -1);
      
      console.log(`\n✅ Keeping ${keepAsDefault.templateType} as the default template`);
      console.log(`❌ Removing default status from:`);
      toUnsetDefault.forEach(t => {
        console.log(`  - ${t.templateType}`);
      });

      // Update all others to not be default
      for (const template of toUnsetDefault) {
        await prisma.receiptTemplate.update({
          where: { id: template.id },
          data: { isDefault: false }
        });
        console.log(`  ✅ Updated ${template.templateType} - removed default status`);
      }

      console.log('\n🎉 Database consistency fixed!');
    } else if (defaultTemplates.length === 1) {
      console.log('\n✅ Database is already consistent - only one default template found');
    } else {
      console.log('\n⚠️  No default templates found - setting first active template as default');
      const firstActive = await prisma.receiptTemplate.findFirst({
        where: { isActive: true }
      });
      
      if (firstActive) {
        await prisma.receiptTemplate.update({
          where: { id: firstActive.id },
          data: { isDefault: true }
        });
        console.log(`✅ Set ${firstActive.templateType} as default`);
      }
    }

    // Verify the fix
    console.log('\n📋 Final template states:');
    const allTemplates = await prisma.receiptTemplate.findMany({
      select: {
        templateType: true,
        name: true,
        isDefault: true,
        isActive: true
      },
      orderBy: {
        templateType: 'asc'
      }
    });

    allTemplates.forEach(t => {
      const status = t.isDefault ? '✅ DEFAULT' : (t.isActive ? '⚪ Active' : '❌ Inactive');
      console.log(`  ${t.templateType}: ${status}`);
    });

    const finalDefaultCount = allTemplates.filter(t => t.isDefault).length;
    console.log(`\n🔍 Total default templates: ${finalDefaultCount}`);
    
    if (finalDefaultCount === 1) {
      console.log('✅ SUCCESS: Database is now consistent!');
    } else {
      console.log('❌ ERROR: Still have consistency issues!');
    }

  } catch (error) {
    console.error('Error fixing templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDefaultTemplates();