import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {};

    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions.OR = [
        {
          messageId: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          webhookUrl: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Get queue items with pagination
    const [items, total] = await Promise.all([
      prisma.chatWebhookQueue.findMany({
        where: whereConditions,
        select: {
          id: true,
          messageId: true,
          webhookUrl: true,
          status: true,
          attempts: true,
          maxAttempts: true,
          lastError: true,
          createdAt: true,
          updatedAt: true,
          nextRetryAt: true,
          payload: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.chatWebhookQueue.count({
        where: whereConditions,
      }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + items.length < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching queue items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue items' },
      { status: 500 }
    );
  }
}
