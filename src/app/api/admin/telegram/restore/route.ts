import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { encryptSensitiveData } from '@/lib/utils/encryption';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

interface RestoreRequest {
  backupId: string;
  preserveCurrentAsBackup?: boolean;
  backupName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { backupId, preserveCurrentAsBackup = true, backupName } = await request.json() as RestoreRequest;

    if (!backupId) {
      return NextResponse.json({ error: 'Backup ID is required' }, { status: 400 });
    }

    // Get the backup to restore
    const backup = await prisma.systemConfig.findUnique({
      where: { key: `telegram_backup_${backupId}` }
    });

    if (!backup) {
      return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
    }

    let backupData;
    try {
      backupData = JSON.parse(backup.value);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid backup data format' }, { status: 500 });
    }

    const currentTime = new Date().toISOString();

    try {
      await prisma.$transaction(async (tx) => {
        // Create backup of current configuration before restoring (if requested)
        if (preserveCurrentAsBackup) {
          const currentConfigs = await tx.systemConfig.findMany({
            where: {
              key: {
                startsWith: 'telegram_'
              }
            }
          });

          if (currentConfigs.length > 0) {
            const configMap = currentConfigs.reduce((acc, config) => {
              acc[config.key] = config.value;
              return acc;
            }, {} as Record<string, string>);

            const preRestoreBackupId = `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const preRestoreBackup = {
              id: preRestoreBackupId,
              name: backupName || `Pre-restore backup (${new Date().toLocaleString()})`,
              description: `Automatic backup created before restoring backup ${backupId}`,
              createdAt: currentTime,
              createdBy: session.user.email || 'system',
              version: '1.0.0',
              backupType: 'pre-update',
              configuration: {
                id: configMap.telegram_config_id || 'default',
                createdAt: configMap.telegram_created_at || currentTime,
                updatedAt: configMap.telegram_updated_at || currentTime,
                botUsername: configMap.telegram_bot_username,
                botName: configMap.telegram_bot_name,
                ordersChannelId: configMap.telegram_orders_channel_id,
                ordersChannelName: configMap.telegram_orders_channel_name,
                inventoryChannelId: configMap.telegram_inventory_channel_id,
                inventoryChannelName: configMap.telegram_inventory_channel_name,
                ordersEnabled: configMap.telegram_orders_enabled === 'true',
                inventoryEnabled: configMap.telegram_inventory_enabled === 'true',
                isActive: configMap.telegram_is_active === 'true'
              },
              metadata: {
                configurationHash: 'pre-restore',
                systemInfo: {
                  nodeVersion: process.version,
                  platform: process.platform
                },
                backupType: 'pre-update',
                restoringFrom: backupId
              }
            };

            await tx.systemConfig.create({
              data: {
                key: `telegram_backup_${preRestoreBackupId}`,
                value: JSON.stringify(preRestoreBackup)
              }
            });
          }
        }

        // Restore configuration from backup
        const config = backupData.configuration;
        const restoreUpdates: Array<{ key: string; value: string }> = [
          { key: 'telegram_config_id', value: config.id || 'restored' },
          { key: 'telegram_restored_at', value: currentTime },
          { key: 'telegram_restored_by', value: session.user.email || 'unknown' },
          { key: 'telegram_restored_from_backup', value: backupId },
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

        // Encrypt and restore bot token if available
        if (config.botToken) {
          const encryptedToken = await encryptSensitiveData(config.botToken);
          restoreUpdates.push({
            key: 'telegram_bot_token_encrypted',
            value: encryptedToken
          });
        }

        // Apply all updates
        for (const update of restoreUpdates) {
          await tx.systemConfig.upsert({
            where: { key: update.key },
            create: update,
            update: { value: update.value }
          });
        }
      });

      const summary = {
        restored: true,
        timestamp: currentTime,
        restoredBy: session.user.email,
        backupId,
        backupInfo: {
          name: backupData.name,
          createdAt: backupData.createdAt,
          createdBy: backupData.createdBy,
          version: backupData.version
        },
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
          originalBackupDate: backupData.createdAt,
          originalCreator: backupData.createdBy,
          backupType: backupData.backupType || 'manual',
          configurationHash: backupData.metadata?.configurationHash,
          preRestoreBackupCreated: preserveCurrentAsBackup
        }
      };

      return NextResponse.json({
        success: true,
        message: 'Configuration restored successfully',
        summary
      });

    } catch (dbError) {
      console.error('Database error during restore:', dbError);
      return NextResponse.json({ 
        error: 'Restore failed',
        details: 'Database transaction failed'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Configuration restore error:', error);
    return NextResponse.json({ 
      error: 'Restore failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}