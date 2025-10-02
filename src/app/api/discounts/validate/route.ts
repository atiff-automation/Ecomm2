/**

export const dynamic = 'force-dynamic';

 * Discount Code Validation API
 * Validates discount codes during checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { discountService } from '@/lib/discounts/discount-service';
import { z } from 'zod';

const discountValidationSchema = z.object({
  code: z.string().min(1, 'Discount code is required'),
  cartItems: z.array(
    z.object({
      productId: z.string(),
      categoryId: z.string(), // Primary category ID for discount validation
      quantity: z.number().min(1),
      regularPrice: z.number(),
      memberPrice: z.number(),
      appliedPrice: z.number(),
    })
  ),
  subtotal: z.number().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const validatedData = discountValidationSchema.parse(body);

    const result = await discountService.validateDiscount({
      code: validatedData.code,
      userId: session?.user?.id || null,
      cartItems: validatedData.cartItems,
      subtotal: validatedData.subtotal,
      isMember: session?.user?.isMember || false,
    });

    if (result.isValid) {
      return NextResponse.json({
        valid: true,
        discountAmount: result.discountAmount,
        discountType: result.discountType,
        discountCode: result.discountCode,
      });
    } else {
      return NextResponse.json(
        {
          valid: false,
          errors: result.errors,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Discount validation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
