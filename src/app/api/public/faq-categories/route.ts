/**
 * Public API: FAQ Categories
 * GET /api/public/faq-categories - List active categories
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/public/faq-categories
 * List all active FAQ categories for public display
 */
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.fAQCategory.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json({
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error fetching public FAQ categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQ categories' },
      { status: 500 }
    );
  }
}
