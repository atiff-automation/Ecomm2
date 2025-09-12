import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/chat/webhook-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const status = searchParams.get('status') || undefined;
    const messageId = searchParams.get('messageId') || undefined;
    const fromDate = searchParams.get('fromDate') 
      ? new Date(searchParams.get('fromDate')!) 
      : undefined;
    const toDate = searchParams.get('toDate') 
      ? new Date(searchParams.get('toDate')!) 
      : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    if (fromDate && toDate && fromDate > toDate) {
      return NextResponse.json(
        { error: 'fromDate cannot be after toDate' },
        { status: 400 }
      );
    }

    // Get delivery logs using enhanced webhook service method
    const result = await webhookService.getDeliveryLogs({
      status,
      messageId,
      fromDate,
      toDate,
      limit,
      offset
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching delivery logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, queueIds } = body;

    if (action === 'retry' && Array.isArray(queueIds)) {
      // Retry failed webhooks
      const result = await webhookService.retryFailedWebhooks(queueIds);
      
      return NextResponse.json({
        message: `Retry completed: ${result.successful} successful, ${result.failed} failed`,
        ...result
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing logs action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}