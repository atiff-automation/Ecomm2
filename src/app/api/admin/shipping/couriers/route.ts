/**
 * Admin Courier Preferences API
 * Manages courier preferences and priorities for admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { businessShippingConfig } from '@/lib/config/business-shipping-config';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const courierPreferenceSchema = z.object({
  courierId: z.string().min(1),
  courierName: z.string().min(1),
  priority: z.number().min(1),
  enabled: z.boolean(),
  serviceTypes: z.array(z.enum(['STANDARD', 'EXPRESS', 'OVERNIGHT'])),
  maxWeight: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const courierPreferencesSchema = z.object({
  preferences: z.array(courierPreferenceSchema),
});

/**
 * GET - Retrieve courier preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await businessShippingConfig.getCourierPreferences();

    return NextResponse.json({
      success: true,
      preferences,
    });

  } catch (error) {
    console.error('Error retrieving courier preferences:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve courier preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST - Update courier preferences
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate preferences data
    const validatedData = courierPreferencesSchema.parse(body);

    // Update courier preferences
    await businessShippingConfig.updateCourierPreferences(validatedData.preferences);

    return NextResponse.json({
      success: true,
      message: 'Courier preferences updated successfully',
    });

  } catch (error) {
    console.error('Error updating courier preferences:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update courier preferences' },
      { status: 500 }
    );
  }
}