/**
 * n8n Chat Configuration API
 * Saves chat webhook URL and UI customization to database (SystemConfig)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      webhookUrl,
      isEnabled,
      position,
      primaryColor,
      title,
      subtitle,
      welcomeMessage,
      inputPlaceholder,
    } = body;

    // Allow empty webhook URL for clearing configuration
    // But if provided, it must be a valid URL
    if (webhookUrl && !webhookUrl.startsWith('http')) {
      return NextResponse.json(
        { error: 'Invalid webhook URL. Must start with http:// or https://' },
        { status: 400 }
      );
    }

    // Save webhook URL to database
    if (webhookUrl) {
      await prisma.systemConfig.upsert({
        where: { key: 'n8n_chat_webhook_url' },
        create: {
          key: 'n8n_chat_webhook_url',
          value: webhookUrl,
          type: 'string',
        },
        update: {
          value: webhookUrl,
        },
      });
    } else {
      // Delete webhook URL if empty (clear configuration)
      await prisma.systemConfig.deleteMany({
        where: { key: 'n8n_chat_webhook_url' },
      });
    }

    // Save all configuration fields
    const configFields = [
      { key: 'n8n_chat_enabled', value: String(isEnabled), type: 'boolean' },
      { key: 'n8n_chat_position', value: position || 'bottom-right', type: 'string' },
      { key: 'n8n_chat_primary_color', value: primaryColor || '#2563eb', type: 'string' },
      { key: 'n8n_chat_title', value: title || 'Chat Support', type: 'string' },
      { key: 'n8n_chat_subtitle', value: subtitle || "We're here to help", type: 'string' },
      { key: 'n8n_chat_welcome_message', value: welcomeMessage || 'Hello! 👋\nHow can I help you today?', type: 'string' },
      { key: 'n8n_chat_input_placeholder', value: inputPlaceholder || 'Type your message...', type: 'string' },
    ];

    await Promise.all(
      configFields.map(({ key, value, type }) =>
        prisma.systemConfig.upsert({
          where: { key },
          create: { key, value, type },
          update: { value },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: webhookUrl
        ? 'Configuration saved successfully. Changes take effect immediately.'
        : 'Configuration cleared successfully.',
    });
  } catch (error) {
    console.error('Error saving chat config:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Read all config fields from database
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
    console.error('Error getting chat config:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}
