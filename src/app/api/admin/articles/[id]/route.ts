/**
 * Admin Articles API - Get, Update, Delete
 * GET    /api/admin/articles/[id] - Get single article
 * PUT    /api/admin/articles/[id] - Update article
 * DELETE /api/admin/articles/[id] - Delete article
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { articleUpdateSchema, articleIdSchema } from '@/lib/validations/article-validation';
import { calculateReadingTime } from '@/lib/constants/article-constants';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

/**
 * GET /api/admin/articles/[id]
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
    const articleId = articleIdSchema.parse(params.id);

    // 3. Fetch article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
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

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error fetching article:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/articles/[id]
 */
export async function PUT(
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
    const articleId = articleIdSchema.parse(params.id);

    // 3. Check article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        tags: true,
      },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // 4. Parse and validate update data
    const json = await request.json();
    const validatedData = articleUpdateSchema.parse(json);

    // 5. Calculate reading time if content changed
    let readingTimeMin = existingArticle.readingTimeMin;
    if (validatedData.content) {
      readingTimeMin = calculateReadingTime(validatedData.content);
    }

    // 6. Handle tags if provided
    let tagOperations = {};
    if (validatedData.tags) {
      // Delete existing tag connections
      await prisma.articleToTag.deleteMany({
        where: { articleId },
      });

      // Create new tag connections
      const tagConnections = await Promise.all(
        validatedData.tags.map(async (tagName) => {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');

          const tag = await prisma.articleTag.upsert({
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
    if (validatedData.status === 'PUBLISHED' && !existingArticle.publishedAt) {
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

    // 8. Update article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
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

    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    console.error('Error updating article:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'An article with this slug already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/articles/[id]
 */
export async function DELETE(
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
    const articleId = articleIdSchema.parse(params.id);

    // 3. Check article exists
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // 4. Delete article (cascade will delete tags relations)
    await prisma.article.delete({
      where: { id: articleId },
    });

    return NextResponse.json(
      { message: 'Article deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting article:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
