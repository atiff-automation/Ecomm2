import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { webhookService } from '@/lib/chat/webhook-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, queueIds } = body;

    if (!action || !Array.isArray(queueIds) || queueIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid action or queue IDs' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'retry':
        result = await handleRetryAction(queueIds);
        break;

      case 'cancel':
        result = await handleCancelAction(queueIds);
        break;

      case 'delete':
        result = await handleDeleteAction(queueIds);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: `${action} action completed`,
      ...result,
    });
  } catch (error) {
    console.error('Error performing queue action:', error);
    return NextResponse.json(
      { error: 'Failed to perform queue action' },
      { status: 500 }
    );
  }
}

async function handleRetryAction(queueIds: string[]) {
  const results = [];
  let successful = 0;
  let failed = 0;

  for (const queueId of queueIds) {
    try {
      // Check if item is eligible for retry
      const queueItem = await prisma.chatWebhookQueue.findUnique({
        where: { id: queueId },
        select: {
          id: true,
          status: true,
          attempts: true,
          maxAttempts: true,
        },
      });

      if (!queueItem) {
        failed++;
        results.push({
          queueId,
          success: false,
          error: 'Queue item not found',
        });
        continue;
      }

      if (queueItem.status !== 'failed') {
        failed++;
        results.push({
          queueId,
          success: false,
          error: `Cannot retry ${queueItem.status} item`,
        });
        continue;
      }

      if (queueItem.attempts >= queueItem.maxAttempts) {
        failed++;
        results.push({
          queueId,
          success: false,
          error: 'Maximum attempts exceeded',
        });
        continue;
      }

      // Reset status to pending for retry
      await prisma.chatWebhookQueue.update({
        where: { id: queueId },
        data: {
          status: 'pending',
          nextRetryAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        },
      });

      successful++;
      results.push({
        queueId,
        success: true,
      });
    } catch (error) {
      failed++;
      results.push({
        queueId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { successful, failed, results };
}

async function handleCancelAction(queueIds: string[]) {
  try {
    const result = await prisma.chatWebhookQueue.updateMany({
      where: {
        id: { in: queueIds },
        status: { in: ['pending', 'processing'] },
      },
      data: {
        status: 'failed',
        lastError: 'Cancelled by administrator',
        updatedAt: new Date(),
      },
    });

    return {
      successful: result.count,
      failed: queueIds.length - result.count,
      message: `${result.count} items cancelled`,
    };
  } catch (error) {
    throw error;
  }
}

async function handleDeleteAction(queueIds: string[]) {
  try {
    // Only allow deletion of completed or failed items
    const result = await prisma.chatWebhookQueue.deleteMany({
      where: {
        id: { in: queueIds },
        status: { in: ['completed', 'failed'] },
      },
    });

    return {
      successful: result.count,
      failed: queueIds.length - result.count,
      message: `${result.count} items deleted`,
    };
  } catch (error) {
    throw error;
  }
}
