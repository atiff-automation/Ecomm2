/**
 * Admin System Health API
 * MULTI-TENANT system-wide health monitoring for Telegram services
 * FOLLOWS @CLAUDE.md: NO HARDCODE | DRY | SINGLE SOURCE OF TRUTH
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { TelegramServiceFactory } from '@/lib/services/telegram-service-factory';
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
 * GET /api/admin/telegram/system-health - Comprehensive system health check
 * SYSTEMATIC: Multi-tenant health monitoring with detailed diagnostics
 */
export async function GET() {
  try {
    // SECURITY: Verify admin access
    await verifyAdminAccess();
    
    // CENTRALIZED: Perform comprehensive health check
    const healthReport = await TelegramServiceFactory.performHealthCheck();
    
    // STATISTICS: Calculate system-wide statistics
    const totalUsers = healthReport.users.length;
    const healthyUsers = healthReport.users.filter(user => user.healthy).length;
    const unhealthyUsers = totalUsers - healthyUsers;
    const globalHealthy = healthReport.global.healthy;
    
    // DETAILED BREAKDOWN: Categorize users by health status
    const healthyUsersList = healthReport.users.filter(user => user.healthy);
    const unhealthyUsersList = healthReport.users.filter(user => !user.healthy);
    
    // ERROR ANALYSIS: Group errors by type for troubleshooting
    const errorTypes = unhealthyUsersList.reduce((acc, user) => {
      const errorKey = user.error || 'Unknown error';
      if (!acc[errorKey]) {
        acc[errorKey] = 0;
      }
      acc[errorKey]++;
      return acc;
    }, {} as Record<string, number>);
    
    // SYSTEM METRICS: Overall system health assessment
    const systemHealth = {
      overall: globalHealthy && healthyUsers === totalUsers ? 'HEALTHY' : 
               healthyUsers > unhealthyUsers ? 'DEGRADED' : 'UNHEALTHY',
      score: totalUsers > 0 ? Math.round((healthyUsers / totalUsers) * 100) : 0,
      global: {
        status: globalHealthy ? 'HEALTHY' : 'UNHEALTHY',
        error: healthReport.global.error || null
      },
      users: {
        total: totalUsers,
        healthy: healthyUsers,
        unhealthy: unhealthyUsers,
        healthPercentage: totalUsers > 0 ? Math.round((healthyUsers / totalUsers) * 100) : 0
      }
    };
    
    // RECOMMENDATIONS: System improvement suggestions
    const recommendations = [];
    if (!globalHealthy) {
      recommendations.push({
        type: 'CRITICAL',
        message: 'Global Telegram service is unhealthy. Check bot token and configuration.',
        action: 'Review global Telegram configuration in admin settings'
      });
    }
    if (unhealthyUsers > 0) {
      recommendations.push({
        type: 'WARNING',
        message: `${unhealthyUsers} user(s) have unhealthy Telegram configurations.`,
        action: 'Review individual user configurations and bot tokens'
      });
    }
    if (Object.keys(errorTypes).length > 0) {
      recommendations.push({
        type: 'INFO',
        message: `Common errors detected: ${Object.keys(errorTypes).join(', ')}`,
        action: 'Address common configuration issues to improve system health'
      });
    }
    
    // COMPREHENSIVE RESPONSE: Return detailed health report
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      systemHealth,
      global: healthReport.global,
      users: {
        healthy: healthyUsersList.map(user => ({
          userId: user.userId,
          status: 'HEALTHY'
        })),
        unhealthy: unhealthyUsersList.map(user => ({
          userId: user.userId,
          status: 'UNHEALTHY',
          error: user.error
        }))
      },
      analysis: {
        errorTypes,
        recommendations
      },
      raw: healthReport // Include raw data for debugging
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
    
    console.error('Error performing system health check:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform system health check',
        timestamp: new Date().toISOString(),
        systemHealth: {
          overall: 'ERROR',
          score: 0,
          message: 'Health check failed'
        }
      },
      { status: 500 }
    );
  }
}