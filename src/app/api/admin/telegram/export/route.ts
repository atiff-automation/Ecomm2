import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { decryptSensitiveData } from '@/lib/utils/encryption';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

interface TelegramConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
  botUsername?: string;
  botName?: string;
  ordersChannelId?: string;
  ordersChannelName?: string;
  inventoryChannelId?: string;
  inventoryChannelName?: string;
  ordersEnabled: boolean;
  inventoryEnabled: boolean;
  isActive: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeSecrets = searchParams.get('secrets') === 'true';
    const format = searchParams.get('format') || 'json';

    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'telegram_'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (configs.length === 0) {
      return NextResponse.json({ 
        error: 'No configuration found',
        message: 'Please complete the setup wizard first'
      }, { status: 404 });
    }

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    const exportData: TelegramConfig = {
      id: configMap.telegram_config_id || 'default',
      createdAt: configMap.telegram_created_at || new Date().toISOString(),
      updatedAt: configMap.telegram_updated_at || new Date().toISOString(),
      botUsername: configMap.telegram_bot_username,
      botName: configMap.telegram_bot_name,
      ordersChannelId: configMap.telegram_orders_channel_id,
      ordersChannelName: configMap.telegram_orders_channel_name,
      inventoryChannelId: configMap.telegram_inventory_channel_id,
      inventoryChannelName: configMap.telegram_inventory_channel_name,
      ordersEnabled: configMap.telegram_orders_enabled === 'true',
      inventoryEnabled: configMap.telegram_inventory_enabled === 'true',
      isActive: configMap.telegram_is_active === 'true'
    };

    const exportPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: session.user.email,
      includesSecrets: includeSecrets,
      configuration: exportData,
      metadata: {
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform
        },
        configurationHash: generateConfigHash(exportData)
      }
    };

    if (includeSecrets && configMap.telegram_bot_token_encrypted) {
      try {
        const decryptedToken = await decryptSensitiveData(configMap.telegram_bot_token_encrypted);
        (exportPayload.configuration as any).botToken = decryptedToken;
      } catch (error) {
        console.error('Failed to decrypt bot token for export:', error);
      }
    }

    if (format === 'yaml') {
      const yamlContent = convertToYaml(exportPayload);
      return new Response(yamlContent, {
        headers: {
          'Content-Type': 'application/x-yaml',
          'Content-Disposition': `attachment; filename="telegram-config-${Date.now()}.yml"`
        }
      });
    }

    return NextResponse.json(exportPayload, {
      headers: {
        'Content-Disposition': `attachment; filename="telegram-config-${Date.now()}.json"`
      }
    });

  } catch (error) {
    console.error('Configuration export error:', error);
    return NextResponse.json({ 
      error: 'Export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateConfigHash(config: TelegramConfig): string {
  const crypto = require('crypto');
  const configString = JSON.stringify(config, Object.keys(config).sort());
  return crypto.createHash('sha256').update(configString).digest('hex').substring(0, 16);
}

function convertToYaml(obj: any): string {
  const yaml = require('yaml');
  return yaml.stringify(obj, {
    indent: 2,
    lineWidth: 100
  });
}