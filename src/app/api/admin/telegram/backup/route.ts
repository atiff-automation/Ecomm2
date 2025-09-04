import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { decryptSensitiveData } from '@/lib/utils/encryption';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

interface BackupRecord {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  size: number;
  version: string;
  metadata: {
    configurationHash: string;
    systemInfo: {
      nodeVersion: string;
      platform: string;
    };
    backupType: 'manual' | 'scheduled' | 'pre-update';
  };
}

interface BackupConfiguration {
  id: string;
  createdAt: string;
  updatedAt: string;
  botUsername?: string;
  botName?: string;
  botToken?: string;
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
    const backupId = searchParams.get('id');
    const includeData = searchParams.get('data') === 'true';

    if (backupId) {
      // Get specific backup
      const backup = await prisma.systemConfig.findUnique({
        where: { key: `telegram_backup_${backupId}` }
      });

      if (!backup) {
        return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
      }

      try {
        const backupData = JSON.parse(backup.value);
        
        if (includeData) {
          return NextResponse.json(backupData);
        } else {
          const { configuration, ...metadata } = backupData;
          return NextResponse.json(metadata);
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid backup data' }, { status: 500 });
      }
    } else {
      // List all backups
      const backups = await prisma.systemConfig.findMany({
        where: {
          key: {
            startsWith: 'telegram_backup_'
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      const backupList: BackupRecord[] = backups.map(backup => {
        try {
          const backupData = JSON.parse(backup.value);
          return {
            id: backup.key.replace('telegram_backup_', ''),
            name: backupData.name || 'Unnamed Backup',
            description: backupData.description,
            createdAt: backupData.createdAt,
            createdBy: backupData.createdBy,
            size: JSON.stringify(backupData).length,
            version: backupData.version,
            metadata: backupData.metadata
          };
        } catch (error) {
          return null;
        }
      }).filter(Boolean) as BackupRecord[];

      return NextResponse.json({
        backups: backupList,
        total: backupList.length
      });
    }

  } catch (error) {
    console.error('Backup retrieval error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve backups',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, backupType = 'manual' } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Backup name is required' }, { status: 400 });
    }

    // Get current configuration
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'telegram_'
        }
      }
    });

    if (configs.length === 0) {
      return NextResponse.json({ 
        error: 'No configuration found to backup',
        message: 'Complete the setup wizard first'
      }, { status: 404 });
    }

    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.value;
      return acc;
    }, {} as Record<string, string>);

    // Build configuration object
    const configuration: BackupConfiguration = {
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

    // Include bot token if available
    if (configMap.telegram_bot_token_encrypted) {
      try {
        const decryptedToken = await decryptSensitiveData(configMap.telegram_bot_token_encrypted);
        configuration.botToken = decryptedToken;
      } catch (error) {
        console.error('Failed to decrypt bot token for backup:', error);
      }
    }

    const backupId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentTime = new Date().toISOString();

    const backupData = {
      id: backupId,
      name,
      description,
      createdAt: currentTime,
      createdBy: session.user.email || 'unknown',
      version: '1.0.0',
      backupType,
      configuration,
      metadata: {
        configurationHash: generateConfigHash(configuration),
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform
        },
        backupType,
        originalConfigUpdated: configMap.telegram_updated_at
      }
    };

    // Save backup
    await prisma.systemConfig.create({
      data: {
        key: `telegram_backup_${backupId}`,
        value: JSON.stringify(backupData)
      }
    });

    // Update backup metadata
    await updateBackupMetadata();

    return NextResponse.json({
      success: true,
      backup: {
        id: backupId,
        name,
        description,
        createdAt: currentTime,
        createdBy: session.user.email,
        size: JSON.stringify(backupData).length,
        version: '1.0.0'
      },
      message: 'Backup created successfully'
    });

  } catch (error) {
    console.error('Backup creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('id');

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID required' }, { status: 400 });
    }

    // Check if backup exists
    const backup = await prisma.systemConfig.findUnique({
      where: { key: `telegram_backup_${backupId}` }
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    // Delete backup
    await prisma.systemConfig.delete({
      where: { key: `telegram_backup_${backupId}` }
    });

    // Update backup metadata
    await updateBackupMetadata();

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    });

  } catch (error) {
    console.error('Backup deletion error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function updateBackupMetadata() {
  try {
    const backups = await prisma.systemConfig.findMany({
      where: {
        key: {
          startsWith: 'telegram_backup_'
        }
      }
    });

    const metadata = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.value.length, 0),
      lastBackup: backups.length > 0 ? Math.max(...backups.map(b => new Date(b.updatedAt).getTime())) : null,
      updatedAt: new Date().toISOString()
    };

    await prisma.systemConfig.upsert({
      where: { key: 'telegram_backup_metadata' },
      create: {
        key: 'telegram_backup_metadata',
        value: JSON.stringify(metadata)
      },
      update: {
        value: JSON.stringify(metadata)
      }
    });
  } catch (error) {
    console.error('Failed to update backup metadata:', error);
  }
}

function generateConfigHash(config: BackupConfiguration): string {
  const crypto = require('crypto');
  const { botToken, ...configWithoutToken } = config;
  const configString = JSON.stringify(configWithoutToken, Object.keys(configWithoutToken).sort());
  return crypto.createHash('sha256').update(configString).digest('hex').substring(0, 16);
}