/**
 * Tracking Data Migration Utility
 * Migrates existing shipment data to new tracking cache system
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { PrismaClient } from '@prisma/client';
import {
  createTrackingCache,
  createJob,
  createUpdateLog,
} from '../services/tracking-cache';
import {
  calculateNextUpdate,
  getJobPriority,
  isTerminalStatus,
  TRACKING_REFACTOR_CONFIG,
} from '../config/tracking-refactor';
import {
  TrackingRefactorError,
  CacheConsistencyError,
} from '../types/tracking-refactor';

const prisma = new PrismaClient();

interface MigrationStats {
  totalOrders: number;
  migratedOrders: number;
  skippedOrders: number;
  errors: Array<{
    orderId: string;
    error: string;
  }>;
  jobsCreated: number;
  processingTimeMs: number;
}

interface MigrationOptions {
  batchSize?: number;
  skipExisting?: boolean;
  createJobs?: boolean;
  dryRun?: boolean;
  orderIds?: string[];
}

/**
 * Migrate existing shipment data to tracking cache
 */
export async function migrateTrackingData(options: MigrationOptions = {}): Promise<MigrationStats> {
  const startTime = Date.now();
  const {
    batchSize = 50,
    skipExisting = true,
    createJobs = true,
    dryRun = false,
    orderIds,
  } = options;

  console.log(`🚀 Starting tracking data migration${dryRun ? ' (DRY RUN)' : ''}...`);

  const stats: MigrationStats = {
    totalOrders: 0,
    migratedOrders: 0,
    skippedOrders: 0,
    errors: [],
    jobsCreated: 0,
    processingTimeMs: 0,
  };

  try {
    // Build query for orders with shipments but no tracking cache
    const whereClause: any = {
      shipment: {
        isNot: null,
      },
    };

    if (skipExisting) {
      whereClause.trackingCache = null;
    }

    if (orderIds && orderIds.length > 0) {
      whereClause.id = { in: orderIds };
    }

    // Get orders that need migration in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          shipment: {
            include: {
              trackingEvents: {
                orderBy: { eventTime: 'desc' },
              },
            },
          },
          trackingCache: true,
        },
        take: batchSize,
        skip: offset,
      });

      if (orders.length === 0) {
        hasMore = false;
        break;
      }

      stats.totalOrders += orders.length;
      console.log(`📦 Processing batch ${Math.floor(offset / batchSize) + 1}: ${orders.length} orders`);

      // Process each order in the batch
      for (const order of orders) {
        try {
          await migrateOrderTrackingData(order, stats, dryRun, createJobs);
        } catch (error) {
          console.error(`❌ Failed to migrate order ${order.id}:`, error);
          stats.errors.push({
            orderId: order.id,
            error: error.message,
          });
        }
      }

      offset += batchSize;
      
      // Add small delay between batches to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    stats.processingTimeMs = Date.now() - startTime;

    console.log(`✅ Migration completed in ${stats.processingTimeMs}ms:`);
    console.log(`  - Total orders processed: ${stats.totalOrders}`);
    console.log(`  - Successfully migrated: ${stats.migratedOrders}`);
    console.log(`  - Skipped: ${stats.skippedOrders}`);
    console.log(`  - Errors: ${stats.errors.length}`);
    console.log(`  - Jobs created: ${stats.jobsCreated}`);

    if (stats.errors.length > 0) {
      console.log('❌ Migration errors:');
      stats.errors.forEach(error => {
        console.log(`  - Order ${error.orderId}: ${error.error}`);
      });
    }

    return stats;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw new TrackingRefactorError(
      `Migration failed: ${error.message}`,
      'MIGRATION_ERROR',
      500,
      true,
      { stats }
    );
  }
}

/**
 * Migrate tracking data for a single order
 */
