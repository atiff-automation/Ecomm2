/**
 * Admin Multi-User Telegram Management API
 * MULTI-TENANT endpoint for admin oversight of all user configurations
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { TelegramServiceFactory } from '@/lib/services/telegram-service-factory';
import { telegramConfigService } from '@/lib/services/telegram-config.service';
import { prisma } from '@/lib/db/prisma';

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

/**
 * GET /api/admin/telegram/users - List all users with Telegram status
 * SYSTEMATIC: Admin overview of multi-tenant configurations
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Verify admin access
    await verifyAdminAccess();
    
    // QUERY PARAMETERS: Parse pagination and filters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const configuredOnly = searchParams.get('configured') === 'true';
    const healthFilter = searchParams.get('health'); // 'healthy', 'unhealthy', 'unknown'
    
    // PAGINATION: Calculate offset
    const offset = (page - 1) * limit;
    
    // CENTRALIZED: Get all configured users
    const configuredUsers = await TelegramServiceFactory.getConfiguredUsers();
    
    // FILTER: Apply health and configuration filters
    let filteredUsers = configuredUsers;
    if (configuredOnly) {
      filteredUsers = filteredUsers.filter(user => user.configured);
    }
    if (healthFilter === 'healthy') {
      filteredUsers = filteredUsers.filter(user => user.verified);
    }
    if (healthFilter === 'unhealthy') {
      filteredUsers = filteredUsers.filter(user => !user.verified && user.configured);
    }
    if (healthFilter === 'unknown') {
      filteredUsers = filteredUsers.filter(user => !user.configured);
    }
    
    // PAGINATION: Apply limits
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);
    
    // DETAILED INFO: Get detailed information for each user
    const userDetails = await Promise.all(
      paginatedUsers.map(async (userInfo) => {
        try {
          const config = await telegramConfigService.getUserConfig(userInfo.userId);
          let healthStatus = null;
          
          if (config?.botToken) {
            try {
              const service = await TelegramServiceFactory.getServiceForUser(userInfo.userId);
              healthStatus = service.getHealthStatus();
            } catch (error) {
              console.error(`Failed to get health for user ${userInfo.userId}:`, error);
            }
          }
          
          // USER INFO: Get basic user information
          const user = await prisma.user.findUnique({
            where: { id: userInfo.userId },
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          });
          
          return {
            user: user || { id: userInfo.userId, name: null, email: null, createdAt: null },
            telegram: {
              configured: userInfo.configured,
              verified: userInfo.verified,
              config: config ? {
                ordersEnabled: config.ordersEnabled,
                inventoryEnabled: config.inventoryEnabled,
                dailySummaryEnabled: config.dailySummaryEnabled,
                timezone: config.timezone,
                healthStatus: config.healthStatus,
                lastHealthCheck: config.lastHealthCheck,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt
              } : null,
              health: healthStatus
            }
          };
        } catch (error) {
          console.error(`Error fetching details for user ${userInfo.userId}:`, error);
          return {
            user: { id: userInfo.userId, name: null, email: null, createdAt: null },
            telegram: {
              configured: false,
              verified: false,
              config: null,
              health: null,
              error: 'Failed to load user data'
            }
          };
        }
      })
    );
    
    // STATISTICS: Calculate overview statistics
    const stats = {
      total: configuredUsers.length,
      configured: configuredUsers.filter(u => u.configured).length,
      verified: configuredUsers.filter(u => u.verified).length,
      unverified: configuredUsers.filter(u => u.configured && !u.verified).length
    };
    
    // RESPONSE: Return comprehensive user list with pagination
    return NextResponse.json({
      users: userDetails,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit),
        hasNext: offset + limit < filteredUsers.length,
        hasPrev: page > 1
      },
      statistics: stats,
      filters: {
        configuredOnly,
        healthFilter
      }
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
    
    console.error('Error fetching Telegram users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Telegram users' },
      { status: 500 }
    );
  }
}