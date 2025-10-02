/**

export const dynamic = 'force-dynamic';

 * Stock Levels Social Proof API
 * Returns stock levels and social proof messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { socialProofService } from '@/lib/social-proof/social-proof-service';
import { z } from 'zod';

const stockLevelsSchema = z.object({
  productIds: z.array(z.string()).min(1).max(50), // Limit to 50 products per request
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIdsParam = searchParams.get('productIds');

    if (!productIdsParam) {
      return NextResponse.json(
        { message: 'productIds parameter is required' },
        { status: 400 }
      );
    }

    const productIds = productIdsParam.split(',').filter(id => id.trim());

    if (productIds.length === 0) {
      return NextResponse.json(
        { message: 'At least one product ID is required' },
        { status: 400 }
      );
    }

    const stockLevels = await socialProofService.getStockLevels(productIds);

    // Get purchase counts for each product
    const socialProofData = await Promise.all(
      productIds.map(async productId => {
        const purchaseCount =
          await socialProofService.getPurchaseCount(productId);
        const stockLevel = stockLevels[productId];

        if (!stockLevel) {
          return {
            productId,
            message: 'Product not found',
            stockLevel: null,
            purchaseCount: 0,
          };
        }

        return {
          productId,
          message: socialProofService.getSocialProofMessage(
            stockLevel,
            purchaseCount
          ),
          stockLevel,
          purchaseCount,
        };
      })
    );

    return NextResponse.json({
      stockLevels,
      socialProofData: socialProofData.reduce(
        (acc, item) => {
          acc[item.productId] = item;
          return acc;
        },
        {} as Record<string, any>
      ),
    });
  } catch (error) {
    console.error('Error fetching stock levels:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productIds } = stockLevelsSchema.parse(body);

    const stockLevels = await socialProofService.getStockLevels(productIds);

    // Get purchase counts for each product
    const socialProofData = await Promise.all(
      productIds.map(async productId => {
        const purchaseCount =
          await socialProofService.getPurchaseCount(productId);
        const stockLevel = stockLevels[productId];

        if (!stockLevel) {
          return {
            productId,
            message: 'Product not found',
            stockLevel: null,
            purchaseCount: 0,
          };
        }

        return {
          productId,
          message: socialProofService.getSocialProofMessage(
            stockLevel,
            purchaseCount
          ),
          stockLevel,
          purchaseCount,
        };
      })
    );

    return NextResponse.json({
      socialProofData: socialProofData.reduce(
        (acc, item) => {
          acc[item.productId] = item;
          return acc;
        },
        {} as Record<string, any>
      ),
    });
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

    console.error('Error fetching stock levels:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
