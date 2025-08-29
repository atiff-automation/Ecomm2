/**
 * Admin API Usage Stats API
 * Provides EasyParcel API usage monitoring and statistics
 * Based on TRACKING_ARCHITECTURE_REFACTOR_PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { TRACKING_REFACTOR_CONFIG } from '@/lib/config/tracking-refactor';
import {
  ApiUsageStatsResponse,
  TrackingRefactorError,
} from '@/lib/types/tracking-refactor';
import {
  createTrackingErrorResponse,
  trackTrackingAPIPerformance,
} from '@/lib/utils/tracking-error-handling';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db/prisma';

/**
 * Validate admin access
 */
async function validateAdminAccess(): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return false;
  }

  // Check if user has admin role
  const userRole = (session.user as any).role;
  return userRole === 'ADMIN' || userRole === 'SUPERADMIN';
}

/**
 * GET /api/admin/tracking/api-usage
 * Get comprehensive API usage statistics
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate admin access
    const hasAdminAccess = await validateAdminAccess();
    if (!hasAdminAccess) {
      throw new TrackingRefactorError(
        'Admin access required',
        'ADMIN_ACCESS_REQUIRED',
        403
      );
    }

    // Calculate daily window (last 24 hours)
    const now = new Date();
    const dailyStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get API call statistics from update logs
    const apiCallLogs = await prisma.trackingUpdateLog.findMany({
      where: {
        startedAt: { gte: dailyStart },
        updateType: { in: ['scheduled', 'manual', 'retry'] }, // Actual API calls
      },
      select: {
        startedAt: true,
        apiCallSuccess: true,
        apiResponseTimeMs: true,
        completedAt: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    // Calculate basic statistics
    const totalApiCalls = apiCallLogs.length;
    const successfulCalls = apiCallLogs.filter(
      log => log.apiCallSuccess
    ).length;
    const failedCalls = totalApiCalls - successfulCalls;
    const successRate =
      totalApiCalls > 0
        ? Math.round((successfulCalls / totalApiCalls) * 100)
        : 100;

    // Calculate average response time
    const responseTimes = apiCallLogs
      .filter(log => log.apiResponseTimeMs && log.apiResponseTimeMs > 0)
      .map(log => log.apiResponseTimeMs!);

    const averageResponseTime =
      responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, time) => sum + time, 0) /
              responseTimes.length
          )
        : 0;

    // Get daily budget from configuration
    const dailyBudget =
      TRACKING_REFACTOR_CONFIG.API_MANAGEMENT.DAILY_API_BUDGET;
    const remainingCalls = Math.max(0, dailyBudget - totalApiCalls);
    const usagePercentage = Math.round((totalApiCalls / dailyBudget) * 100);

    // Calculate hourly breakdown
    const hourlyBreakdown: Array<{
      hour: number;
      calls: number;
      successRate: number;
    }> = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourStart = new Date(dailyStart.getTime() + hour * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

      const hourlyLogs = apiCallLogs.filter(
        log => log.startedAt >= hourStart && log.startedAt < hourEnd
      );

      const hourlyCalls = hourlyLogs.length;
      const hourlySuccessful = hourlyLogs.filter(
        log => log.apiCallSuccess
      ).length;
      const hourlySuccessRate =
        hourlyCalls > 0
          ? Math.round((hourlySuccessful / hourlyCalls) * 100)
          : 100;

      hourlyBreakdown.push({
        hour: hour,
        calls: hourlyCalls,
        successRate: hourlySuccessRate,
      });
    }

    // Calculate reset times (daily reset at midnight Malaysia time)
    const malaysiaTime = new Date().toLocaleString('en-US', {
      timeZone: TRACKING_REFACTOR_CONFIG.LOCALIZATION.TIMEZONE,
    });
    const today = new Date(malaysiaTime);
    today.setHours(0, 0, 0, 0);

    const nextReset = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Get recent performance trends
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyLogs = await prisma.trackingUpdateLog.findMany({
      where: {
        startedAt: { gte: last7Days },
        updateType: { in: ['scheduled', 'manual', 'retry'] },
      },
      select: {
        startedAt: true,
        apiCallSuccess: true,
      },
    });

    const weeklyTotalCalls = weeklyLogs.length;
    const weeklySuccessfulCalls = weeklyLogs.filter(
      log => log.apiCallSuccess
    ).length;
    const weeklySuccessRate =
      weeklyTotalCalls > 0
        ? Math.round((weeklySuccessfulCalls / weeklyTotalCalls) * 100)
        : 100;

    const response: ApiUsageStatsResponse = {
      success: true,
      data: {
        dailyApiCalls: totalApiCalls,
        dailyBudget: dailyBudget,
        remainingCalls: remainingCalls,
        usagePercentage: usagePercentage,
        averageResponseTime: averageResponseTime,
        successRate: successRate,
        lastResetAt: today.toISOString(),
        nextResetAt: nextReset.toISOString(),
        hourlyBreakdown: hourlyBreakdown,
      },
    };

    // Add additional metrics for comprehensive monitoring
    (response.data as any).additionalMetrics = {
      weeklyStats: {
        totalCalls: weeklyTotalCalls,
        successRate: weeklySuccessRate,
        averageDailyCalls: Math.round(weeklyTotalCalls / 7),
      },
      alerts: {
        highUsage: usagePercentage > 80,
        lowSuccessRate: successRate < 90,
        slowResponses: averageResponseTime > 5000,
      },
      recommendations: [] as string[],
    };

    // Generate recommendations based on usage patterns
    const recommendations = (response.data as any).additionalMetrics
      .recommendations;

    if (usagePercentage > 90) {
      recommendations.push(
        'API usage is very high. Consider optimizing update frequencies.'
      );
    }

    if (successRate < 85) {
      recommendations.push(
        'API success rate is low. Check for connectivity issues or API limits.'
      );
    }

    if (averageResponseTime > 5000) {
      recommendations.push(
        'API response times are slow. Monitor for performance issues.'
      );
    }

    if (remainingCalls < dailyBudget * 0.1) {
      recommendations.push(
        'Daily API budget is nearly exhausted. Implement emergency throttling.'
      );
    }

    console.log(
      `📊 API Usage Stats: ${totalApiCalls}/${dailyBudget} calls (${usagePercentage}%), ${successRate}% success rate`
    );

    // Track performance
    trackTrackingAPIPerformance('admin-api-usage', startTime, true, {
      totalApiCalls,
      usagePercentage,
      successRate,
      averageResponseTime,
    });

    return NextResponse.json(response);
  } catch (error) {
    // Track performance for errors
    trackTrackingAPIPerformance(
      'admin-api-usage',
      startTime,
      false,
      {},
      error as Error
    );

    return createTrackingErrorResponse(error as Error, request);
  }
}