async function migrateOrderTrackingData(
  order: any,
  stats: MigrationStats,
  dryRun: boolean,
  createJobsAfterMigration: boolean
): Promise<void> {
  try {
    // Skip if tracking cache already exists
    if (order.trackingCache) {
      console.log(`⏭️ Skipping order ${order.orderNumber} (tracking cache already exists)`);
      stats.skippedOrders++;
      return;
    }

    // Skip if no shipment
    if (!order.shipment) {
      console.log(`⏭️ Skipping order ${order.orderNumber} (no shipment)`);
      stats.skippedOrders++;
      return;
    }

    const shipment = order.shipment;
    
    // Convert shipment tracking events to new format
    const trackingEvents = shipment.trackingEvents?.map((event: any) => ({
      eventCode: event.eventCode || 'UNKNOWN',
      eventName: event.eventName,
      description: event.description,
      location: event.location,
      timestamp: event.eventTime.toISOString(),
      timezone: event.timezone || 'Asia/Kuala_Lumpur',
      source: event.source || 'EASYPARCEL',
    })) || [];

    // Determine current status from shipment
    const currentStatus = mapShipmentStatusToTrackingStatus(shipment.status);
    
    // Calculate next update time
    const now = new Date();
    const nextUpdateDue = calculateNextUpdate(
      currentStatus,
      now,
      0, // No failures initially
      shipment.estimatedDelivery
    );

    const trackingCacheData = {
      orderId: order.id,
      courierTrackingNumber: shipment.trackingNumber || '',
      courierService: shipment.courierName || shipment.serviceName || 'Unknown',
      currentStatus,
      lastStatusUpdate: shipment.updatedAt,
      trackingEvents,
      estimatedDelivery: shipment.estimatedDelivery,
      lastApiUpdate: shipment.updatedAt, // Use last shipment update as initial API update
      nextUpdateDue,
    };

    if (dryRun) {
      console.log(`🔍 DRY RUN - Would migrate order ${order.orderNumber}:`, {
        currentStatus,
        eventsCount: trackingEvents.length,
        nextUpdateDue: nextUpdateDue.toISOString(),
      });
      stats.migratedOrders++;
      return;
    }

    // Create tracking cache entry
    const trackingCache = await createTrackingCache(trackingCacheData);
    console.log(`✅ Migrated order ${order.orderNumber} to tracking cache`);

    // Create initial log entry
    await createUpdateLog({
      trackingCacheId: trackingCache.id,
      updateType: 'migration',
      triggeredBy: 'system',
      apiCallSuccess: true,
      statusChanged: false,
      eventsAdded: trackingEvents.length,
      startedAt: now,
      completedAt: now,
    });

    stats.migratedOrders++;

    // Create initial job if tracking is still active
    if (createJobsAfterMigration && !isTerminalStatus(currentStatus)) {
      try {
        const jobId = await createJob({
          trackingCacheId: trackingCache.id,
          jobType: 'UPDATE',
          priority: getJobPriority('UPDATE'),
          scheduledFor: nextUpdateDue,
        });

        console.log(`📅 Created initial job for order ${order.orderNumber}`);
        stats.jobsCreated++;
      } catch (jobError) {
        console.warn(`⚠️ Failed to create job for order ${order.orderNumber}:`, jobError.message);
      }
    }

  } catch (error) {
    throw new TrackingRefactorError(
      `Failed to migrate order ${order.id}: ${error.message}`,
      'ORDER_MIGRATION_ERROR',
      500,
      true,
      { orderId: order.id }
    );
  }
}

/**
 * Map shipment status to tracking status
 */
function mapShipmentStatusToTrackingStatus(shipmentStatus: string): string {
  const statusMap: Record<string, string> = {
    'DRAFT': 'PENDING',
    'RATE_CALCULATED': 'PENDING',
    'BOOKED': 'CONFIRMED',
    'LABEL_GENERATED': 'PROCESSING',
    'PICKUP_SCHEDULED': 'PROCESSING',
    'PICKED_UP': 'SHIPPED',
    'IN_TRANSIT': 'SHIPPED',
    'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
    'DELIVERED': 'DELIVERED',
    'FAILED': 'FAILED',
    'CANCELLED': 'CANCELLED',
  };

  return statusMap[shipmentStatus] || 'UNKNOWN';
}

/**
 * Validate migration results
 */
