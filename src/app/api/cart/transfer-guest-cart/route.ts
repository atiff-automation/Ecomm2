/**
 * Transfer Guest Cart API - Malaysian E-commerce Platform
 * Transfers guest cart items to authenticated user's cart
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { transferGuestCartToUser } from '@/lib/cart/guest-cart';

/**
 * POST /api/cart/transfer-guest-cart - Transfer guest cart to user cart
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Transfer guest cart items to user's cart
    await transferGuestCartToUser(session.user.id);

    return NextResponse.json({
      message: 'Guest cart transferred successfully',
    });
  } catch (error) {
    console.error('Error transferring guest cart:', error);
    return NextResponse.json(
      { message: 'Failed to transfer guest cart' },
      { status: 500 }
    );
  }
}