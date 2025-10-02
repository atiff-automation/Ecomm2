import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN];

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { webhookUrl, webhookSecret, apiKey } = body;

    if (!webhookUrl || !webhookSecret || !apiKey) {
      return NextResponse.json(
        { error: 'Webhook URL, secret, and API key are required for testing' },
        { status: 400 }
      );
    }

    // Test webhook by sending a test payload
    const testPayload = {
      type: 'health_check',
      timestamp: new Date().toISOString(),
      message: 'Chat system health check',
      sessionId: 'test-session-' + Date.now(),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhookSecret,
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const isHealthy = response.ok;
      const statusText = response.statusText;

      // Update configuration with health check results if there's an active config
      const config = await prisma.chatConfig.findFirst({
        where: { isActive: true },
      });

      if (config) {
        await prisma.chatConfig.update({
          where: { id: config.id },
          data: {
            verified: isHealthy,
            healthStatus: isHealthy
              ? 'HEALTHY'
              : `UNHEALTHY: ${response.status} ${statusText}`,
            lastHealthCheck: new Date(),
            updatedBy: session.user.email,
          },
        });
      }

      return NextResponse.json({
        success: true,
        verified: isHealthy,
        status: response.status,
        statusText: statusText,
        healthStatus: isHealthy
          ? 'HEALTHY'
          : `UNHEALTHY: ${response.status} ${statusText}`,
        message: isHealthy
          ? 'Webhook is responding correctly'
          : `Webhook test failed: ${response.status} ${statusText}`,
        lastHealthCheck: new Date().toISOString(),
      });
    } catch (fetchError: any) {
      // Update configuration with error status if there's an active config
      const config = await prisma.chatConfig.findFirst({
        where: { isActive: true },
      });

      if (config) {
        await prisma.chatConfig.update({
          where: { id: config.id },
          data: {
            verified: false,
            healthStatus: `CONNECTION_ERROR: ${fetchError.message}`,
            lastHealthCheck: new Date(),
            updatedBy: session.user.email,
          },
        });
      }

      return NextResponse.json({
        success: false,
        verified: false,
        error: fetchError.message,
        healthStatus: `CONNECTION_ERROR: ${fetchError.message}`,
        message: 'Failed to connect to webhook URL',
        lastHealthCheck: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Chat config test error:', error);
    return NextResponse.json(
      { error: 'Failed to perform health check' },
      { status: 500 }
    );
  }
}
