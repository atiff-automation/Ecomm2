/**

export const dynamic = 'force-dynamic';

 * Admin Shipping System Health Check API
 * Monitors system health for database, EasyParcel API, and authentication
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { easyParcelCredentialsService } from '@/lib/services/easyparcel-credentials';

interface SystemHealth {
  database: boolean;
  easyParcelApi: boolean;
  authService: boolean;
  lastChecked: string;
}

/**
 * GET - Check system health
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const health: SystemHealth = {
      database: false,
      easyParcelApi: false,
      authService: false,
      lastChecked: new Date().toISOString(),
    };

    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
      health.database = false;
    }

    // Check EasyParcel API connectivity using centralized credential service
    try {
      const credentials = await easyParcelCredentialsService.getCredentialsForService();

      if (credentials) {
        // Use the correct EasyParcel API format for health check
        const endpoint = credentials.endpoint;

        const formData = new URLSearchParams();
        formData.append('api', credentials.apiKey);

        const response = await fetch(`${endpoint}/?ac=EPCheckCreditBalance`, {
          method: 'POST',
          body: formData.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          // Short timeout for health check
          signal: AbortSignal.timeout(5000),
        });

        // Check if response is successful and contains valid API response
        if (response.ok) {
          const responseText = await response.text();
          let isValidResponse = false;

          try {
            const data = JSON.parse(responseText);
            isValidResponse = data.api_status === 'Success';
          } catch {
            // If not JSON, check for empty response (also indicates success for some endpoints)
            isValidResponse = !responseText || responseText.trim().length === 0;
          }

          health.easyParcelApi = isValidResponse;
        } else {
          health.easyParcelApi = false;
        }

        console.log(`🔍 Health check: EasyParcel API ${health.easyParcelApi ? 'available' : 'unavailable'} (${credentials.source}, ${endpoint})`);
      } else {
        // No credentials configured - production mode enforces this properly
        health.easyParcelApi = false;
        console.log('🔍 Health check: EasyParcel API unavailable - no credentials configured');
      }
    } catch (error) {
      console.error('EasyParcel API health check failed:', error);
      health.easyParcelApi = false;
    }

    // Check authentication service (if we can get a session, auth is working)
    health.authService = !!session;

    return NextResponse.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error('❌ System health check error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check system health',
        message: error instanceof Error ? error.message : 'Unknown error',
        health: {
          database: false,
          easyParcelApi: false,
          authService: false,
          lastChecked: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}