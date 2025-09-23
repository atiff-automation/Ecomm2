import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    // Get recent webhook activity from the last 24 hours
    const recentActivity = await prisma.chatWebhookQueue.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: {
        id: true,
        messageId: true,
        status: true,
        attempts: true,
        createdAt: true,
        updatedAt: true,
        lastError: true,
        webhookUrl: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to most recent 50 activities
    });

    // Format the response to match the expected interface
    const formattedActivity = recentActivity.map(activity => ({
      id: activity.id,
      messageId: activity.messageId,
      status: activity.status,
      attempts: activity.attempts,
      createdAt: activity.createdAt.toISOString(),
      lastError: activity.lastError,
      webhookUrl: activity.webhookUrl,
    }));

    return NextResponse.json(formattedActivity);
  } catch (error) {
    console.error('Error fetching webhook activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook activity' },
      { status: 500 }
    );
  }
}
