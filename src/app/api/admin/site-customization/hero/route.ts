/**
 * Admin Hero Section Management API - Malaysian E-commerce Platform
 * Allows admin to manage hero section content, images, and videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const heroSectionSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
  ctaPrimaryText: z.string().min(1, 'Primary CTA text is required'),
  ctaPrimaryLink: z.string().min(1, 'Primary CTA link is required'),
  ctaSecondaryText: z.string().min(1, 'Secondary CTA text is required'),
  ctaSecondaryLink: z.string().min(1, 'Secondary CTA link is required'),
  backgroundType: z.enum(['IMAGE', 'VIDEO']),
  backgroundImage: z.string().optional().nullable(),
  backgroundVideo: z.string().optional().nullable(),
  overlayOpacity: z.number().min(0).max(1),
  textAlignment: z.enum(['left', 'center', 'right']),
});

/**
 * GET /api/admin/site-customization/hero - Get current hero section configuration
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

    // Get active hero section or create default if none exists
    let heroSection = await prisma.heroSection.findFirst({
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

    // Create default hero section if none exists
    if (!heroSection) {
      heroSection = await prisma.heroSection.create({
        data: {
          title: 'Welcome to JRM E-commerce',
          subtitle: "Malaysia's premier online marketplace",
          description:
            'Intelligent membership benefits, dual pricing, and local payment integration.',
          ctaPrimaryText: 'Join as Member',
          ctaPrimaryLink: '/auth/signup',
          ctaSecondaryText: 'Browse Products',
          ctaSecondaryLink: '/products',
          backgroundType: 'IMAGE',
          overlayOpacity: 0.1,
          textAlignment: 'left',
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

    return NextResponse.json({
      heroSection,
      message: 'Hero section retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching hero section:', error);
    return NextResponse.json(
      { message: 'Failed to fetch hero section' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/site-customization/hero - Update hero section configuration
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
    console.log(
      'Hero section update request body:',
      JSON.stringify(body, null, 2)
    );

    let validatedData;
    try {
      validatedData = heroSectionSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('Validation error details:', validationError.issues);
        return NextResponse.json(
          {
            message: 'Validation error',
            errors: validationError.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message,
              receivedValue:
                issue.path.length > 0
                  ? JSON.stringify(
                      issue.path.reduce((obj, key) => obj?.[key], body)
                    )
                  : 'N/A',
            })),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Get current active hero section
    const currentHero = await prisma.heroSection.findFirst({
      where: { isActive: true },
    });

    let updatedHero;

    if (currentHero) {
      // Update existing hero section
      updatedHero = await prisma.heroSection.update({
        where: { id: currentHero.id },
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
      // Create new hero section
      updatedHero = await prisma.heroSection.create({
        data: {
          ...validatedData,
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'HERO_SECTION_UPDATED',
        resource: 'SITE_CUSTOMIZATION',
        details: {
          heroSectionId: updatedHero.id,
          changes: validatedData,
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      heroSection: updatedHero,
      message: 'Hero section updated successfully',
    });
  } catch (error) {
    console.error('Error updating hero section:', error);
    return NextResponse.json(
      { message: 'Failed to update hero section' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/site-customization/hero - Reset to default hero section
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

    // Deactivate all existing hero sections
    await prisma.heroSection.updateMany({
      data: { isActive: false },
    });

    // Create new default hero section
    const defaultHero = await prisma.heroSection.create({
      data: {
        title: 'Welcome to JRM E-commerce',
        subtitle: "Malaysia's premier online marketplace",
        description:
          'Intelligent membership benefits, dual pricing, and local payment integration.',
        ctaPrimaryText: 'Join as Member',
        ctaPrimaryLink: '/auth/signup',
        ctaSecondaryText: 'Browse Products',
        ctaSecondaryLink: '/products',
        backgroundType: 'IMAGE',
        overlayOpacity: 0.1,
        textAlignment: 'left',
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'HERO_SECTION_RESET',
        resource: 'SITE_CUSTOMIZATION',
        details: {
          heroSectionId: defaultHero.id,
          performedBy: session.user.email,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      heroSection: defaultHero,
      message: 'Hero section reset to default successfully',
    });
  } catch (error) {
    console.error('Error resetting hero section:', error);
    return NextResponse.json(
      { message: 'Failed to reset hero section' },
      { status: 500 }
    );
  }
}
