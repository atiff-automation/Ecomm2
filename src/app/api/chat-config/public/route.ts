/**
 * Public n8n Chat Configuration API
 * Returns chat config for frontend widget (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Chat Config Public API] Fetching chat configuration...');

    // Read all config fields from database (public endpoint - no auth required)
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'n8n_chat_webhook_url',
            'n8n_chat_enabled',
            'n8n_chat_position',
            'n8n_chat_primary_color',
            'n8n_chat_title',
            'n8n_chat_subtitle',
            'n8n_chat_welcome_message',
            'n8n_chat_input_placeholder',
          ],
        },
      },
    });

    console.log('🔍 [Chat Config Public API] Database configs found:', configs.length);
    console.log('🔍 [Chat Config Public API] Raw configs:', JSON.stringify(configs, null, 2));

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    console.log('🔍 [Chat Config Public API] Config map:', JSON.stringify(configMap, null, 2));

    const response = {
      webhookUrl: configMap['n8n_chat_webhook_url'] || '',
      isEnabled: configMap['n8n_chat_enabled'] !== 'false',
      position: configMap['n8n_chat_position'] || 'bottom-right',
      primaryColor: configMap['n8n_chat_primary_color'] || '#2563eb',
      title: configMap['n8n_chat_title'] || 'Chat Support',
      subtitle: configMap['n8n_chat_subtitle'] || "We're here to help",
      welcomeMessage: configMap['n8n_chat_welcome_message'] || 'Hello! 👋\nHow can I help you today?',
      inputPlaceholder: configMap['n8n_chat_input_placeholder'] || 'Type your message...',
      // TEMPORARY DEBUG INFO
      _debug: {
        totalConfigsFound: configs.length,
        configKeys: configs.map(c => c.key),
        rawEnabled: configMap['n8n_chat_enabled'],
        hasWebhookUrl: !!configMap['n8n_chat_webhook_url'],
      },
    };

    console.log('✅ [Chat Config Public API] Returning response:', JSON.stringify(response, null, 2));

    // Return with no-cache headers to prevent stale data
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('❌ [Chat Config Public API] Error getting public chat config:', error);
    return NextResponse.json(
      {
        webhookUrl: '',
        isEnabled: false,
        position: 'bottom-right',
        primaryColor: '#2563eb',
        title: 'Chat Support',
        subtitle: "We're here to help",
        welcomeMessage: 'Hello! 👋\nHow can I help you today?',
        inputPlaceholder: 'Type your message...',
      },
      { status: 200 } // Return 200 with default config instead of error
    );
  }
}
