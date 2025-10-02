import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

// Get chat configuration
export async function GET() {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${requestId}] Admin chat config GET request started`);

    const session = await getServerSession(authOptions);
    console.log(`[${requestId}] Session check completed:`, {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email || 'none',
      userRole: (session?.user as any)?.role || 'none',
    });

    if (!session?.user) {
      console.log(`[${requestId}] Authentication failed - no session/user`);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    const allowedRoles = [UserRole.SUPERADMIN, UserRole.ADMIN];

    if (!allowedRoles.includes(userRole)) {
      console.log(
        `[${requestId}] Authorization failed - insufficient role:`,
        userRole
      );
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    console.log(
      `[${requestId}] Authentication/authorization successful, querying database...`
    );

    // Get active chat configuration
    const config = await prisma.chatConfig.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        webhookUrl: true,
        webhookSecret: true, // In production, you might want to mask this
        apiKey: true,
        sessionTimeoutMinutes: true, // Keep for backward compatibility
        guestSessionTimeoutMinutes: true,
        authenticatedSessionTimeoutMinutes: true,
        maxMessageLength: true,
        rateLimitMessages: true,
        rateLimitWindowMs: true,
        queueEnabled: true,
        queueMaxRetries: true,
        queueRetryDelayMs: true,
        queueBatchSize: true,
        welcomeMessage: true,
        agentName: true,
        botIconUrl: true,
        isActive: true,
        verified: true,
        lastHealthCheck: true,
        healthStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`[${requestId}] Database query completed:`, {
      configFound: !!config,
      configId: config?.id || 'none',
      webhookUrl: config?.webhookUrl || 'none',
      welcomeMessage: config?.welcomeMessage || 'none',
      agentName: config?.agentName || 'none',
    });

    // If no config exists, return default values
    if (!config) {
      console.log(
        `[${requestId}] No config found in database, returning defaults`
      );
      console.warn(
        `[${requestId}] WARNING: Expected to find active chat configuration but none exists. This indicates a data issue.`
      );
      const defaultConfig = {
        webhookUrl: '',
        webhookSecret: '',
        apiKey: '',
        sessionTimeoutMinutes: 30, // Backward compatibility
        guestSessionTimeoutMinutes: 13, // Match database default
        authenticatedSessionTimeoutMinutes: 19, // Match database default
        maxMessageLength: 4000,
        rateLimitMessages: 20,
        rateLimitWindowMs: 60000,
        queueEnabled: true,
        queueMaxRetries: 3,
        queueRetryDelayMs: 5000,
        queueBatchSize: 10,
        welcomeMessage: 'Hi! How can we help you today?',
        agentName: 'Customer Support',
        botIconUrl: null,
        isActive: false,
        verified: false,
        healthStatus: 'NOT_CONFIGURED',
      };

      return NextResponse.json({
        success: true,
        config: defaultConfig,
        isConfigured: false,
      });
    }

    console.log(`[${requestId}] Config found, preparing successful response:`, {
      configId: config.id,
      hasWebhookUrl: !!config.webhookUrl,
      hasWelcomeMessage: !!config.welcomeMessage,
      hasAgentName: !!config.agentName,
      isActive: config.isActive,
      verified: config.verified,
    });

    const response = {
      success: true,
      config: {
        ...config,
        lastHealthCheck: config.lastHealthCheck?.toISOString(),
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
      isConfigured: true,
    };

    console.log(
      `[${requestId}] Admin chat config GET request completed successfully`
    );
    return NextResponse.json(response);
  } catch (error) {
    console.error(`[${requestId}] Chat config GET error:`, error);
    console.error(`[${requestId}] Error details:`, {
      name: (error as Error).name,
      message: (error as Error).message,
      code: (error as any).code,
      meta: (error as any).meta,
      stack: (error as Error).stack,
      timestamp: new Date().toISOString(),
    });

    // Return more detailed error information for debugging
    return NextResponse.json(
      {
        error: 'Failed to fetch chat configuration',
        debug:
          process.env.NODE_ENV === 'development'
            ? {
                message: (error as Error).message,
                requestId: requestId,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Create or update chat configuration
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
    const {
      webhookUrl,
      webhookSecret,
      apiKey,
      sessionTimeoutMinutes, // Keep for backward compatibility
      guestSessionTimeoutMinutes,
      authenticatedSessionTimeoutMinutes,
      maxMessageLength,
      rateLimitMessages,
      rateLimitWindowMs,
      queueEnabled,
      queueMaxRetries,
      queueRetryDelayMs,
      queueBatchSize,
      welcomeMessage,
      agentName,
      botIconUrl,
    } = body;

    // Enhanced validation following CLAUDE.md systematic approach
    const validationErrors: string[] = [];

    // Required field validation
    if (!webhookUrl) validationErrors.push('Webhook URL is required');
    if (!webhookSecret) validationErrors.push('Webhook secret is required');
    if (!apiKey) validationErrors.push('API key is required');

    // Webhook URL validation
    if (webhookUrl) {
      try {
        const url = new URL(webhookUrl);

        // Ensure it's HTTPS for n8n Cloud security (allow HTTP for localhost testing)
        const isLocalhost =
          url.hostname === 'localhost' ||
          url.hostname === '127.0.0.1' ||
          url.hostname.startsWith('192.168.');
        if (url.protocol !== 'https:' && !isLocalhost) {
          validationErrors.push(
            'Webhook URL must use HTTPS protocol (HTTP allowed for localhost testing)'
          );
        }

        // Check for n8n Cloud domains (common patterns)
        const validDomains = [
          '.n8n.cloud',
          '.app.n8n.io',
          'localhost',
          '127.0.0.1',
        ];
        const isValidDomain = validDomains.some(
          domain =>
            url.hostname.includes(domain) ||
            url.hostname === domain.replace('.', '')
        );

        if (!isValidDomain && !url.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          console.warn(`Webhook URL uses non-standard domain: ${url.hostname}`);
        }
      } catch {
        validationErrors.push('Invalid webhook URL format');
      }
    }

    // Webhook secret validation
    if (webhookSecret && webhookSecret.length < 32) {
      validationErrors.push(
        'Webhook secret must be at least 32 characters long'
      );
    }

    // API key validation
    if (apiKey && apiKey.length < 16) {
      validationErrors.push('API key must be at least 16 characters long');
    }

    // Numeric field validation
    if (
      sessionTimeoutMinutes &&
      (sessionTimeoutMinutes < 1 || sessionTimeoutMinutes > 1440)
    ) {
      validationErrors.push(
        'Session timeout must be between 1 and 1440 minutes'
      );
    }

    if (
      guestSessionTimeoutMinutes &&
      (guestSessionTimeoutMinutes < 1 || guestSessionTimeoutMinutes > 1440)
    ) {
      validationErrors.push(
        'Guest session timeout must be between 1 and 1440 minutes'
      );
    }

    if (
      authenticatedSessionTimeoutMinutes &&
      (authenticatedSessionTimeoutMinutes < 1 ||
        authenticatedSessionTimeoutMinutes > 1440)
    ) {
      validationErrors.push(
        'Authenticated session timeout must be between 1 and 1440 minutes'
      );
    }

    if (
      maxMessageLength &&
      (maxMessageLength < 1 || maxMessageLength > 10000)
    ) {
      validationErrors.push(
        'Max message length must be between 1 and 10000 characters'
      );
    }

    if (
      rateLimitMessages &&
      (rateLimitMessages < 1 || rateLimitMessages > 1000)
    ) {
      validationErrors.push('Rate limit messages must be between 1 and 1000');
    }

    if (welcomeMessage && welcomeMessage.length > 500) {
      validationErrors.push('Welcome message must be 500 characters or less');
    }

    if (agentName && agentName.length > 100) {
      validationErrors.push('Agent name must be 100 characters or less');
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Configuration validation failed',
          details: validationErrors,
        },
        { status: 400 }
      );
    }

    // Check if configuration already exists
    const existingConfig = await prisma.chatConfig.findFirst({
      where: { isActive: true },
    });

    let config;

    if (existingConfig) {
      // Update existing configuration
      config = await prisma.chatConfig.update({
        where: { id: existingConfig.id },
        data: {
          webhookUrl,
          webhookSecret,
          apiKey,
          sessionTimeoutMinutes: sessionTimeoutMinutes || 30, // Backward compatibility
          guestSessionTimeoutMinutes: guestSessionTimeoutMinutes || 13, // Match database default
          authenticatedSessionTimeoutMinutes:
            authenticatedSessionTimeoutMinutes || 19, // Match database default
          maxMessageLength: maxMessageLength || 4000,
          rateLimitMessages: rateLimitMessages || 20,
          rateLimitWindowMs: rateLimitWindowMs || 60000,
          queueEnabled: queueEnabled !== undefined ? queueEnabled : true,
          queueMaxRetries: queueMaxRetries || 3,
          queueRetryDelayMs: queueRetryDelayMs || 5000,
          queueBatchSize: queueBatchSize || 10,
          welcomeMessage: welcomeMessage || 'Hi! How can we help you today?',
          agentName: agentName || 'Customer Support',
          botIconUrl: botIconUrl || null,
          updatedBy: session.user.email,
          verified: false, // Reset verification when config changes
          healthStatus: 'PENDING_VERIFICATION',
        },
      });
    } else {
      // Create new configuration
      config = await prisma.chatConfig.create({
        data: {
          webhookUrl,
          webhookSecret,
          apiKey,
          sessionTimeoutMinutes: sessionTimeoutMinutes || 30, // Backward compatibility
          guestSessionTimeoutMinutes: guestSessionTimeoutMinutes || 13, // Match database default
          authenticatedSessionTimeoutMinutes:
            authenticatedSessionTimeoutMinutes || 19, // Match database default
          maxMessageLength: maxMessageLength || 4000,
          rateLimitMessages: rateLimitMessages || 20,
          rateLimitWindowMs: rateLimitWindowMs || 60000,
          queueEnabled: queueEnabled !== undefined ? queueEnabled : true,
          queueMaxRetries: queueMaxRetries || 3,
          queueRetryDelayMs: queueRetryDelayMs || 5000,
          queueBatchSize: queueBatchSize || 10,
          welcomeMessage: welcomeMessage || 'Hi! How can we help you today?',
          agentName: agentName || 'Customer Support',
          botIconUrl: botIconUrl || null,
          isActive: true,
          verified: false,
          healthStatus: 'PENDING_VERIFICATION',
          createdBy: session.user.email,
          updatedBy: session.user.email,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: existingConfig
        ? 'Chat configuration updated successfully'
        : 'Chat configuration created successfully',
      config: {
        id: config.id,
        webhookUrl: config.webhookUrl,
        sessionTimeoutMinutes: config.sessionTimeoutMinutes, // Backward compatibility
        guestSessionTimeoutMinutes: config.guestSessionTimeoutMinutes,
        authenticatedSessionTimeoutMinutes:
          config.authenticatedSessionTimeoutMinutes,
        maxMessageLength: config.maxMessageLength,
        rateLimitMessages: config.rateLimitMessages,
        rateLimitWindowMs: config.rateLimitWindowMs,
        queueEnabled: config.queueEnabled,
        queueMaxRetries: config.queueMaxRetries,
        queueRetryDelayMs: config.queueRetryDelayMs,
        queueBatchSize: config.queueBatchSize,
        welcomeMessage: config.welcomeMessage,
        agentName: config.agentName,
        botIconUrl: config.botIconUrl,
        isActive: config.isActive,
        verified: config.verified,
        healthStatus: config.healthStatus,
      },
    });
  } catch (error) {
    console.error('Chat config POST error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Failed to save chat configuration' },
      { status: 500 }
    );
  }
}

// Test webhook connectivity
export async function PATCH(request: NextRequest) {
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

    const config = await prisma.chatConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'No active chat configuration found' },
        { status: 404 }
      );
    }

    // Test webhook by sending a test payload
    const testPayload = {
      type: 'health_check',
      timestamp: new Date().toISOString(),
      message: 'Chat system health check',
      sessionId: 'cm000000000000000000000', // Valid CUID format for health check
    };

    // Generate proper HMAC signature for the test payload
    const crypto = require('crypto');
    const payloadString = JSON.stringify(testPayload);
    const signature =
      'sha256=' +
      crypto
        .createHmac('sha256', config.webhookSecret || '')
        .update(payloadString, 'utf8')
        .digest('hex');

    try {
      const response = await fetch(config.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-API-Key': config.apiKey || '',
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const isHealthy = response.ok;
      const statusText = response.statusText;

      // Update configuration with health check results
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

      return NextResponse.json({
        success: true,
        verified: isHealthy,
        status: response.status,
        statusText: statusText,
        message: isHealthy
          ? 'Webhook is responding correctly'
          : `Webhook test failed: ${response.status} ${statusText}`,
        lastHealthCheck: new Date().toISOString(),
      });
    } catch (fetchError: any) {
      // Update configuration with error status
      await prisma.chatConfig.update({
        where: { id: config.id },
        data: {
          verified: false,
          healthStatus: `CONNECTION_ERROR: ${fetchError.message}`,
          lastHealthCheck: new Date(),
          updatedBy: session.user.email,
        },
      });

      return NextResponse.json({
        success: false,
        verified: false,
        error: fetchError.message,
        message: 'Failed to connect to webhook URL',
        lastHealthCheck: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Chat config health check error:', error);
    return NextResponse.json(
      { error: 'Failed to perform health check' },
      { status: 500 }
    );
  }
}
