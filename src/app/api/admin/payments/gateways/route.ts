/**
 * Admin Payment Gateway Configuration API
 * Provides centralized payment gateway management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { PaymentGatewayService } from '@/lib/services/payment-gateway.service';
import { UserRole } from '@prisma/client';

/**
 * GET /api/admin/payments/gateways
 * Returns all payment gateways with their configuration status
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Authorization check - Admin/Staff only
    if (
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SUPERADMIN &&
      session.user.role !== UserRole.STAFF
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const includeStats = searchParams.get('includeStats') === 'true';

    // Get gateway configurations
    const gateways = activeOnly 
      ? await PaymentGatewayService.getActivePaymentGateways()
      : await PaymentGatewayService.getPaymentGateways();

    // Structure response
    const response: any = {
      gateways,
      summary: {
        totalGateways: gateways.length,
        activeGateways: gateways.filter(g => g.status === 'active').length,
        configuredGateways: gateways.filter(g => ['active', 'configured'].includes(g.status)).length,
        pendingGateways: gateways.filter(g => g.status === 'pending').length,
      },
      generatedAt: new Date().toISOString(),
    };

    // Add statistics if requested
    if (includeStats) {
      const stats = await PaymentGatewayService.getGatewayStats();
      response.statistics = stats;
    }

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Payment gateways API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch payment gateways',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}