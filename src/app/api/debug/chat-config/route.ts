/**
 * Temporary Debug Endpoint for Chat Config
 * Shows raw database values for troubleshooting
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all system config entries
    const allConfigs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'n8n_chat',
        },
      },
      orderBy: {
        key: 'asc',
      },
    });

    // Get the specific keys we need
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
      debug: true,
      timestamp: new Date().toISOString(),
      databaseRecords: {
        found: configs.length,
        allN8nConfigs: allConfigs,
        specificConfigs: configs,
      },
      configMap,
      parsedValues: {
        webhookUrl: configMap['n8n_chat_webhook_url'] || '(not set)',
        isEnabled: configMap['n8n_chat_enabled'] || '(not set)',
        isEnabledParsed: configMap['n8n_chat_enabled'] !== 'false',
        position: configMap['n8n_chat_position'] || '(not set)',
        primaryColor: configMap['n8n_chat_primary_color'] || '(not set)',
        title: configMap['n8n_chat_title'] || '(not set)',
        subtitle: configMap['n8n_chat_subtitle'] || '(not set)',
        welcomeMessage: configMap['n8n_chat_welcome_message'] || '(not set)',
        inputPlaceholder: configMap['n8n_chat_input_placeholder'] || '(not set)',
      },
      recommendation: configs.length === 0
        ? 'No chat config found in database. Please save configuration in admin panel.'
        : 'Configuration found. Check if webhook URL and isEnabled are correct.',
    });
  } catch (error) {
    return NextResponse.json({
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
