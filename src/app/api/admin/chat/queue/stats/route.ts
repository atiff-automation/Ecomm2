import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Get queue statistics
    const [pending, processing, completed, failed, total] = await Promise.all([
      prisma.chatWebhookQueue.count({
        where: { status: 'pending' },
      }),
      prisma.chatWebhookQueue.count({
        where: { status: 'processing' },
      }),
      prisma.chatWebhookQueue.count({
        where: { status: 'completed' },
      }),
      prisma.chatWebhookQueue.count({
        where: { status: 'failed' },
      }),
      prisma.chatWebhookQueue.count(),
    ]);

    // Calculate processing rate from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const processedLastHour = await prisma.chatWebhookQueue.count({
      where: {
        status: 'completed',
        updatedAt: {
          gte: oneHourAgo,
        },
      },
    });

    const processingRate = processedLastHour; // per hour

    const stats = {
      pending,
      processing,
      completed,
      failed,
      total,
      processingRate,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue statistics' },
      { status: 500 }
    );
  }
}
