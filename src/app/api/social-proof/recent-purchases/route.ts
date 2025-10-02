/**

export const dynamic = 'force-dynamic';

 * Recent Purchases Social Proof API
 * Returns recent purchases for social proof display
 */

import { NextRequest, NextResponse } from 'next/server';
import { socialProofService } from '@/lib/social-proof/social-proof-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const recentPurchases = await socialProofService.getRecentPurchases(
      productId || undefined
    );

    return NextResponse.json({
      recentPurchases,
      count: recentPurchases.length,
    });
  } catch (error) {
    console.error('Error fetching recent purchases:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
