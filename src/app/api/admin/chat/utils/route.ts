import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { UserRole } from '@prisma/client';
import { webhookService } from '@/lib/chat/webhook-service';
import { getChatConfig } from '@/lib/chat/config';

// Generate webhook utilities (secrets, API keys, validation)
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
    const { action, webhookUrl } = body;

    switch (action) {
      case 'generate_secret':
        return NextResponse.json({
          success: true,
          secret: webhookService.generateWebhookSecret(),
        });

      case 'generate_api_key':
        return NextResponse.json({
          success: true,
          apiKey: webhookService.generateApiKey(),
        });

      case 'validate_url':
        if (!webhookUrl) {
          return NextResponse.json(
            { error: 'Webhook URL is required for validation' },
            { status: 400 }
          );
        }

        const validation = webhookService.validateWebhookUrl(webhookUrl);
        return NextResponse.json({
          success: true,
          validation,
        });

      case 'generate_setup_instructions':
        const { webhookSecret, apiKey } = body;

        if (!webhookUrl || !webhookSecret || !apiKey) {
          return NextResponse.json(
            { error: 'webhookUrl, webhookSecret, and apiKey are required' },
            { status: 400 }
          );
        }

        const setupInstructions = webhookService.generateSetupInstructions(
          webhookUrl,
          webhookSecret,
          apiKey
        );

        return NextResponse.json({
          success: true,
          setup: setupInstructions,
        });

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Supported actions: generate_secret, generate_api_key, validate_url, generate_setup_instructions',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Webhook utilities error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook utility request' },
      { status: 500 }
    );
  }
}

// Get current webhook configuration and utilities
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

    // Generate example setup instructions if configuration exists
    let exampleSetup = null;
    if (config.webhookUrl && config.webhookSecret && config.apiKey) {
      exampleSetup = webhookService.generateSetupInstructions(
        config.webhookUrl,
        config.webhookSecret,
        config.apiKey
      );
    }

    return NextResponse.json({
      success: true,
      configuration: {
        hasWebhookUrl: !!config.webhookUrl,
        hasWebhookSecret: !!config.webhookSecret,
        hasApiKey: !!config.apiKey,
        isActive: config.isActive,
        verified: config.verified,
        healthStatus: config.healthStatus,
      },
      utilities: {
        secretLength: 64,
        apiKeyLength: 32,
        supportedDomains: [
          '.n8n.cloud',
          '.app.n8n.io',
          'localhost',
          '127.0.0.1',
        ],
        requiredHeaders: ['X-Webhook-Signature', 'X-API-Key', 'Content-Type'],
        signatureAlgorithm: 'HMAC-SHA256',
      },
      exampleSetup,
    });
  } catch (error) {
    console.error('Webhook utilities GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook utilities' },
      { status: 500 }
    );
  }
}
