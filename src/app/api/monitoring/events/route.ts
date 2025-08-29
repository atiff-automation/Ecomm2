/**
 * Event Monitoring API - Malaysian E-commerce Platform
 * Endpoint for receiving and processing user events and analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

interface UserEvent {
  eventId: string;
  eventType:
    | 'page_view'
    | 'click'
    | 'form_submit'
    | 'purchase'
    | 'error'
    | 'custom';
  timestamp: string;
  url: string;
  userAgent: string;
  sessionId?: string;
  userId?: string;
  data?: Record<string, any>;
  properties?: {
    element?: string;
    text?: string;
    value?: string | number;
    category?: string;
    label?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous';
    const { success } = await rateLimit.limit(identifier, {
      limit: 500,
      window: '1h',
      key: 'event-monitoring',
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const event: UserEvent = await request.json();

    // Validate required fields
    if (!event.eventId || !event.eventType || !event.timestamp || !event.url) {
      return NextResponse.json(
        {
          error: 'Missing required fields: eventId, eventType, timestamp, url',
        },
        { status: 400 }
      );
    }

    // Additional security validation
    const headersList = headers();
    const userAgent = headersList.get('user-agent');
    const referer = headersList.get('referer');

    // Basic security checks
    if (userAgent && userAgent.includes('bot')) {
      return NextResponse.json(
        { error: 'Bot requests not allowed' },
        { status: 403 }
      );
    }

    // Process the event
    await processUserEvent(event);

    return NextResponse.json({
      success: true,
      eventId: event.eventId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing user event:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Process and analyze user event
 */
async function processUserEvent(event: UserEvent) {
  try {
    // Route to specific event processors
    switch (event.eventType) {
      case 'page_view':
        await processPageView(event);
        break;
      case 'click':
        await processClickEvent(event);
        break;
      case 'form_submit':
        await processFormSubmit(event);
        break;
      case 'purchase':
        await processPurchaseEvent(event);
        break;
      case 'error':
        await processErrorEvent(event);
        break;
      case 'custom':
        await processCustomEvent(event);
        break;
      default:
        console.warn('Unknown event type:', event.eventType);
    }

    // Store event data
    await storeEventData(event);

    // Update analytics
    await updateEventAnalytics(event);
  } catch (error) {
    console.error('Failed to process user event:', error);
    throw error;
  }
}

/**
 * Process page view events
 */
async function processPageView(event: UserEvent) {
  console.log(`👁️ Page View: ${event.url}`, {
    userId: event.userId || 'anonymous',
    sessionId: event.sessionId,
    timestamp: event.timestamp,
  });

  // Track page popularity
  await incrementPageViewCount(event.url);

  // Track user journey
  if (event.sessionId) {
    await trackUserJourney(event.sessionId, event.url);
  }
}

/**
 * Process click events
 */
async function processClickEvent(event: UserEvent) {
  const element = event.properties?.element || 'unknown';
  const text = event.properties?.text || '';

  console.log(`🖱️ Click Event: ${element}`, {
    text: text.slice(0, 50),
    url: event.url,
    userId: event.userId || 'anonymous',
  });

  // Track button/link popularity
  await incrementClickCount(element, event.url);

  // Detect potential UI issues
  if (
    text.toLowerCase().includes('error') ||
    text.toLowerCase().includes('failed')
  ) {
    await trackPotentialUIIssue(event);
  }
}

/**
 * Process form submission events
 */
async function processFormSubmit(event: UserEvent) {
  const formData = event.data || {};

  console.log(`📝 Form Submit: ${event.url}`, {
    formFields: Object.keys(formData).length,
    userId: event.userId || 'anonymous',
    timestamp: event.timestamp,
  });

  // Track form completion rates
  await trackFormCompletion(event.url, formData);

  // Detect form issues
  if (
    formData.errors &&
    Array.isArray(formData.errors) &&
    formData.errors.length > 0
  ) {
    await trackFormErrors(event.url, formData.errors);
  }
}

/**
 * Process purchase events (critical for e-commerce)
 */
