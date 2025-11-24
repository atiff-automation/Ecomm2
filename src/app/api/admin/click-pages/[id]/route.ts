/**
 * Admin Click Page Individual API Routes
 * GET /api/admin/click-pages/[id] - Get single click page
 * PUT /api/admin/click-pages/[id] - Update click page
 * DELETE /api/admin/click-pages/[id] - Delete click page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clickPageUpdateSchema } from '@/lib/validation/click-page-schemas';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/admin/click-pages/[id]
 * Get a single click page by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Fetch click page
    const clickPage = await prisma.clickPage.findUnique({
      where: { id },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        clicks: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Recent clicks
        },
        conversions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Recent conversions
        },
      },
    });

    if (!clickPage) {
      return NextResponse.json(
        { error: 'Click page not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ clickPage });
  } catch (error) {
    console.error('Error fetching click page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch click page' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/click-pages/[id]
 * Update a click page
 */
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if click page exists
    const existingClickPage = await prisma.clickPage.findUnique({
      where: { id },
    });

    if (!existingClickPage) {
      return NextResponse.json(
        { error: 'Click page not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const validatedData = clickPageUpdateSchema.parse(body);

    // If slug is being updated, check if it already exists (excluding current page)
    if (validatedData.slug && validatedData.slug !== existingClickPage.slug) {
      const duplicateSlug = await prisma.clickPage.findUnique({
        where: { slug: validatedData.slug },
      });

      if (duplicateSlug) {
        return NextResponse.json(
          { error: 'Click page with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Update click page
    const clickPage = await prisma.clickPage.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.slug && { slug: validatedData.slug }),
        ...(validatedData.blocks && { blocks: validatedData.blocks as never }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.publishedAt !== undefined && {
          publishedAt: validatedData.publishedAt,
        }),

        // SEO
        ...(validatedData.metaTitle !== undefined && {
          metaTitle: validatedData.metaTitle,
        }),
        ...(validatedData.metaDescription !== undefined && {
          metaDescription: validatedData.metaDescription,
        }),
        ...(validatedData.metaKeywords !== undefined && {
          metaKeywords: validatedData.metaKeywords,
        }),
        ...(validatedData.ogImageUrl !== undefined && {
          ogImageUrl: validatedData.ogImageUrl,
        }),
        ...(validatedData.twitterImageUrl !== undefined && {
          twitterImageUrl: validatedData.twitterImageUrl,
        }),
        ...(validatedData.canonicalUrl !== undefined && {
          canonicalUrl: validatedData.canonicalUrl,
        }),
        ...(validatedData.noIndex !== undefined && {
          noIndex: validatedData.noIndex,
        }),

        // Analytics & Tracking
        ...(validatedData.fbPixelId !== undefined && {
          fbPixelId: validatedData.fbPixelId,
        }),
        ...(validatedData.gaTrackingId !== undefined && {
          gaTrackingId: validatedData.gaTrackingId,
        }),
        ...(validatedData.gtmContainerId !== undefined && {
          gtmContainerId: validatedData.gtmContainerId,
        }),
        ...(validatedData.customScripts !== undefined && {
          customScripts: validatedData.customScripts as never,
        }),

        // Campaign
        ...(validatedData.scheduledPublishAt !== undefined && {
          scheduledPublishAt: validatedData.scheduledPublishAt,
        }),
        ...(validatedData.scheduledUnpublishAt !== undefined && {
          scheduledUnpublishAt: validatedData.scheduledUnpublishAt,
        }),
        ...(validatedData.campaignName !== undefined && {
          campaignName: validatedData.campaignName,
        }),
        ...(validatedData.campaignStartDate !== undefined && {
          campaignStartDate: validatedData.campaignStartDate,
        }),
        ...(validatedData.campaignEndDate !== undefined && {
          campaignEndDate: validatedData.campaignEndDate,
        }),

        // Theme Settings
        ...(validatedData.themeSettings !== undefined && {
          themeSettings: validatedData.themeSettings as never,
        }),

        // Updater
        updatedBy: session.user.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ clickPage });
  } catch (error) {
    console.error('Error updating click page:', error);

    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update click page' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/click-pages/[id]
 * Delete a click page (soft delete by changing status to DRAFT)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if click page exists
    const existingClickPage = await prisma.clickPage.findUnique({
      where: { id },
    });

    if (!existingClickPage) {
      return NextResponse.json(
        { error: 'Click page not found' },
        { status: 404 }
      );
    }

    // Hard delete the click page (cascade will delete related clicks and conversions)
    await prisma.clickPage.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Click page deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting click page:', error);
    return NextResponse.json(
      { error: 'Failed to delete click page' },
      { status: 500 }
    );
  }
}
