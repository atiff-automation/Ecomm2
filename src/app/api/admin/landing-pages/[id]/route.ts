/**
 * Admin Landing Pages API - Get, Update, Delete
 * GET    /api/admin/landing-pages/[id] - Get single landing page
 * PUT    /api/admin/landing-pages/[id] - Update landing page
 * DELETE /api/admin/landing-pages/[id] - Delete landing page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { landingPageUpdateSchema, landingPageIdSchema } from '@/lib/validations/landing-page-validation';
import { calculateReadingTime } from '@/lib/constants/landing-page-constants';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { checkCSRF } from '@/lib/middleware/with-csrf';

/**
 * GET /api/admin/landing-pages/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate ID
    const landingPageId = landingPageIdSchema.parse(params.id);

    // 3. Fetch landing page
    const landingPage = await prisma.landingPage.findUnique({
      where: { id: landingPageId },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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

    if (!landingPage) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    return NextResponse.json({ landingPage });
  } catch (error) {
    console.error('Error fetching landing page:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid landing page ID' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch landing page' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/landing-pages/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate ID
    const landingPageId = landingPageIdSchema.parse(params.id);

    // 3. Check landing page exists
    const existingLandingPage = await prisma.landingPage.findUnique({
      where: { id: landingPageId },
      include: {
        tags: true,
      },
    });

    if (!existingLandingPage) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    // 4. Parse and validate update data
    const json = await request.json();
    const validatedData = landingPageUpdateSchema.parse(json);

    // 5. Calculate reading time if content changed
    let readingTimeMin = existingLandingPage.readingTimeMin;
    if (validatedData.content) {
      readingTimeMin = calculateReadingTime(validatedData.content);
    }

    // 6. Handle tags if provided
    let tagOperations = {};
    if (validatedData.tags) {
      // Delete existing tag connections
      await prisma.landingPageToTag.deleteMany({
        where: { landingPageId },
      });

      // Create new tag connections
      const tagConnections = await Promise.all(
        validatedData.tags.map(async (tagName) => {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');

          const tag = await prisma.landingPageTag.upsert({
            where: { slug: tagSlug },
            update: {},
            create: {
              name: tagName,
              slug: tagSlug,
            },
          });

          return { tagId: tag.id };
        })
      );

      tagOperations = {
        tags: {
          create: tagConnections,
        },
      };
    }

    // 7. Handle publishedAt logic
    let publishedAtUpdate = {};
    if (validatedData.status === 'PUBLISHED' && !existingLandingPage.publishedAt) {
      publishedAtUpdate = {
        publishedAt: validatedData.publishedAt || new Date(),
      };
    } else if (validatedData.status === 'DRAFT') {
      publishedAtUpdate = {
        publishedAt: null,
      };
    } else if (validatedData.publishedAt) {
      publishedAtUpdate = {
        publishedAt: validatedData.publishedAt,
      };
    }

    // 8. Update landing page
    const updatedLandingPage = await prisma.landingPage.update({
      where: { id: landingPageId },
      data: {
        ...validatedData,
        ...publishedAtUpdate,
        readingTimeMin,
        updatedBy: session.user.id,
        ...tagOperations,
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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

    return NextResponse.json({ landingPage: updatedLandingPage });
  } catch (error) {
    console.error('Error updating landing page:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A landing page with this slug already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update landing page' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/landing-pages/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate ID
    const landingPageId = landingPageIdSchema.parse(params.id);

    // 3. Check landing page exists
    const existingLandingPage = await prisma.landingPage.findUnique({
      where: { id: landingPageId },
    });

    if (!existingLandingPage) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
    }

    // 4. Delete landing page (cascade will delete tags relations)
    await prisma.landingPage.delete({
      where: { id: landingPageId },
    });

    return NextResponse.json(
      { message: 'Landing page deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting landing page:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid landing page ID' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to delete landing page' },
      { status: 500 }
    );
  }
}
