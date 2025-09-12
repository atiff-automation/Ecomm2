import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';
import { generateWebhookSignature } from '@/lib/chat/security';
import { getChatConfig } from '@/lib/chat/config';
import { webhookService } from '@/lib/chat/webhook-service';

// Test webhook connectivity with n8n Cloud
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

    // Get active configuration
    const config = await getChatConfig();
    
    if (!config.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Chat configuration is not active'
      }, { status: 400 });
    }

    if (!config.webhookUrl) {
      return NextResponse.json({
        success: false,
        error: 'Webhook URL not configured'
      }, { status: 400 });
    }

    if (!config.webhookSecret) {
      return NextResponse.json({
        success: false,
        error: 'Webhook secret not configured'
      }, { status: 400 });
    }

    // Generate test payload following the standardized format from documentation
    const testPayload = {
      sessionId: `test-${Date.now()}`,
      messageId: `test-msg-${Date.now()}`,
      guestEmail: 'integration-test@example.com',
      timestamp: new Date().toISOString(),
      
      message: {
        content: '🔧 Integration Test Message - This is an automated test to verify n8n connectivity. Please respond with a confirmation message.',
        type: 'text' as const
      },
      
      userContext: {
        isAuthenticated: false,
        membershipLevel: 'guest' as const,
        membershipTotal: null,
        userInfo: null
      },
      
      sessionMetadata: {
        testType: 'integration-connectivity',
        source: 'admin-dashboard',
        timestamp: new Date().toISOString()
      }
    };

    // Generate security signature
    const signature = generateWebhookSignature(testPayload, config.webhookSecret);
    
    // Send test webhook to n8n
    const startTime = Date.now();
    let testResult;
    
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-API-Key': config.apiKey || '',
          'User-Agent': 'E-commerce-Chat-Test/1.0'
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      const responseTime = Date.now() - startTime;
      const responseText = await response.text();

      if (response.ok) {
        // Update configuration with successful test
        await prisma.chatConfig.update({
          where: { isActive: true },
          data: {
            verified: true,
            healthStatus: 'HEALTHY',
            lastHealthCheck: new Date(),
            updatedBy: session.user.email,
          }
        });

        testResult = {
          success: true,
          verified: true,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          responseSize: responseText.length,
          message: `✅ Connection successful! n8n responded in ${responseTime}ms`
        };

        // Log successful test
        console.log(`n8n integration test successful: ${config.webhookUrl} (${responseTime}ms)`);

      } else {
        // Update configuration with failed test
        await prisma.chatConfig.update({
          where: { isActive: true },
          data: {
            verified: false,
            healthStatus: `UNHEALTHY: HTTP ${response.status}`,
            lastHealthCheck: new Date(),
            updatedBy: session.user.email,
          }
        });

        testResult = {
          success: false,
          verified: false,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
          message: `❌ n8n webhook returned error status ${response.status}`
        };

        console.warn(`n8n integration test failed: ${response.status} ${response.statusText}`);
      }

    } catch (fetchError: any) {
      const responseTime = Date.now() - startTime;

      // Update configuration with connection error
      await prisma.chatConfig.update({
        where: { isActive: true },
        data: {
          verified: false,
          healthStatus: `CONNECTION_ERROR: ${fetchError.message}`,
          lastHealthCheck: new Date(),
          updatedBy: session.user.email,
        }
      });

      testResult = {
        success: false,
        verified: false,
        responseTime,
        error: fetchError.message,
        message: `❌ Connection failed: ${fetchError.message}`
      };

      console.error(`n8n integration test connection error:`, fetchError);
    }

    return NextResponse.json({
      ...testResult,
      testPayload: {
        url: config.webhookUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': 'sha256=[calculated]',
          'X-API-Key': '[configured]',
          'User-Agent': 'E-commerce-Chat-Test/1.0'
        },
        payloadSize: JSON.stringify(testPayload).length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('n8n integration test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to perform integration test',
        message: '❌ Internal server error during test'
      },
      { status: 500 }
    );
  }
}

// Get test history and metrics
export async function GET(request: NextRequest) {
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

    // Get current configuration
    const config = await getChatConfig();
    
    // Get webhook service health
    const webhookHealth = await webhookService.healthCheck();
    
    // Get recent webhook queue statistics
    const queueStats = await prisma.chatWebhookQueue.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0
    };

    for (const stat of queueStats) {
      const count = stat._count.status;
      stats[stat.status as keyof typeof stats] = count;
      stats.total += count;
    }

    // Calculate success rate
    const successRate = stats.total > 0 
      ? Math.round((stats.completed / stats.total) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      configuration: {
        isActive: config.isActive,
        verified: config.verified,
        healthStatus: config.healthStatus,
        lastHealthCheck: config.lastHealthCheck?.toISOString(),
        webhookUrl: config.webhookUrl ? '[CONFIGURED]' : null
      },
      webhookHealth: {
        status: webhookHealth.status,
        configStatus: webhookHealth.configStatus
      },
      queueMetrics: {
        ...stats,
        successRate: `${successRate}%`
      },
      testCapabilities: {
        connectivityTest: true,
        payloadValidation: true,
        securityVerification: true,
        performanceMetrics: true
      }
    });

  } catch (error) {
    console.error('Integration test status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test status' },
      { status: 500 }
    );
  }
}