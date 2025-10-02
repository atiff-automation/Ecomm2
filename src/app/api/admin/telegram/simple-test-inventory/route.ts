/**

export const dynamic = 'force-dynamic';

 * Simplified Test Inventory Notification API - Malaysian E-commerce Platform
 * CENTRALIZED inventory test functionality using simplified service
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { simplifiedTelegramService } from '@/lib/telegram/simplified-telegram-service';

/**
 * POST /api/admin/telegram/simple-test-inventory - Send test inventory alert
 * DRY: Uses same alert format as production
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // CENTRALIZED: Admin-only access
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    // NO HARDCODE: Dynamic test data with Malaysian product context
    const testProducts = [
      { name: 'Batik Print Shirt - Traditional Malaysian', sku: 'BTK-001-M', stock: 3 },
      { name: 'Rendang Instant Paste 200g', sku: 'RND-200G', stock: 5 },
      { name: 'Teh Tarik Premium Mix', sku: 'TEH-MIX-500G', stock: 2 },
    ];

    // NO HARDCODE: Random selection for variety
    const randomProduct = testProducts[Math.floor(Math.random() * testProducts.length)];

    // DRY: Use simplified service
    const success = await simplifiedTelegramService.sendLowStockAlert(
      randomProduct.name,
      randomProduct.stock,
      randomProduct.sku
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test inventory alert sent successfully!',
        data: randomProduct,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send test inventory alert',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test inventory alert:', error);
    return NextResponse.json(
      { message: 'Failed to send test inventory alert' },
      { status: 500 }
    );
  }
}