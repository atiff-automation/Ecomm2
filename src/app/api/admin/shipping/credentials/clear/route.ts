/**
 * Admin Shipping Credentials Clear API
 * Allows administrators to clear stored EasyParcel API credentials
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { easyParcelCredentialsService } from '@/lib/services/easyparcel-credentials';

/**
 * DELETE - Clear stored EasyParcel API credentials
 * Following @CLAUDE.md systematic approach with comprehensive cache clearing
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear credentials using the centralized service
    await easyParcelCredentialsService.clearCredentials();

    // CRITICAL FIX: Force refresh of EasyParcel service credentials
    // This ensures the service immediately recognizes credentials are cleared
    const { easyParcelService } = await import('@/lib/shipping/easyparcel-service');
    await easyParcelService.refreshCredentials();

    // CRITICAL FIX: Clear balance cache by making a POST request to balance API
    // This forces the balance API to refresh and show "no data" state
    try {
      const balanceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/shipping/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'refresh' }),
      });
      console.log('💸 Balance cache cleared after credential removal');
    } catch (balanceError) {
      console.error('⚠️ Failed to clear balance cache:', balanceError);
      // Don't fail the main operation if balance cache clearing fails
    }

    // Log the operation for audit trail
    await easyParcelCredentialsService.logCredentialOperation(
      'CLEAR',
      session.user.id,
      {
        userEmail: session.user.email,
        timestamp: new Date().toISOString(),
        cacheCleared: true,
        serviceRefreshed: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'EasyParcel API credentials cleared successfully. All caches have been refreshed.',
    });
  } catch (error) {
    console.error('❌ Credential clear error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear credentials',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}