import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { notificationPreferencesSchema } from '@/lib/validation/settings';
import { AuditLogger } from '@/lib/security';

/**
 * GET /api/settings/notifications - Get notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only customers can access their notification preferences
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all notification preferences for the user
    const preferences = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id }
    });

    // Transform database format to UI format
    const formattedPreferences = {
      emailNotifications: {
        orderConfirmation: getPreferenceValue(preferences, 'ORDER_CONFIRMATION', 'emailEnabled', true),
        orderStatusUpdate: getPreferenceValue(preferences, 'ORDER_STATUS_UPDATE', 'emailEnabled', true),
        shippingUpdate: getPreferenceValue(preferences, 'SHIPPING_UPDATE', 'emailEnabled', true),
        deliveryUpdate: getPreferenceValue(preferences, 'DELIVERY_UPDATE', 'emailEnabled', true),
        paymentConfirmation: getPreferenceValue(preferences, 'PAYMENT_CONFIRMATION', 'emailEnabled', true),
        promotionalOffers: getPreferenceValue(preferences, 'PROMOTIONAL_OFFERS', 'emailEnabled', false),
        memberBenefits: getPreferenceValue(preferences, 'MEMBER_BENEFITS', 'emailEnabled', true),
        newsletter: getPreferenceValue(preferences, 'NEWSLETTER', 'emailEnabled', false)
      },
      smsNotifications: {
        orderConfirmation: getPreferenceValue(preferences, 'ORDER_CONFIRMATION', 'smsEnabled', false),
        shippingUpdate: getPreferenceValue(preferences, 'SHIPPING_UPDATE', 'smsEnabled', false),
        deliveryUpdate: getPreferenceValue(preferences, 'DELIVERY_UPDATE', 'smsEnabled', false)
      },
      marketingCommunications: getPreferenceValue(preferences, 'PROMOTIONAL_OFFERS', 'emailEnabled', false) || 
                               getPreferenceValue(preferences, 'PROMOTIONAL_OFFERS', 'smsEnabled', false),
      language: 'en' // TODO: Add language preference to user model
    };

    return NextResponse.json({
      success: true,
      data: formattedPreferences
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/notifications - Update notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only customers can update their notification preferences
    if (session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = notificationPreferencesSchema.parse(body);

    // Get current preferences for audit logging
    const currentPreferences = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id }
    });

    // Prepare notification preference updates
    const notificationTypes = [
      'ORDER_CONFIRMATION',
      'ORDER_STATUS_UPDATE', 
      'SHIPPING_UPDATE',
      'DELIVERY_UPDATE',
      'PAYMENT_CONFIRMATION',
      'PROMOTIONAL_OFFERS',
      'MEMBER_BENEFITS',
      'NEWSLETTER'
    ] as const;

    // Update each notification type
    for (const notificationType of notificationTypes) {
      const emailEnabled = getEmailEnabledValue(validatedData, notificationType);
      const smsEnabled = getSmsEnabledValue(validatedData, notificationType);

      await prisma.notificationPreference.upsert({
        where: {
          userId_notificationType: {
            userId: session.user.id,
            notificationType
          }
        },
        create: {
          userId: session.user.id,
          notificationType,
          emailEnabled,
          smsEnabled,
          pushEnabled: false, // Not implemented yet
          inAppEnabled: false, // Not implemented yet
          frequency: 'IMMEDIATE'
        },
        update: {
          emailEnabled,
          smsEnabled,
          updatedAt: new Date()
        }
      });
    }

    // Log the change for audit
    await AuditLogger.logUserSettingsChange(
      session.user.id,
      'NOTIFICATIONS',
      { currentPreferences: currentPreferences.length },
      { newPreferences: validatedData },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get preference value from database
 */
function getPreferenceValue(
  preferences: any[], 
  notificationType: string, 
  field: 'emailEnabled' | 'smsEnabled',
  defaultValue: boolean
): boolean {
  const preference = preferences.find(p => p.notificationType === notificationType);
  return preference ? preference[field] : defaultValue;
}

/**
 * Helper function to get email enabled value from form data
 */
function getEmailEnabledValue(data: any, notificationType: string): boolean {
  const mapping: Record<string, string> = {
    'ORDER_CONFIRMATION': 'orderConfirmation',
    'ORDER_STATUS_UPDATE': 'orderStatusUpdate',
    'SHIPPING_UPDATE': 'shippingUpdate',
    'DELIVERY_UPDATE': 'deliveryUpdate',
    'PAYMENT_CONFIRMATION': 'paymentConfirmation',
    'PROMOTIONAL_OFFERS': 'promotionalOffers',
    'MEMBER_BENEFITS': 'memberBenefits',
    'NEWSLETTER': 'newsletter'
  };

  const fieldName = mapping[notificationType];
  if (fieldName && data.emailNotifications) {
    return data.emailNotifications[fieldName] || false;
  }
  
  return false;
}

/**
 * Helper function to get SMS enabled value from form data
 */
function getSmsEnabledValue(data: any, notificationType: string): boolean {
  const mapping: Record<string, string> = {
    'ORDER_CONFIRMATION': 'orderConfirmation',
    'SHIPPING_UPDATE': 'shippingUpdate',
    'DELIVERY_UPDATE': 'deliveryUpdate'
  };

  const fieldName = mapping[notificationType];
  if (fieldName && data.smsNotifications) {
    return data.smsNotifications[fieldName] || false;
  }
  
  return false;
}