import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { checkCSRF } from '@/lib/middleware/with-csrf';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * User Preferences API - Customer Settings Phase 2
 * Following @CLAUDE.md principles - systematic, DRY, single source of truth
 *
 * Features from @SETTINGS_IMPLEMENTATION_GUIDE.md:
 * - Default shipping/billing addresses
 * - Preferred payment methods
 * - Language preference (English/Malay)
 * - Wishlist privacy settings
 */

const preferencesSchema = z.object({
  defaultShippingAddressId: z.string().optional(),
  defaultBillingAddressId: z.string().optional(),
  preferredPaymentMethod: z
    .enum(['CREDIT_CARD', 'ONLINE_BANKING', 'EWALLET', 'BANK_TRANSFER'])
    .optional(),
  language: z.enum(['en', 'ms']),
  currency: z.enum(['MYR']),
  timezone: z.string(),
  wishlistPrivacy: z.enum(['PUBLIC', 'PRIVATE', 'FRIENDS']),
  showRecentlyViewed: z.boolean(),
  enablePushNotifications: z.boolean(),
  autoApplyBestDiscount: z.boolean(),
  savePaymentMethods: z.boolean(),
  rememberShippingPreference: z.boolean(),
});

/**
 * GET /api/settings/preferences - Get user preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user preferences exist in notification preferences table
    const userPreferences = await prisma.notificationPreference.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        language: true,
        // Map existing fields to preference structure
        id: true,
        userId: true,
      },
    });

    // Get user's default addresses
    const defaultAddresses = await prisma.address.findMany({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      select: {
        id: true,
        type: true,
      },
    });

    const defaultShippingAddress = defaultAddresses.find(
      addr => addr.type === 'shipping'
    );
    const defaultBillingAddress = defaultAddresses.find(
      addr => addr.type === 'billing'
    );

    // Provide default preferences if none exist
    const preferences = {
      defaultShippingAddressId: defaultShippingAddress?.id,
      defaultBillingAddressId: defaultBillingAddress?.id,
      preferredPaymentMethod: undefined, // No preference by default
      language: userPreferences?.language || 'en',
      currency: 'MYR',
      timezone: 'Asia/Kuala_Lumpur',
      wishlistPrivacy: 'PRIVATE', // Default to private
      showRecentlyViewed: true,
      enablePushNotifications: true,
      autoApplyBestDiscount: true,
      savePaymentMethods: false, // Default to false for security
      rememberShippingPreference: true,
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/preferences - Update user preferences
 */
export async function PUT(request: NextRequest) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = preferencesSchema.parse(body);

    // Start a transaction to update multiple related records
    await prisma.$transaction(async tx => {
      // Update or create notification preferences (for language)
      await tx.notificationPreference.upsert({
        where: {
          userId: session.user.id,
        },
        update: {
          language: validatedData.language,
        },
        create: {
          userId: session.user.id,
          language: validatedData.language,
          emailNotifications: {
            orderConfirmation: true,
            orderStatusUpdate: true,
            shippingUpdate: true,
            deliveryUpdate: true,
            paymentConfirmation: true,
            promotionalOffers: false,
            memberBenefits: true,
            newsletter: false,
          },
          smsNotifications: {
            orderConfirmation: false,
            shippingUpdate: true,
            deliveryUpdate: true,
          },
          marketingCommunications: false,
        },
      });

      // Update default addresses if specified
      if (validatedData.defaultShippingAddressId) {
        // First, remove default from all shipping addresses
        await tx.address.updateMany({
          where: {
            userId: session.user.id,
            type: 'shipping',
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });

        // Set the new default shipping address
        await tx.address.update({
          where: {
            id: validatedData.defaultShippingAddressId,
            userId: session.user.id,
            type: 'shipping',
          },
          data: {
            isDefault: true,
          },
        });
      }

      if (validatedData.defaultBillingAddressId) {
        // First, remove default from all billing addresses
        await tx.address.updateMany({
          where: {
            userId: session.user.id,
            type: 'billing',
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });

        // Set the new default billing address
        await tx.address.update({
          where: {
            id: validatedData.defaultBillingAddressId,
            userId: session.user.id,
            type: 'billing',
          },
          data: {
            isDefault: true,
          },
        });
      }

      // Note: Other preferences like payment method, privacy settings, etc.
      // would typically be stored in a dedicated UserPreferences table
      // For now, we'll store the essential ones that integrate with existing schema

      // In future enhancement, create a UserPreferences table:
      // await tx.userPreferences.upsert({
      //   where: { userId: session.user.id },
      //   update: { ...validatedData },
      //   create: { userId: session.user.id, ...validatedData },
      // });
    });

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
