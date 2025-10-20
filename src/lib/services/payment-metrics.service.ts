/**
 * Payment Metrics Service - Centralized payment statistics and analytics
 * Implements DRY principles and single source of truth for payment data
 */

import { prisma } from '@/lib/db/prisma';
import { PaymentStatus, OrderStatus } from '@prisma/client';

export interface PaymentMetrics {
  totalTransactions: number;
  totalRevenue: number;
  successRate: number;
  failedTransactions: number;
  refundedAmount: number;
  pendingTransactions: number;
  partiallyRefundedAmount: number;
  averageOrderValue: number;
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  revenue: number;
  successRate: number;
}

export interface PaymentPeriodStats extends PaymentMetrics {
  period: string;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Core payment metrics service
 * Single source of truth for all payment statistics
 */
export class PaymentMetricsService {
  /**
   * Get comprehensive payment metrics for all time or specific date range
   */
  static async getPaymentMetrics(
    startDate?: Date,
    endDate?: Date
  ): Promise<PaymentMetrics> {
    const whereClause = this.buildDateWhereClause(startDate, endDate);

    // Execute all queries in parallel for optimal performance
    const [
      totalOrders,
      paidOrders,
      failedOrders,
      refundedOrders,
      partiallyRefundedOrders,
      pendingOrders,
      revenueStats,
      refundStats,
      partialRefundStats,
    ] = await Promise.all([
      // Total transaction count
      prisma.order.count({ where: whereClause }),

      // Successful payments
      prisma.order.count({
        where: { ...whereClause, paymentStatus: PaymentStatus.PAID },
      }),

      // Failed payments
      prisma.order.count({
        where: { ...whereClause, paymentStatus: PaymentStatus.FAILED },
      }),

      // Refunded orders
      prisma.order.count({
        where: { ...whereClause, paymentStatus: PaymentStatus.REFUNDED },
      }),

      // Partially refunded orders
      prisma.order.count({
        where: {
          ...whereClause,
          paymentStatus: PaymentStatus.PARTIALLY_REFUNDED,
        },
      }),

      // Pending payments
      prisma.order.count({
        where: { ...whereClause, paymentStatus: PaymentStatus.PENDING },
      }),

      // Total revenue (only from paid orders)
      prisma.order.aggregate({
        where: { ...whereClause, paymentStatus: PaymentStatus.PAID },
        _sum: { total: true },
        _avg: { total: true },
      }),

      // Total refunded amount
      prisma.order.aggregate({
        where: { ...whereClause, paymentStatus: PaymentStatus.REFUNDED },
        _sum: { total: true },
      }),

      // Partially refunded amount (approximation - would need refund tracking table for precision)
      prisma.order.aggregate({
        where: {
          ...whereClause,
          paymentStatus: PaymentStatus.PARTIALLY_REFUNDED,
        },
        _sum: { total: true },
      }),
    ]);

    const totalRevenue = Number(revenueStats._sum.total || 0);
    const refundedAmount = Number(refundStats._sum.total || 0);
    const partiallyRefundedAmount = Number(partialRefundStats._sum.total || 0);
    const averageOrderValue = Number(revenueStats._avg.total || 0);

    // Calculate success rate (paid orders / total non-pending orders)
    const nonPendingOrders = totalOrders - pendingOrders;
    const successRate =
      nonPendingOrders > 0 ? (paidOrders / nonPendingOrders) * 100 : 0;

    return {
      totalTransactions: totalOrders,
      totalRevenue,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      failedTransactions: failedOrders,
      refundedAmount,
      pendingTransactions: pendingOrders,
      partiallyRefundedAmount,
      averageOrderValue,
    };
  }

  /**
   * Get payment method breakdown statistics
   */
  static async getPaymentMethodStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<PaymentMethodStats[]> {
    const whereClause = this.buildDateWhereClause(startDate, endDate);

    const methodStats = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        ...whereClause,
        paymentMethod: { not: null },
      },
      _count: { paymentMethod: true },
      _sum: { total: true },
    });

    // Get success rates for each method
    const methodsWithStats = await Promise.all(
      methodStats.map(async stat => {
        const totalForMethod = stat._count.paymentMethod;
        const successfulForMethod = await prisma.order.count({
          where: {
            ...whereClause,
            paymentMethod: stat.paymentMethod,
            paymentStatus: PaymentStatus.PAID,
          },
        });

        return {
          method: stat.paymentMethod || 'Unknown',
          count: totalForMethod,
          revenue: Number(stat._sum.total || 0),
          successRate:
            totalForMethod > 0
              ? Math.round((successfulForMethod / totalForMethod) * 1000) / 10
              : 0,
        };
      })
    );

    return methodsWithStats.sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get payment metrics for multiple periods (e.g., monthly trends)
   */
  static async getPaymentTrends(
    periodType: 'daily' | 'weekly' | 'monthly' = 'monthly',
    periodsCount: number = 6
  ): Promise<PaymentPeriodStats[]> {
    const periods = this.generatePeriods(periodType, periodsCount);

    const trends = await Promise.all(
      periods.map(async period => {
        const metrics = await this.getPaymentMetrics(period.start, period.end);
        return {
          ...metrics,
          period: period.label,
          periodStart: period.start,
          periodEnd: period.end,
        };
      })
    );

    return trends.reverse(); // Latest first
  }

  /**
   * Build date range where clause for queries
   */
  private static buildDateWhereClause(startDate?: Date, endDate?: Date) {
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = startDate;
      }
      if (endDate) {
        whereClause.createdAt.lte = endDate;
      }
    }

    return whereClause;
  }

  /**
   * Generate time periods for trend analysis
   */
  private static generatePeriods(
    type: 'daily' | 'weekly' | 'monthly',
    count: number
  ) {
    const periods = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      let start: Date, end: Date, label: string;

      if (type === 'daily') {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - i + 1
        );
        label = start.toLocaleDateString('en-MY');
      } else if (type === 'weekly') {
        const startOfWeek = now.getDate() - now.getDay() - i * 7;
        start = new Date(now.getFullYear(), now.getMonth(), startOfWeek);
        end = new Date(now.getFullYear(), now.getMonth(), startOfWeek + 7);
        label = `Week ${start.toLocaleDateString('en-MY')}`;
      } else {
        start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        label = start.toLocaleDateString('en-MY', {
          year: 'numeric',
          month: 'short',
        });
      }

      periods.push({ start, end, label });
    }

    return periods;
  }
}
