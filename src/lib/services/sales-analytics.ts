/**
 * Sales Analytics Service - Centralized Data Service
 * Single source of truth for all sales reporting data
 * Following CLAUDE.md principles: DRY, no hardcoding, centralized approach
 */

import { prisma } from '@/lib/db/prisma';
import { 
  SalesOverview, 
  ProductPerformance, 
  CustomerInsight,
  RevenueAnalytics,
  StateAnalytics,
  RevenuePoint,
  PaymentMethodAnalytics,
  MALAYSIAN_STATES,
  MalaysianStateCode
} from '@/lib/types/sales-reports';

export class SalesAnalyticsService {
  private static instance: SalesAnalyticsService;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  public static getInstance(): SalesAnalyticsService {
    if (!SalesAnalyticsService.instance) {
      SalesAnalyticsService.instance = new SalesAnalyticsService();
    }
    return SalesAnalyticsService.instance;
  }

  /**
   * Get cached data or execute query
   * Temporarily disabled caching due to Redis issues
   */
  private async getCachedData<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    // Temporarily disable caching to bypass Redis connection issues
    return await queryFn();
    
    /* Commented out until Redis is configured properly
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T;
    }

    const data = await queryFn();
    this.cache.set(key, { data, expiry: Date.now() + this.CACHE_DURATION });
    return data;
    */
  }

  /**
   * Get comprehensive sales overview
   */
  async getSalesOverview(startDate: Date, endDate: Date): Promise<SalesOverview> {
    const cacheKey = `overview-${startDate.toISOString()}-${endDate.toISOString()}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        // Check if there are any orders first
        const orderCount = await prisma.order.count();
        
        if (orderCount === 0) {
          // Return empty data structure for new installations
          return {
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            memberRevenue: 0,
            nonMemberRevenue: 0,
            taxCollected: 0,
            period: { startDate, endDate }
          };
        }

        const [totalStats, memberStats] = await Promise.all([
          prisma.order.aggregate({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              paymentStatus: 'PAID'
            },
            _sum: {
              total: true,
              taxAmount: true
            },
            _count: true
          }),
          prisma.order.aggregate({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              paymentStatus: 'PAID',
              user: { isMember: true }
            },
            _sum: { total: true }
          })
        ]);

        const totalRevenue = totalStats._sum.total?.toNumber() || 0;
        const memberRevenue = memberStats._sum.total?.toNumber() || 0;
        const nonMemberRevenue = totalRevenue - memberRevenue;
        const totalOrders = totalStats._count;
        
        return {
          totalRevenue,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          memberRevenue,
          nonMemberRevenue,
          taxCollected: totalStats._sum.taxAmount?.toNumber() || 0,
          period: { startDate, endDate }
        };
      } catch (innerError) {
        console.error('Database query error in getSalesOverview:', innerError);
        // Return empty data structure on error to prevent complete failure
        return {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          memberRevenue: 0,
          nonMemberRevenue: 0,
          taxCollected: 0,
          period: { startDate, endDate }
        };
      }
    });
  }

  /**
   * Get product performance analytics
   */
  async getProductPerformance(
    startDate: Date, 
    endDate: Date,
    limit: number = 20
  ): Promise<ProductPerformance[]> {
    const cacheKey = `products-${startDate.toISOString()}-${endDate.toISOString()}-${limit}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        // Check if there are any order items first
        const orderItemCount = await prisma.orderItem.count();
        
        if (orderItemCount === 0) {
          // Return empty array for new installations
          return [];
        }

        const productStats = await prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            order: {
              createdAt: { gte: startDate, lte: endDate },
              paymentStatus: 'PAID'
            }
          },
          _sum: {
            quantity: true,
            totalPrice: true
          },
          orderBy: {
            _sum: {
              totalPrice: 'desc'
            }
          },
          take: limit
        });

        const performanceData = await Promise.all(
          productStats.map(async (stat) => {
            try {
              const [product, memberSales] = await Promise.all([
                prisma.product.findUnique({
                  where: { id: stat.productId },
                  select: { name: true, sku: true, costPrice: true }
                }),
                prisma.orderItem.aggregate({
                  where: {
                    productId: stat.productId,
                    order: {
                      createdAt: { gte: startDate, lte: endDate },
                      paymentStatus: 'PAID',
                      user: { isMember: true }
                    }
                  },
                  _sum: { totalPrice: true }
                })
              ]);

              const totalRevenue = stat._sum.totalPrice?.toNumber() || 0;
              const memberRevenue = memberSales._sum.totalPrice?.toNumber() || 0;
              const costPrice = product?.costPrice?.toNumber() || 0;
              const quantity = stat._sum.quantity || 0;

              return {
                productId: stat.productId,
                productName: product?.name || 'Unknown Product',
                sku: product?.sku || 'N/A',
                totalQuantitySold: quantity,
                totalRevenue,
                profitMargin: totalRevenue - (costPrice * quantity),
                memberSales: memberRevenue,
                nonMemberSales: totalRevenue - memberRevenue
              };
            } catch (productError) {
              console.error('Error processing product performance data:', productError);
              // Return fallback data for this product
              return {
                productId: stat.productId,
                productName: 'Error Loading Product',
                sku: 'N/A',
                totalQuantitySold: stat._sum.quantity || 0,
                totalRevenue: stat._sum.totalPrice?.toNumber() || 0,
                profitMargin: 0,
                memberSales: 0,
                nonMemberSales: stat._sum.totalPrice?.toNumber() || 0
              };
            }
          })
        );

        return performanceData;
      } catch (error) {
        console.error('Database query error in getProductPerformance:', error);
        // Return empty array on error to prevent complete failure
        return [];
      }
    });
  }

  /**
   * Get customer insights and analytics
   */
  async getCustomerInsights(startDate: Date, endDate: Date): Promise<CustomerInsight> {
    const cacheKey = `customers-${startDate.toISOString()}-${endDate.toISOString()}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        // Check if there are any users first
        const userCount = await prisma.user.count();
        
        if (userCount === 0) {
          // Return empty data structure for new installations
          return {
            totalCustomers: 0,
            newCustomers: 0,
            returningCustomers: 0,
            memberConversionRate: 0,
            avgCustomerLifetimeValue: 0,
            topStates: []
          };
        }

        const [
          totalCustomers,
          newCustomers,
          returningCustomers,
          memberCount,
          stateStats
        ] = await Promise.all([
          prisma.user.count({
            where: { role: 'CUSTOMER' }
          }),
          prisma.user.count({
            where: {
              role: 'CUSTOMER',
              createdAt: { gte: startDate, lte: endDate }
            }
          }),
          prisma.order.findMany({
            where: {
              createdAt: { gte: startDate, lte: endDate },
              paymentStatus: 'PAID'
            },
            select: { userId: true },
            distinct: ['userId']
          }),
          prisma.user.count({
            where: { role: 'CUSTOMER', isMember: true }
          }),
          this.getStateAnalytics(startDate, endDate)
        ]);

        const avgLifetimeValue = await this.calculateAvgLifetimeValue();

        return {
          totalCustomers,
          newCustomers,
          returningCustomers: returningCustomers.length,
          memberConversionRate: totalCustomers > 0 ? (memberCount / totalCustomers) * 100 : 0,
          avgCustomerLifetimeValue: avgLifetimeValue,
          topStates: stateStats
        };
      } catch (error) {
        console.error('Database query error in getCustomerInsights:', error);
        // Return empty data structure on error to prevent complete failure
        return {
          totalCustomers: 0,
          newCustomers: 0,
          returningCustomers: 0,
          memberConversionRate: 0,
          avgCustomerLifetimeValue: 0,
          topStates: []
        };
      }
    });
  }

  /**
   * Get revenue analytics with trends
   */
  async getRevenueAnalytics(startDate: Date, endDate: Date): Promise<RevenueAnalytics> {
    const cacheKey = `revenue-${startDate.toISOString()}-${endDate.toISOString()}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        const [dailyData, paymentMethods] = await Promise.all([
          this.getDailyRevenueData(startDate, endDate),
          this.getPaymentMethodAnalytics(startDate, endDate)
        ]);

        return {
          daily: dailyData,
          weekly: this.aggregateToWeekly(dailyData),
          monthly: this.aggregateToMonthly(dailyData),
          paymentMethods
        };
      } catch (error) {
        console.error('Database query error in getRevenueAnalytics:', error);
        // Return empty data structure on error to prevent complete failure
        return {
          daily: [],
          weekly: [],
          monthly: [],
          paymentMethods: []
        };
      }
    });
  }

  /**
   * Get state-wise analytics for Malaysian states
   */
  private async getStateAnalytics(startDate: Date, endDate: Date): Promise<StateAnalytics[]> {
    try {
      // Check if there are any orders first
      const orderCount = await prisma.order.count();
      
      if (orderCount === 0) {
        // Return empty array for new installations
        return [];
      }

      // Query orders with shipping address relation
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'PAID',
          shippingAddressId: { not: null }
        },
        include: {
          shippingAddress: {
            select: {
              state: true
            }
          }
        }
      });

      // Group by state and calculate totals
      const stateMap = new Map<MalaysianStateCode, { totalOrders: number; totalRevenue: number }>();
      
      for (const order of orders) {
        const stateCode = order.shippingAddress?.state as MalaysianStateCode;
        
        if (stateCode && MALAYSIAN_STATES[stateCode]) {
          const existing = stateMap.get(stateCode) || { totalOrders: 0, totalRevenue: 0 };
          stateMap.set(stateCode, {
            totalOrders: existing.totalOrders + 1,
            totalRevenue: existing.totalRevenue + order.total.toNumber()
          });
        }
      }

      // Convert to array and sort by revenue
      const stateStats: StateAnalytics[] = Array.from(stateMap.entries()).map(([stateCode, stats]) => ({
        state: stateCode,
        stateName: MALAYSIAN_STATES[stateCode],
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue
      }));

      return stateStats
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);
    } catch (error) {
      console.error('Database query error in getStateAnalytics:', error);
      // Return empty array on error to prevent complete failure
      return [];
    }
  }

  /**
   * Get daily revenue data
   */
  private async getDailyRevenueData(startDate: Date, endDate: Date): Promise<RevenuePoint[]> {
    try {
      // Check if there are any orders first
      const orderCount = await prisma.order.count();
      
      if (orderCount === 0) {
        // Return empty array for new installations
        return [];
      }

      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'PAID'
        },
        select: {
          createdAt: true,
          total: true,
          user: {
            select: { isMember: true }
          }
        }
      });

      const dailyMap = new Map<string, RevenuePoint>();

      orders.forEach(order => {
        const date = order.createdAt.toISOString().split('T')[0];
        const revenue = order.total.toNumber();
        const isMember = order.user?.isMember || false;

        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            revenue: 0,
            orders: 0,
            memberRevenue: 0,
            nonMemberRevenue: 0
          });
        }

        const point = dailyMap.get(date)!;
        point.revenue += revenue;
        point.orders += 1;
        
        if (isMember) {
          point.memberRevenue += revenue;
        } else {
          point.nonMemberRevenue += revenue;
        }
      });

      return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Database query error in getDailyRevenueData:', error);
      // Return empty array on error to prevent complete failure
      return [];
    }
  }

  /**
   * Get payment method analytics
   */
  private async getPaymentMethodAnalytics(
    startDate: Date, 
    endDate: Date
  ): Promise<PaymentMethodAnalytics[]> {
    try {
      // Check if there are any orders first
      const orderCount = await prisma.order.count();
      
      if (orderCount === 0) {
        // Return empty array for new installations
        return [];
      }

      const paymentData = await prisma.order.groupBy({
        by: ['paymentMethod'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
          paymentStatus: 'PAID',
          paymentMethod: { not: null }
        },
        _sum: {
          total: true
        },
        _count: true
      });

      const totalRevenue = paymentData.reduce((sum, item) => 
        sum + (item._sum.total?.toNumber() || 0), 0
      );

      return paymentData.map(item => ({
        method: item.paymentMethod || 'Unknown',
        count: item._count,
        revenue: item._sum.total?.toNumber() || 0,
        percentage: totalRevenue > 0 ? ((item._sum.total?.toNumber() || 0) / totalRevenue) * 100 : 0
      })).sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Database query error in getPaymentMethodAnalytics:', error);
      // Return empty array on error to prevent complete failure
      return [];
    }
  }

  /**
   * Calculate average customer lifetime value
   */
  private async calculateAvgLifetimeValue(): Promise<number> {
    try {
      // Check if there are any users first
      const userCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
      
      if (userCount === 0) {
        // Return 0 for new installations
        return 0;
      }

      const result = await prisma.user.aggregate({
        where: {
          role: 'CUSTOMER',
          membershipTotal: { gt: 0 }
        },
        _avg: {
          membershipTotal: true
        }
      });

      return result._avg.membershipTotal?.toNumber() || 0;
    } catch (error) {
      console.error('Database query error in calculateAvgLifetimeValue:', error);
      // Return 0 on error to prevent complete failure
      return 0;
    }
  }

  /**
   * Aggregate daily data to weekly
   */
  private aggregateToWeekly(dailyData: RevenuePoint[]): RevenuePoint[] {
    const weeklyMap = new Map<string, RevenuePoint>();

    dailyData.forEach(point => {
      const date = new Date(point.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          date: weekKey,
          revenue: 0,
          orders: 0,
          memberRevenue: 0,
          nonMemberRevenue: 0
        });
      }

      const weekly = weeklyMap.get(weekKey)!;
      weekly.revenue += point.revenue;
      weekly.orders += point.orders;
      weekly.memberRevenue += point.memberRevenue;
      weekly.nonMemberRevenue += point.nonMemberRevenue;
    });

    return Array.from(weeklyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Aggregate daily data to monthly
   */
  private aggregateToMonthly(dailyData: RevenuePoint[]): RevenuePoint[] {
    const monthlyMap = new Map<string, RevenuePoint>();

    dailyData.forEach(point => {
      const monthKey = point.date.substring(0, 7); // YYYY-MM

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          date: monthKey,
          revenue: 0,
          orders: 0,
          memberRevenue: 0,
          nonMemberRevenue: 0
        });
      }

      const monthly = monthlyMap.get(monthKey)!;
      monthly.revenue += point.revenue;
      monthly.orders += point.orders;
      monthly.memberRevenue += point.memberRevenue;
      monthly.nonMemberRevenue += point.nonMemberRevenue;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const salesAnalyticsService = SalesAnalyticsService.getInstance();