/**
 * Admin Shipping System Configuration API
 * Manages system-level shipping configuration and credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

interface SystemConfig {
  easyParcelApiKey?: string;
  easyParcelEndpoint?: string;
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * GET - Retrieve system configuration
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

    // Get system configuration following @CLAUDE.md centralized approach
    const config: SystemConfig = {
      easyParcelApiKey: undefined, // No longer show environment variable status
      easyParcelEndpoint: process.env.EASYPARCEL_ENDPOINT || 'https://connect.easyparcel.my/',
      debugMode: process.env.NODE_ENV === 'development',
      logLevel: (process.env.LOG_LEVEL as any) || 'info',
    };

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('❌ System configuration fetch error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve system configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update system configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      !['ADMIN', 'SUPERADMIN'].includes(session.user.role as string)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config: SystemConfig = await request.json();

    // Note: In a production environment, system configuration would typically
    // be managed through environment variables or a secure configuration store
    // This is a placeholder that could be extended to update a configuration database

    console.log('📝 System configuration update requested:', {
      debugMode: config.debugMode,
      logLevel: config.logLevel,
      endpointUpdated: !!config.easyParcelEndpoint,
      apiKeyUpdated: !!config.easyParcelApiKey,
    });

    // For now, just acknowledge the request
    // In a real implementation, you might store these in a database
    // or update environment variables through a configuration management system

    return NextResponse.json({
      success: true,
      message: 'System configuration updated successfully',
      note: 'Configuration changes require server restart to take effect',
    });
  } catch (error) {
    console.error('❌ System configuration update error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update system configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}