async function processPurchaseEvent(event: UserEvent) {
  const purchaseData = event.data || {};

  console.log(`💰 Purchase Event:`, {
    orderId: purchaseData.orderId,
    amount: purchaseData.amount,
    currency: purchaseData.currency || 'MYR',
    items: purchaseData.items?.length || 0,
    userId: event.userId,
    timestamp: event.timestamp,
  });

  // Track revenue and conversions
  await trackRevenue(purchaseData);

  // Update conversion funnel
  if (event.sessionId) {
    await updateConversionFunnel(event.sessionId, purchaseData);
  }

  // Alert for high-value purchases
  if (purchaseData.amount && purchaseData.amount > 1000) {
    await sendHighValuePurchaseAlert(purchaseData);
  }
}

/**
 * Process error events
 */
async function processErrorEvent(event: UserEvent) {
  const errorData = event.data || {};

  console.error(`❌ User-Reported Error:`, {
    message: errorData.message,
    url: event.url,
    userId: event.userId || 'anonymous',
    timestamp: event.timestamp,
  });

  // Track user-facing errors
  await trackUserError(event.url, errorData);

  // Alert for critical user errors
  if (errorData.severity === 'critical') {
    await sendUserErrorAlert(event);
  }
}

/**
 * Process custom events
 */
async function processCustomEvent(event: UserEvent) {
  console.log(
    `🔧 Custom Event: ${event.properties?.category || 'uncategorized'}`,
    {
      label: event.properties?.label,
      value: event.properties?.value,
      url: event.url,
      data: event.data,
    }
  );

  // Store custom event data
  await storeCustomEventData(event);
}

/**
 * Helper functions for event tracking
 */

async function incrementPageViewCount(url: string) {
  // In production, this would use Redis INCR or database updates
  console.log(`Incrementing page view count for: ${url}`);
}

async function trackUserJourney(sessionId: string, url: string) {
  // Track user navigation path
  console.log(`Tracking user journey: ${sessionId} → ${url}`);
}

async function incrementClickCount(element: string, url: string) {
  // Track element interaction popularity
  console.log(`Incrementing click count: ${element} on ${url}`);
}

async function trackPotentialUIIssue(event: UserEvent) {
  // Flag potential UI problems
  console.warn('Potential UI issue detected:', event);
}

async function trackFormCompletion(url: string, formData: any) {
  // Track form completion and abandonment rates
  console.log(`Tracking form completion for: ${url}`, {
    fields: Object.keys(formData).length,
  });
}

async function trackFormErrors(url: string, errors: string[]) {
  // Track form validation errors
  console.warn(`Form errors on ${url}:`, errors);
}

async function trackRevenue(purchaseData: any) {
  // Track revenue metrics
  console.log('Tracking revenue:', {
    amount: purchaseData.amount,
    currency: purchaseData.currency,
    items: purchaseData.items?.length,
  });
}

async function updateConversionFunnel(sessionId: string, purchaseData: any) {
  // Update conversion funnel analytics
  console.log(`Conversion completed for session: ${sessionId}`, purchaseData);
}

async function sendHighValuePurchaseAlert(purchaseData: any) {
  // Alert for significant purchases
  console.log('High value purchase alert:', purchaseData);
}

async function trackUserError(url: string, errorData: any) {
  // Track user-reported errors
  console.error(`User error on ${url}:`, errorData);
}

async function sendUserErrorAlert(event: UserEvent) {
  // Alert for critical user-facing errors
  console.error('Critical user error alert:', event);
}

async function storeCustomEventData(event: UserEvent) {
  // Store custom event in database
  console.log('Storing custom event:', event);
}

async function storeEventData(event: UserEvent) {
  // Store event data in database
  console.log('Storing event data:', {
    eventId: event.eventId,
    eventType: event.eventType,
    url: event.url,
    timestamp: event.timestamp,
  });
}

async function updateEventAnalytics(event: UserEvent) {
  // Update real-time analytics
  const date = new Date().toISOString().split('T')[0];
  const statsKey = `event_stats:${date}`;

  console.log(`Updating event analytics for ${statsKey}:`, {
    eventType: event.eventType,
    url: event.url,
  });
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'event-monitoring',
  });
}
