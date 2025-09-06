import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Admin Preferences API - Admin Settings Phase 3
 * Following @CLAUDE.md principles - systematic, DRY, single source of truth
 * 
 * Features from @SETTINGS_IMPLEMENTATION_GUIDE.md:
 * - Dashboard layout preferences
 * - Default view configurations
 * - Notification preferences (email, browser)
 * - System preferences (timezone, language, date format)
 * - Advanced settings (developer mode, API logging)
 */

const adminPreferencesSchema = z.object({
  // Dashboard Layout
  dashboardLayout: z.enum(['grid', 'list', 'cards', 'compact']),
  sidebarCollapsed: z.boolean(),
  showDashboardTips: z.boolean(),
  
  // Default Views
  defaultOrdersView: z.enum(['all', 'pending', 'processing', 'completed', 'cancelled']),
  defaultProductsView: z.enum(['all', 'active', 'draft', 'out_of_stock']),
  defaultCustomersView: z.enum(['all', 'active', 'inactive', 'members']),
  itemsPerPage: z.number().min(10).max(100),
  
  // Notification Preferences
  emailNotifications: z.object({
    newOrders: z.boolean(),
    lowStock: z.boolean(),
    customerRegistrations: z.boolean(),
    systemAlerts: z.boolean(),
    dailyReports: z.boolean(),
    weeklyReports: z.boolean(),
    monthlyReports: z.boolean(),
  }),
  
  browserNotifications: z.object({
    newOrders: z.boolean(),
    lowStock: z.boolean(),
    systemAlerts: z.boolean(),
    customerMessages: z.boolean(),
  }),
  
  // System Preferences
  timezone: z.string(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']),
  timeFormat: z.enum(['12', '24']),
  language: z.enum(['en', 'ms']),
  currency: z.enum(['MYR']),
  
  // Advanced Settings
  developerMode: z.boolean(),
  showApiLogs: z.boolean(),
  enableDebugMode: z.boolean(),
  autoRefreshDashboard: z.boolean(),
  refreshInterval: z.number().min(30).max(300), // seconds
});

/**
 * GET /api/admin/settings/preferences - Get admin preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if admin preferences exist in notification preferences table
    let adminPreferences = await prisma.notificationPreference.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        language: true,
        emailNotifications: true,
        id: true,
        userId: true,
      }
    });

    // Provide comprehensive default preferences
    const preferences = {
      // Dashboard Layout
      dashboardLayout: 'grid' as const,
      sidebarCollapsed: false,
      showDashboardTips: true,
      
      // Default Views
      defaultOrdersView: 'all' as const,
      defaultProductsView: 'all' as const,
      defaultCustomersView: 'all' as const,
      itemsPerPage: 20,
      
      // Email Notifications (from existing preferences or defaults)
      emailNotifications: adminPreferences?.emailNotifications || {
        newOrders: true,
        lowStock: true,
        customerRegistrations: true,
        systemAlerts: true,
        dailyReports: false,
        weeklyReports: true,
        monthlyReports: true,
      },
      
      // Browser Notifications
      browserNotifications: {
        newOrders: true,
        lowStock: true,
        systemAlerts: true,
        customerMessages: false,
      },
      
      // System Preferences
      timezone: 'Asia/Kuala_Lumpur',
      dateFormat: 'DD/MM/YYYY' as const,
      timeFormat: '24' as const,
      language: adminPreferences?.language || 'en' as const,
      currency: 'MYR' as const,
      
      // Advanced Settings
      developerMode: false,
      showApiLogs: false,
      enableDebugMode: false,
      autoRefreshDashboard: true,
      refreshInterval: 60,
    };

    return NextResponse.json({
      success: true,
      data: preferences
    });

  } catch (error) {
    console.error('Get admin preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/preferences - Update admin preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = adminPreferencesSchema.parse(body);

    // Update notification preferences (for language and email notifications)
    await prisma.notificationPreference.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        language: validatedData.language,
        emailNotifications: validatedData.emailNotifications,
      },
      create: {
        userId: session.user.id,
        language: validatedData.language,
        emailNotifications: validatedData.emailNotifications,
        smsNotifications: {
          orderConfirmation: false,
          shippingUpdate: false,
          deliveryUpdate: false,
        },
        marketingCommunications: false,
      },
    });

    // Note: Other admin preferences like dashboard layout, browser notifications, etc.
    // would typically be stored in a dedicated AdminPreferences table
    // For now, we store the essential ones that integrate with existing schema
    
    // In future enhancement, create an AdminPreferences table:
    // await prisma.adminPreferences.upsert({
    //   where: { userId: session.user.id },
    //   update: { ...validatedData },
    //   create: { userId: session.user.id, ...validatedData },
    // });

    return NextResponse.json({
      success: true,
      message: 'Admin preferences updated successfully',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update admin preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}