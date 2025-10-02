/**

export const dynamic = 'force-dynamic';

 * Public Discount Codes API
 * Returns active public discount codes for display
 */

import { NextResponse } from 'next/server';
import { discountService } from '@/lib/discounts/discount-service';

export async function GET() {
  try {
    const discountCodes = await discountService.getPublicDiscountCodes();

    return NextResponse.json({
      discountCodes: discountCodes.map(code => ({
        ...code,
        discountValue: Number(code.discountValue),
        minimumOrderValue: code.minimumOrderValue
          ? Number(code.minimumOrderValue)
          : null,
      })),
    });
  } catch (error) {
    console.error('Error fetching public discount codes:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
