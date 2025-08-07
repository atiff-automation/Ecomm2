/**
 * User Notification Preferences API
 * Manages customer notification settings and preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { notificationService } from '@/lib/notifications/notification-service';
import { z } from 'zod';

const notificationSettingsSchema = z.object({
  orderUpdates: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
  }),
  marketing: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
    frequency: z.enum(['IMMEDIATE', 'DAILY', 'WEEKLY', 'MONTHLY']),
  }),
  stockAlerts: z.object({
    email: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
  }),
  memberBenefits: z.object({
    email: z.boolean(),
    push: z.boolean(),
    inApp: z.boolean(),
  }),
  newsletter: z.object({
    email: z.boolean(),
    frequency: z.enum(['WEEKLY', 'MONTHLY']),
  }),
});

// GET - Get user's notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const preferences =
      await notificationService.getUserNotificationPreferences(session.user.id);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user's notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = notificationSettingsSchema.parse(body);

    const success = await notificationService.updateUserNotificationPreferences(
      session.user.id,
      validatedData
    );

    if (!success) {
      return NextResponse.json(
        { message: 'Failed to update notification preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Invalid data provided',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Initialize default notification preferences for user
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const success =
      await notificationService.initializeUserNotificationPreferences(
        session.user.id
      );

    if (!success) {
      return NextResponse.json(
        { message: 'Failed to initialize notification preferences' },
        { status: 500 }
      );
    }

    const preferences =
      await notificationService.getUserNotificationPreferences(session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Default notification preferences initialized',
      preferences,
    });
  } catch (error) {
    console.error('Error initializing notification preferences:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
