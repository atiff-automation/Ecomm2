/**
 * Purchase Count API for Social Proof
 * Returns recent purchase counts for products
 */

import { NextRequest, NextResponse } from 'next/server';
import { socialProofService } from '@/lib/social-proof/social-proof-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { message: 'productId parameter is required' },
        { status: 400 }
      );
    }

    const count = await socialProofService.getPurchaseCount(productId);

    return NextResponse.json({
      productId,
      count,
      message:
        count > 0
          ? `${count} ${count === 1 ? 'person' : 'people'} bought this in the last 24 hours`
          : 'No recent purchases',
    });
  } catch (error) {
    console.error('Error fetching purchase count:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
