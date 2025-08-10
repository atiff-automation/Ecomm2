/**
 * Admin Theme Customization API - Malaysian E-commerce Platform
 * Allows admin to manage site color themes and visual appearance
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const colorRegex = /^#[0-9A-F]{6}$/i;

const themeSchema = z.object({
  name: z.string().min(1, 'Theme name is required'),
  primaryColor: z.string().regex(colorRegex, 'Invalid primary color format (use #RRGGBB)'),
  secondaryColor: z.string().regex(colorRegex, 'Invalid secondary color format (use #RRGGBB)'),
  backgroundColor: z.string().regex(colorRegex, 'Invalid background color format (use #RRGGBB)'),
  textColor: z.string().regex(colorRegex, 'Invalid text color format (use #RRGGBB)'),
});

/**
 * GET /api/admin/site-customization/theme - Get current theme configuration
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get active theme or create default if none exists
    let activeTheme = await prisma.siteTheme.findFirst({
      where: { isActive: true },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create default theme if none exists
    if (!activeTheme) {
      activeTheme = await prisma.siteTheme.create({
        data: {
          name: 'Default JRM Theme',
          primaryColor: '#3B82F6', // Blue
          secondaryColor: '#FDE047', // Yellow
          backgroundColor: '#F8FAFC', // Light gray
          textColor: '#1E293B', // Dark gray
          isActive: true,
          createdBy: session.user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }

    // Get all themes for theme management
    const allThemes = await prisma.siteTheme.findMany({
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      activeTheme,
      allThemes,
      message: 'Theme configuration retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { message: 'Failed to fetch theme configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/site-customization/theme - Update or create theme
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { themeId, ...themeData } = body;
    const validatedData = themeSchema.parse(themeData);

    let updatedTheme;

    if (themeId) {
      // Update existing theme
      const existingTheme = await prisma.siteTheme.findUnique({
        where: { id: themeId },
      });

      if (!existingTheme) {
        return NextResponse.json(
          { message: 'Theme not found' },
          { status: 404 }
        );
      }

      updatedTheme = await prisma.siteTheme.update({
        where: { id: themeId },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Create new theme
      // First check if theme name already exists
      const existingTheme = await prisma.siteTheme.findUnique({
        where: { name: validatedData.name },
      });

      if (existingTheme) {
        return NextResponse.json(
          { message: 'A theme with this name already exists' },
          { status: 400 }
        );
      }

      updatedTheme = await prisma.siteTheme.create({
        data: {
          ...validatedData,
          isActive: false, // New themes are not active by default
          createdBy: session.user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: themeId ? 'THEME_UPDATED' : 'THEME_CREATED',
        resource: 'SITE_CUSTOMIZATION',
        details: {
          themeId: updatedTheme.id,
          themeName: updatedTheme.name,
          changes: validatedData,
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      theme: updatedTheme,
      message: `Theme ${themeId ? 'updated' : 'created'} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Error updating theme:', error);
    return NextResponse.json(
      { message: 'Failed to update theme' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/site-customization/theme - Activate a theme
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { themeId, action } = body;

    if (action === 'activate') {
      if (!themeId) {
        return NextResponse.json(
          { message: 'Theme ID is required' },
          { status: 400 }
        );
      }

      // Check if theme exists
      const theme = await prisma.siteTheme.findUnique({
        where: { id: themeId },
      });

      if (!theme) {
        return NextResponse.json(
          { message: 'Theme not found' },
          { status: 404 }
        );
      }

      // Deactivate all themes first
      await prisma.siteTheme.updateMany({
        data: { isActive: false },
      });

      // Activate the selected theme
      const activatedTheme = await prisma.siteTheme.update({
        where: { id: themeId },
        data: { isActive: true, updatedAt: new Date() },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'THEME_ACTIVATED',
          resource: 'SITE_CUSTOMIZATION',
          details: {
            themeId: activatedTheme.id,
            themeName: activatedTheme.name,
            performedBy: session.user.email,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return NextResponse.json({
        theme: activatedTheme,
        message: 'Theme activated successfully',
      });
    } else if (action === 'duplicate') {
      if (!themeId) {
        return NextResponse.json(
          { message: 'Theme ID is required' },
          { status: 400 }
        );
      }

      // Get the theme to duplicate
      const originalTheme = await prisma.siteTheme.findUnique({
        where: { id: themeId },
      });

      if (!originalTheme) {
        return NextResponse.json(
          { message: 'Theme not found' },
          { status: 404 }
        );
      }

      // Create duplicate theme
      const duplicatedTheme = await prisma.siteTheme.create({
        data: {
          name: `${originalTheme.name} (Copy)`,
          primaryColor: originalTheme.primaryColor,
          secondaryColor: originalTheme.secondaryColor,
          backgroundColor: originalTheme.backgroundColor,
          textColor: originalTheme.textColor,
          isActive: false,
          createdBy: session.user.id,
        },
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        theme: duplicatedTheme,
        message: 'Theme duplicated successfully',
      });
    } else {
      return NextResponse.json(
        { message: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing theme action:', error);
    return NextResponse.json(
      { message: 'Failed to process theme action' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/site-customization/theme - Delete a theme
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('id');

    if (!themeId) {
      return NextResponse.json(
        { message: 'Theme ID is required' },
        { status: 400 }
      );
    }

    // Get theme to check if it's active
    const theme = await prisma.siteTheme.findUnique({
      where: { id: themeId },
    });

    if (!theme) {
      return NextResponse.json(
        { message: 'Theme not found' },
        { status: 404 }
      );
    }

    if (theme.isActive) {
      return NextResponse.json(
        { message: 'Cannot delete the active theme. Please activate another theme first.' },
        { status: 400 }
      );
    }

    // Delete the theme
    await prisma.siteTheme.delete({
      where: { id: themeId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'THEME_DELETED',
        resource: 'SITE_CUSTOMIZATION',
        details: {
          themeId: theme.id,
          themeName: theme.name,
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      message: 'Theme deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting theme:', error);
    return NextResponse.json(
      { message: 'Failed to delete theme' },
      { status: 500 }
    );
  }
}