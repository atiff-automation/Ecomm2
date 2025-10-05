/**
 * Public n8n Chat Configuration API
 * Returns chat config for frontend widget (no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
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

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      webhookUrl: configMap['n8n_chat_webhook_url'] || '',
      isEnabled: configMap['n8n_chat_enabled'] !== 'false',
      position: configMap['n8n_chat_position'] || 'bottom-right',
      primaryColor: configMap['n8n_chat_primary_color'] || '#2563eb',
      title: configMap['n8n_chat_title'] || 'Chat Support',
      subtitle: configMap['n8n_chat_subtitle'] || "We're here to help",
      welcomeMessage: configMap['n8n_chat_welcome_message'] || 'Hello! 👋\nHow can I help you today?',
      inputPlaceholder: configMap['n8n_chat_input_placeholder'] || 'Type your message...',
    });
  } catch (error) {
    console.error('Error getting public chat config:', error);
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
