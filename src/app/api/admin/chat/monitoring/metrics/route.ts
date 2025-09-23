import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Get webhook queue metrics
    const [
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      pendingDeliveries,
      chatConfig,
    ] = await Promise.all([
      prisma.chatWebhookQueue.count(),
      prisma.chatWebhookQueue.count({
        where: { status: 'completed' },
      }),
      prisma.chatWebhookQueue.count({
        where: { status: 'failed' },
      }),
      prisma.chatWebhookQueue.count({
        where: { status: 'pending' },
      }),
      prisma.chatConfig.findFirst({
        where: { isActive: true },
      }),
    ]);

    // Calculate success rate
    const successRate =
      totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

    // Get average response time from recent completed deliveries
    const recentCompletedDeliveries = await prisma.chatWebhookQueue.findMany({
      where: {
        status: 'completed',
        updatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    // Calculate average response time in milliseconds
    const avgResponseTime =
      recentCompletedDeliveries.length > 0
        ? recentCompletedDeliveries.reduce((acc, delivery) => {
            return (
              acc +
              (delivery.updatedAt.getTime() - delivery.createdAt.getTime())
            );
          }, 0) / recentCompletedDeliveries.length
        : 0;

    const metrics = {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      pendingDeliveries,
      successRate: Math.round(successRate * 10) / 10,
      avgResponseTime: Math.round(avgResponseTime),
      lastHealthCheck: chatConfig?.lastHealthCheck?.toISOString() || null,
      healthStatus: chatConfig?.healthStatus || 'UNKNOWN',
      queueSize:
        pendingDeliveries +
        (await prisma.chatWebhookQueue.count({
          where: { status: 'processing' },
        })),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching webhook metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook metrics' },
      { status: 500 }
    );
  }
}
