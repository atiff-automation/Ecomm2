import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/settings/dashboard - Get settings dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and superadmins can access settings dashboard
    if (!['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get business profile status
    const businessProfile = await prisma.businessProfile.findFirst();
    const businessProfileCompleteness = calculateBusinessProfileCompleteness(businessProfile);

    // Get tax configuration status
    const taxConfigurations = await prisma.taxConfiguration.findMany({
      where: { isActive: true }
    });
    const hasTaxConfig = taxConfigurations.length > 0;
    const hasGST = taxConfigurations.some(config => config.taxType === 'GST' && config.isActive);

    // Get recent changes from audit log
    const recentChanges = await prisma.auditLog.findMany({
      where: {
        category: {
          in: ['BUSINESS_SETTINGS', 'TAX_CONFIGURATION', 'USER_SETTINGS']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Check integrations (simplified version - you can expand this)
    // For now, we'll check if certain configurations exist
    const telegramConfig = await checkTelegramIntegration();
    const paymentConfig = await checkPaymentIntegration();
    const shippingConfig = await checkShippingIntegration();

    const dashboard = {
      businessProfile: {
        configured: !!businessProfile,
        lastUpdated: businessProfile?.updatedAt,
        completeness: businessProfileCompleteness
      },
      taxConfiguration: {
        configured: hasTaxConfig,
        gstEnabled: hasGST,
        lastUpdated: taxConfigurations[0]?.updatedAt
      },
      integrations: {
        telegram: telegramConfig,
        payment: paymentConfig,
        shipping: shippingConfig
      },
      recentChanges: recentChanges.map(log => ({
        section: formatSection(log.category),
        action: log.action,
        changedBy: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        timestamp: log.createdAt,
        description: log.details?.description || `${log.action} in ${formatSection(log.category)}`
      }))
    };

    return NextResponse.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate business profile completeness percentage
 */
function calculateBusinessProfileCompleteness(profile: any): number {
  if (!profile) return 0;
  
  const requiredFields = [
    'legalName',
    'tradingName', 
    'registrationNumber',
    'primaryEmail',
    'primaryPhone',
    'website'
  ];

  const addressFields = [
    'registeredAddress',
    'businessAddress'
  ];

  let completedFields = 0;
  const totalFields = requiredFields.length + addressFields.length;

  // Check basic fields
  requiredFields.forEach(field => {
    if (profile[field] && profile[field].trim() !== '') {
      completedFields++;
    }
  });

  // Check address fields
  if (profile.registeredAddress && Object.keys(profile.registeredAddress).length > 0) {
    completedFields++;
  }
  if (profile.businessAddress && Object.keys(profile.businessAddress).length > 0) {
    completedFields++;
  }

  return Math.round((completedFields / totalFields) * 100);
}

/**
 * Check if Telegram integration is configured
 */
async function checkTelegramIntegration(): Promise<boolean> {
  try {
    // Check if there are active Telegram configurations
    const adminTelegramConfig = await prisma.adminTelegramConfig.findFirst({
      where: { isActive: true }
    });
    return !!adminTelegramConfig && !!adminTelegramConfig.botToken;
  } catch (error) {
    console.error('Error checking Telegram integration:', error);
    return false;
  }
}

/**
 * Check if payment integration is configured
 */
async function checkPaymentIntegration(): Promise<boolean> {
  try {
    // This is a simplified check - you might have a different way to check payment configuration
    // For now, we'll assume it's configured if there are active orders with payments
    const recentPayments = await prisma.order.count({
      where: {
        paymentStatus: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });
    return recentPayments > 0;
  } catch (error) {
    console.error('Error checking payment integration:', error);
    return false;
  }
}

/**
 * Check if shipping integration is configured
 */
async function checkShippingIntegration(): Promise<boolean> {
  try {
    // Check if there are any shipping methods configured
    const shippingMethods = await prisma.shippingMethod.count({
      where: { isActive: true }
    });
    return shippingMethods > 0;
  } catch (error) {
    console.error('Error checking shipping integration:', error);
    return false;
  }
}

/**
 * Format section name for display
 */
function formatSection(category: string): string {
  const sectionMap: Record<string, string> = {
    'BUSINESS_SETTINGS': 'Business Profile',
    'TAX_CONFIGURATION': 'Tax Configuration', 
    'USER_SETTINGS': 'User Settings',
    'SYSTEM_CONFIGURATION': 'System Configuration'
  };
  
  return sectionMap[category] || category.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}