/**
 * Admin Landing Pages API - List & Create
 * GET  /api/admin/landing-pages - List all landing pages
 * POST /api/admin/landing-pages - Create new landing page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { landingPageCreateSchema, landingPageFilterSchema } from '@/lib/validations/landing-page-validation';
import { calculateReadingTime } from '@/lib/constants/landing-page-constants';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { checkCSRF } from '@/lib/middleware/with-csrf';

/**
 * GET /api/admin/landing-pages
 * List all landing pages with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = landingPageFilterSchema.parse({
      tag: searchParams.get('tag') || undefined,
      status: searchParams.get('status') || undefined,
      author: searchParams.get('author') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      pageSize: searchParams.get('pageSize') || undefined,
    });

    // 3. Build Prisma where clause
    const where: Prisma.LandingPageWhereInput = {};

    if (filters.tag) {
      where.tags = {
        some: {
          tag: { slug: filters.tag },
        },
      };
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.author) {
      where.authorId = filters.author;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { excerpt: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // 4. Calculate pagination
    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    // 5. Fetch landing pages with relations and count
    const [landingPages, total] = await Promise.all([
      prisma.landingPage.findMany({
        where,
        include: {
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
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take,
      }),
      prisma.landingPage.count({ where }),
    ]);

    // 6. Calculate total pages
    const totalPages = Math.ceil(total / filters.pageSize);

    // 7. Return response
    return NextResponse.json({
      landingPages,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching landing pages:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch landing pages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/landing-pages
 * Create new landing page
 */
export async function POST(request: NextRequest) {
  // CSRF Protection
  const csrfCheck = await checkCSRF(request);
  if (csrfCheck) return csrfCheck;

  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const json = await request.json();
    const validatedData = landingPageCreateSchema.parse(json);

    // 3. Calculate reading time from content
    const readingTimeMin = calculateReadingTime(validatedData.content);

    // 4. Handle tags - create new ones if needed
    const tagConnections = await Promise.all(
      validatedData.tags.map(async (tagName) => {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');

        // Upsert tag (create if doesn't exist)
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

    // 5. Create landing page in database
    const landingPage = await prisma.landingPage.create({
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        excerpt: validatedData.excerpt,
        content: validatedData.content,
        featuredImage: validatedData.featuredImage,
        featuredImageAlt: validatedData.featuredImageAlt,
        status: validatedData.status,
        publishedAt: validatedData.status === 'PUBLISHED'
          ? validatedData.publishedAt || new Date()
          : null,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        metaKeywords: validatedData.metaKeywords,
        readingTimeMin,
        authorId: session.user.id,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        tags: {
          create: tagConnections,
        },
      },
      include: {
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
      },
    });

    // 6. Return created landing page
    return NextResponse.json({ landingPage }, { status: 201 });
  } catch (error) {
    console.error('Error creating landing page:', error);

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
      { error: 'Failed to create landing page' },
      { status: 500 }
    );
  }
}
