/**

export const dynamic = 'force-dynamic';

 * Trending Products Social Proof API
 * Returns trending products based on recent purchases
 */

import { NextRequest, NextResponse } from 'next/server';
import { socialProofService } from '@/lib/social-proof/social-proof-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const trendingProducts = await socialProofService.getTrendingProducts(
      Math.min(limit, 20) // Max 20 products
    );

    return NextResponse.json({
      trendingProducts,
      count: trendingProducts.length,
    });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
