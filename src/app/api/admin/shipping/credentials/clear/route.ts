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
 * Following @CLAUDE.md systematic approach
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

    // Log the operation for audit trail
    await easyParcelCredentialsService.logCredentialOperation(
      'CLEAR',
      session.user.id,
      {
        userEmail: session.user.email,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      message: 'EasyParcel API credentials cleared successfully',
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