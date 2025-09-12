import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/db/prisma';
import { UserRole } from '@prisma/client';

// Get chat configuration
export async function GET() {
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

    // Get active chat configuration
    const config = await prisma.chatConfig.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        webhookUrl: true,
        webhookSecret: true, // In production, you might want to mask this
        apiKey: true,
        sessionTimeoutMinutes: true,
        maxMessageLength: true,
        rateLimitMessages: true,
        rateLimitWindowMs: true,
        queueEnabled: true,
        queueMaxRetries: true,
        queueRetryDelayMs: true,
        queueBatchSize: true,
        websocketEnabled: true,
        websocketPort: true,
        isActive: true,
        verified: true,
        lastHealthCheck: true,
        healthStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If no config exists, return default values
    if (!config) {
      const defaultConfig = {
        webhookUrl: '',
        webhookSecret: '',
        apiKey: '',
        sessionTimeoutMinutes: 30,
        maxMessageLength: 4000,
        rateLimitMessages: 20,
        rateLimitWindowMs: 60000,
        queueEnabled: true,
        queueMaxRetries: 3,
        queueRetryDelayMs: 5000,
        queueBatchSize: 10,
        websocketEnabled: true,
        websocketPort: 3001,
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

    return NextResponse.json({
      success: true,
      config: {
        ...config,
        lastHealthCheck: config.lastHealthCheck?.toISOString(),
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
      isConfigured: true,
    });

  } catch (error) {
    console.error('Chat config GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat configuration' },
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
      sessionTimeoutMinutes,
      maxMessageLength,
      rateLimitMessages,
      rateLimitWindowMs,
      queueEnabled,
      queueMaxRetries,
      queueRetryDelayMs,
      queueBatchSize,
      websocketEnabled,
      websocketPort,
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
        const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.');
        if (url.protocol !== 'https:' && !isLocalhost) {
          validationErrors.push('Webhook URL must use HTTPS protocol (HTTP allowed for localhost testing)');
        }
        
        // Check for n8n Cloud domains (common patterns)
        const validDomains = ['.n8n.cloud', '.app.n8n.io', 'localhost', '127.0.0.1'];
        const isValidDomain = validDomains.some(domain => 
          url.hostname.includes(domain) || url.hostname === domain.replace('.', '')
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
      validationErrors.push('Webhook secret must be at least 32 characters long');
    }

    // API key validation
    if (apiKey && apiKey.length < 16) {
      validationErrors.push('API key must be at least 16 characters long');
    }

    // Numeric field validation
    if (sessionTimeoutMinutes && (sessionTimeoutMinutes < 1 || sessionTimeoutMinutes > 1440)) {
      validationErrors.push('Session timeout must be between 1 and 1440 minutes');
    }

    if (maxMessageLength && (maxMessageLength < 1 || maxMessageLength > 10000)) {
      validationErrors.push('Max message length must be between 1 and 10000 characters');
    }

    if (rateLimitMessages && (rateLimitMessages < 1 || rateLimitMessages > 1000)) {
      validationErrors.push('Rate limit messages must be between 1 and 1000');
    }

    if (websocketPort && (websocketPort < 1024 || websocketPort > 65535)) {
      validationErrors.push('WebSocket port must be between 1024 and 65535');
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Configuration validation failed', 
          details: validationErrors 
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
          sessionTimeoutMinutes: sessionTimeoutMinutes || 30,
          maxMessageLength: maxMessageLength || 4000,
          rateLimitMessages: rateLimitMessages || 20,
          rateLimitWindowMs: rateLimitWindowMs || 60000,
          queueEnabled: queueEnabled !== undefined ? queueEnabled : true,
          queueMaxRetries: queueMaxRetries || 3,
          queueRetryDelayMs: queueRetryDelayMs || 5000,
          queueBatchSize: queueBatchSize || 10,
          websocketEnabled: websocketEnabled !== undefined ? websocketEnabled : true,
          websocketPort: websocketPort || 3001,
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
          sessionTimeoutMinutes: sessionTimeoutMinutes || 30,
          maxMessageLength: maxMessageLength || 4000,
          rateLimitMessages: rateLimitMessages || 20,
          rateLimitWindowMs: rateLimitWindowMs || 60000,
          queueEnabled: queueEnabled !== undefined ? queueEnabled : true,
          queueMaxRetries: queueMaxRetries || 3,
          queueRetryDelayMs: queueRetryDelayMs || 5000,
          queueBatchSize: queueBatchSize || 10,
          websocketEnabled: websocketEnabled !== undefined ? websocketEnabled : true,
          websocketPort: websocketPort || 3001,
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
      message: existingConfig ? 'Chat configuration updated successfully' : 'Chat configuration created successfully',
      config: {
        id: config.id,
        webhookUrl: config.webhookUrl,
        sessionTimeoutMinutes: config.sessionTimeoutMinutes,
        maxMessageLength: config.maxMessageLength,
        rateLimitMessages: config.rateLimitMessages,
        rateLimitWindowMs: config.rateLimitWindowMs,
        queueEnabled: config.queueEnabled,
        queueMaxRetries: config.queueMaxRetries,
        queueRetryDelayMs: config.queueRetryDelayMs,
        queueBatchSize: config.queueBatchSize,
        websocketEnabled: config.websocketEnabled,
        websocketPort: config.websocketPort,
        isActive: config.isActive,
        verified: config.verified,
        healthStatus: config.healthStatus,
      },
    });

  } catch (error) {
    console.error('Chat config POST error:', error);
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
      sessionId: 'test-session-' + Date.now(),
    };

    // Generate proper HMAC signature for the test payload
    const crypto = require('crypto');
    const payloadString = JSON.stringify(testPayload);
    const signature = 'sha256=' + crypto
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
          healthStatus: isHealthy ? 'HEALTHY' : `UNHEALTHY: ${response.status} ${statusText}`,
          lastHealthCheck: new Date(),
          updatedBy: session.user.email,
        },
      });

      return NextResponse.json({
        success: true,
        verified: isHealthy,
        status: response.status,
        statusText: statusText,
        message: isHealthy ? 'Webhook is responding correctly' : `Webhook test failed: ${response.status} ${statusText}`,
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