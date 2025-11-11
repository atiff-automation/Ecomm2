/**
 * Public FAQ API - List Active FAQs
 * GET /api/public/faqs - Get all active FAQs for public display
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // 1. Parse category filter (optional)
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // 2. Build where clause
    const where: Prisma.FAQWhereInput = {
      status: 'ACTIVE',
    };

    if (category && category !== 'ALL') {
      where.category = category as any;
    }

    // 3. Fetch active FAQs (minimal data for public)
    const faqs = await prisma.fAQ.findMany({
      where,
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
        sortOrder: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // 4. Return FAQs
    return NextResponse.json({ faqs });

  } catch (error) {
    console.error('Error fetching public FAQs:', error);

    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}