export async function validateMigration(): Promise<{
  isValid: boolean;
  issues: Array<{ type: string; count: number; description: string }>;
}> {
  console.log('🔍 Validating migration results...');

  const issues: Array<{ type: string; count: number; description: string }> = [];

  try {
    // Check for orders with shipments but no tracking cache
    const ordersWithoutCache = await prisma.order.count({
      where: {
        shipment: { isNot: null },
        trackingCache: null,
      },
    });

    if (ordersWithoutCache > 0) {
      issues.push({
        type: 'MISSING_CACHE',
        count: ordersWithoutCache,
        description: 'Orders with shipments but no tracking cache',
      });
    }

    // Check for tracking caches without valid orders
    const orphanedCaches = await prisma.trackingCache.count({
      where: {
        order: null,
      },
    });

    if (orphanedCaches > 0) {
      issues.push({
        type: 'ORPHANED_CACHE',
        count: orphanedCaches,
        description: 'Tracking caches without valid orders',
      });
    }

    // Check for inconsistent status flags
    const inconsistentStatus = await prisma.trackingCache.count({
      where: {
        OR: [
          { isDelivered: false, currentStatus: 'DELIVERED' },
          { isActive: true, isDelivered: true },
          { isActive: false, isDelivered: false, isFailed: false },
        ],
      },
    });

    if (inconsistentStatus > 0) {
      issues.push({
        type: 'INCONSISTENT_STATUS',
        count: inconsistentStatus,
        description: 'Tracking caches with inconsistent status flags',
      });
    }

    // Check for missing tracking numbers
    const missingTrackingNumbers = await prisma.trackingCache.count({
      where: {
        OR: [
          { courierTrackingNumber: '' },
          { courierTrackingNumber: null },
        ],
      },
    });

    if (missingTrackingNumbers > 0) {
      issues.push({
        type: 'MISSING_TRACKING_NUMBER',
        count: missingTrackingNumbers,
        description: 'Tracking caches without tracking numbers',
      });
    }

    const isValid = issues.length === 0;

    console.log(`✅ Migration validation ${isValid ? 'passed' : 'found issues'}:`);
    issues.forEach(issue => {
      console.log(`  - ${issue.type}: ${issue.count} (${issue.description})`);
    });

    return { isValid, issues };

  } catch (error) {
    console.error('❌ Migration validation failed:', error);
    throw new CacheConsistencyError(
      `Migration validation failed: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Clean up migration artifacts and fix issues
 */
export async function cleanupMigration(): Promise<{
  fixed: number;
  issues: string[];
}> {
  console.log('🧹 Cleaning up migration artifacts...');

  const issues: string[] = [];
  let fixed = 0;

  try {
    // Fix inconsistent status flags
    const inconsistentCaches = await prisma.trackingCache.findMany({
      where: {
        OR: [
          { isDelivered: false, currentStatus: 'DELIVERED' },
          { isActive: true, isDelivered: true },
        ],
      },
    });

    for (const cache of inconsistentCaches) {
      const isTerminal = isTerminalStatus(cache.currentStatus);
      await prisma.trackingCache.update({
        where: { id: cache.id },
        data: {
          isDelivered: isTerminal,
          isActive: !isTerminal,
        },
      });
      fixed++;
    }

    console.log(`✅ Migration cleanup completed: ${fixed} issues fixed`);

    return { fixed, issues };

  } catch (error) {
    console.error('❌ Migration cleanup failed:', error);
    throw new TrackingRefactorError(
      `Migration cleanup failed: ${error.message}`,
      'CLEANUP_ERROR',
      500
    );
  }
}

/**
 * Rollback migration (for testing or emergency)
 */
export async function rollbackMigration(orderIds?: string[]): Promise<{
  deletedCaches: number;
  deletedJobs: number;
  deletedLogs: number;
}> {
  console.log('🔄 Rolling back tracking migration...');

  try {
    const whereClause = orderIds && orderIds.length > 0 
      ? { orderId: { in: orderIds } }
      : {};

    // Delete tracking caches (this will cascade to jobs and logs)
    const deletedCaches = await prisma.trackingCache.deleteMany({
      where: whereClause,
    });

    console.log(`✅ Rollback completed: ${deletedCaches.count} tracking caches deleted`);

    return {
      deletedCaches: deletedCaches.count,
      deletedJobs: 0, // Cascaded
      deletedLogs: 0, // Cascaded
    };

  } catch (error) {
    console.error('❌ Migration rollback failed:', error);
    throw new TrackingRefactorError(
      `Migration rollback failed: ${error.message}`,
      'ROLLBACK_ERROR',
      500
    );
  }
}