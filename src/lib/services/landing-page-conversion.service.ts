import { prisma } from '@/lib/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Landing Page Conversion Tracking Service
 * Handles conversion attribution for orders originating from landing pages
 */

export interface ConversionTrackingData {
  landingPageId?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/**
 * Track Landing Page Conversion
 *
 * Should be called when an order is successfully created/paid
 * Creates conversion record and updates landing page statistics
 *
 * @param orderId - Order ID
 * @param userId - User ID (optional)
 * @param orderValue - Total order value
 * @param trackingData - Conversion tracking data from session
 * @returns Conversion record or null if no landing page tracking
 */
export async function trackLandingPageConversion(
  orderId: string,
  userId: string | null | undefined,
  orderValue: Decimal | number,
  trackingData: ConversionTrackingData
): Promise<void> {
  try {
    // Only track if landing page ID is present
    if (!trackingData.landingPageId) {
      return;
    }

    // Verify landing page exists
    const landingPage = await prisma.landingPage.findUnique({
      where: { id: trackingData.landingPageId },
      select: { id: true },
    });

    if (!landingPage) {
      console.warn(
        `[trackLandingPageConversion] Landing page not found: ${trackingData.landingPageId}`
      );
      return;
    }

    // Convert order value to Decimal for consistent handling
    const orderValueDecimal =
      orderValue instanceof Decimal ? orderValue : new Decimal(orderValue);

    // Create conversion record and update landing page stats in transaction
    await prisma.$transaction([
      // Create conversion event
      prisma.landingPageConversion.create({
        data: {
          landingPageId: trackingData.landingPageId,
          orderId,
          orderValue: orderValueDecimal,
          sessionId: trackingData.sessionId,
          userId: userId || undefined,
          utmSource: trackingData.utmSource,
          utmMedium: trackingData.utmMedium,
          utmCampaign: trackingData.utmCampaign,
        },
      }),
      // Update landing page conversion statistics
      prisma.landingPage.update({
        where: { id: trackingData.landingPageId },
        data: {
          conversionCount: { increment: 1 },
          conversionValue: { increment: orderValueDecimal },
        },
      }),
    ]);

    console.log(
      `[trackLandingPageConversion] Conversion tracked: Order ${orderId}, Landing Page ${trackingData.landingPageId}, Value: ${orderValueDecimal.toString()}`
    );
  } catch (error) {
    // Log error but don't throw - conversion tracking shouldn't break order creation
    console.error('[trackLandingPageConversion] Error tracking conversion:', error);
  }
}

/**
 * Get Conversion Tracking Data from Session/Cookies
 *
 * This is a helper function that should be implemented based on your session management
 * For now, it returns a placeholder structure
 *
 * @param request - Request object with headers/cookies
 * @returns Conversion tracking data
 */
export function getConversionTrackingData(
  request: Request
): ConversionTrackingData {
  // TODO: Implement based on your session/cookie management
  // This should retrieve:
  // - landingPageId from session/cookie
  // - sessionId from session
  // - UTM parameters from session/cookie
  //
  // Example implementation:
  // const cookies = request.headers.get('cookie');
  // const landingPageId = getCookie(cookies, 'landing_page_id');
  // const sessionId = getCookie(cookies, 'session_id');
  // const utmSource = getCookie(cookies, 'utm_source');
  // ... etc

  return {
    landingPageId: undefined,
    sessionId: undefined,
    utmSource: undefined,
    utmMedium: undefined,
    utmCampaign: undefined,
  };
}
