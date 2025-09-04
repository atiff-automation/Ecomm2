/**
 * Telegram Migration API
 * ADMIN-ONLY endpoint for managing multi-tenant migration
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { TelegramMigrationService } from '@/lib/migration/telegram-migration';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

/**
 * Verify admin access
 * SECURITY: Centralized admin verification
 */
async function verifyAdminAccess() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Authentication required');
  }
  
  // ADMIN CHECK: Verify user has admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  });
  
  if (user?.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  
  return session.user.id;
}

// VALIDATION: Migration request schema
const MigrationRequestSchema = z.object({
  action: z.enum(['check', 'migrate-user', 'migrate-all-admins', 'create-fallback', 'validate', 'full-migration']),
  userId: z.string().optional(),
});

/**
 * GET /api/admin/telegram/migration - Check migration status
 * ASSESSMENT: Determine if migration is needed
 */
export async function GET() {
  try {
    // SECURITY: Verify admin access
    await verifyAdminAccess();
    
    // CHECK: Migration status
    const migrationStatus = await TelegramMigrationService.needsMigration();
    
    // GLOBAL CONFIG: Extract current global configuration
    const globalConfig = await TelegramMigrationService.extractGlobalConfig();
    
    return NextResponse.json({
      migrationStatus,
      globalConfig: {
        hasToken: !!globalConfig.botToken,
        ordersEnabled: globalConfig.ordersEnabled,
        inventoryEnabled: globalConfig.inventoryEnabled,
        hasOrdersChat: !!globalConfig.ordersChatId,
        hasInventoryChat: !!globalConfig.inventoryChatId
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }
    
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/telegram/migration - Execute migration actions
 * SYSTEMATIC: Controlled migration execution
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify admin access
    const adminId = await verifyAdminAccess();
    
    // VALIDATION: Parse and validate request
    const body = await request.json();
    const { action, userId } = MigrationRequestSchema.parse(body);
    
    let result;
    
    // EXECUTION: Route to appropriate migration action
    switch (action) {
      case 'check':
        result = await TelegramMigrationService.needsMigration();
        break;
        
      case 'migrate-user':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID required for user migration' },
            { status: 400 }
          );
        }
        result = await TelegramMigrationService.migrateToUser(userId);
        break;
        
      case 'migrate-all-admins':
        result = await TelegramMigrationService.migrateToAllAdmins();
        break;
        
      case 'create-fallback':
        result = await TelegramMigrationService.createGlobalFallback();
        break;
        
      case 'validate':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID required for migration validation' },
            { status: 400 }
          );
        }
        result = await TelegramMigrationService.validateMigration(userId);
        break;
        
      case 'full-migration':
        result = await TelegramMigrationService.runFullMigration(userId);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid migration action' },
          { status: 400 }
        );
    }
    
    // LOGGING: Record migration action
    console.log(`Migration action executed:`, {
      action,
      userId,
      adminId,
      success: result.success,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      action,
      result,
      executedBy: adminId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (error.message === 'Admin access required') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }
    
    console.error('Error executing migration action:', error);
    return NextResponse.json(
      { error: 'Failed to execute migration action' },
      { status: 500 }
    );
  }
}