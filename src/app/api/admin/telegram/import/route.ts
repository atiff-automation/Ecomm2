import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { encryptSensitiveData } from '@/lib/utils/encryption';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

interface ImportPayload {
  version: string;
  exportedAt: string;
  exportedBy?: string;
  includesSecrets?: boolean;
  configuration: {
    id?: string;
    botToken?: string;
    botUsername?: string;
    botName?: string;
    ordersChannelId?: string;
    ordersChannelName?: string;
    inventoryChannelId?: string;
    inventoryChannelName?: string;
    ordersEnabled: boolean;
    inventoryEnabled: boolean;
    isActive?: boolean;
  };
  metadata?: {
    configurationHash?: string;
    systemInfo?: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let importData: ImportPayload;

    if (contentType.includes('application/json')) {
      importData = await request.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const fileContent = await file.text();
      
      if (file.name.endsWith('.yml') || file.name.endsWith('.yaml')) {
        const yaml = require('yaml');
        importData = yaml.parse(fileContent);
      } else {
        importData = JSON.parse(fileContent);
      }
    } else {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const validationResult = validateImportData(importData);
    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: 'Invalid configuration format',
        details: validationResult.errors
      }, { status: 400 });
    }

    const config = importData.configuration;
    const currentTime = new Date().toISOString();

    try {
      await prisma.$transaction(async (tx) => {
        const configUpdates: Array<{ key: string; value: string }> = [
          { key: 'telegram_config_id', value: config.id || 'imported' },
          { key: 'telegram_imported_at', value: currentTime },
          { key: 'telegram_imported_by', value: session.user.email || 'unknown' },
          { key: 'telegram_bot_username', value: config.botUsername || '' },
          { key: 'telegram_bot_name', value: config.botName || '' },
          { key: 'telegram_orders_channel_id', value: config.ordersChannelId || '' },
          { key: 'telegram_orders_channel_name', value: config.ordersChannelName || '' },
          { key: 'telegram_inventory_channel_id', value: config.inventoryChannelId || '' },
          { key: 'telegram_inventory_channel_name', value: config.inventoryChannelName || '' },
          { key: 'telegram_orders_enabled', value: config.ordersEnabled.toString() },
          { key: 'telegram_inventory_enabled', value: config.inventoryEnabled.toString() },
          { key: 'telegram_is_active', value: (config.isActive !== false).toString() },
          { key: 'telegram_updated_at', value: currentTime }
        ];

        if (config.botToken) {
          const encryptedToken = await encryptSensitiveData(config.botToken);
          configUpdates.push({
            key: 'telegram_bot_token_encrypted',
            value: encryptedToken
          });
        }

        for (const update of configUpdates) {
          await tx.systemConfig.upsert({
            where: { key: update.key },
            create: update,
            update: { value: update.value }
          });
        }
      });

      const summary = {
        imported: true,
        timestamp: currentTime,
        importedBy: session.user.email,
        configuration: {
          botUsername: config.botUsername,
          botName: config.botName,
          ordersEnabled: config.ordersEnabled,
          inventoryEnabled: config.inventoryEnabled,
          hasSecrets: !!config.botToken,
          channelsConfigured: [
            config.ordersEnabled && config.ordersChannelId ? 'orders' : null,
            config.inventoryEnabled && config.inventoryChannelId ? 'inventory' : null
          ].filter(Boolean)
        },
        metadata: {
          originalExportDate: importData.exportedAt,
          originalExporter: importData.exportedBy,
          version: importData.version,
          configurationHash: importData.metadata?.configurationHash
        }
      };

      return NextResponse.json({
        success: true,
        message: 'Configuration imported successfully',
        summary
      });

    } catch (dbError) {
      console.error('Database error during import:', dbError);
      return NextResponse.json({ 
        error: 'Import failed',
        details: 'Database transaction failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Configuration import error:', error);
    return NextResponse.json({ 
      error: 'Import failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function validateImportData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format');
    return { valid: false, errors };
  }

  if (!data.version) {
    errors.push('Missing version field');
  }

  if (!data.configuration || typeof data.configuration !== 'object') {
    errors.push('Missing or invalid configuration object');
    return { valid: false, errors };
  }

  const config = data.configuration;

  if (typeof config.ordersEnabled !== 'boolean') {
    errors.push('ordersEnabled must be a boolean');
  }

  if (typeof config.inventoryEnabled !== 'boolean') {
    errors.push('inventoryEnabled must be a boolean');
  }

  if (config.ordersEnabled && !config.ordersChannelId) {
    errors.push('ordersChannelId is required when orders are enabled');
  }

  if (config.inventoryEnabled && !config.inventoryChannelId) {
    errors.push('inventoryChannelId is required when inventory is enabled');
  }

  if (config.botUsername && !/^[a-zA-Z0-9_]{5,32}$/.test(config.botUsername)) {
    errors.push('Invalid bot username format');
  }

  return { valid: errors.length === 0, errors };
}