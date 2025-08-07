/**
 * Recent Activity Service for Social Proof
 * Tracks and displays recent customer activities to build trust and urgency
 */

import { prisma } from '@/lib/db/prisma';

export interface RecentPurchase {
  id: string;
  productName: string;
  productSlug: string;
  quantity: number;
  customerName?: string;
  customerLocation?: string;
  purchasedAt: Date;
  verified: boolean;
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  recentPurchases: number; // Last 24 hours
}

export class RecentActivityService {
  private readonly LOW_STOCK_THRESHOLD = 10;
  private readonly RECENT_HOURS = 24;
  private readonly MAX_RECENT_PURCHASES = 10;

  /**
   * Get recent purchases for social proof display
   */
  async getRecentPurchases(limit: number = 5): Promise<RecentPurchase[]> {
    const recentOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
        createdAt: {
          gte: new Date(Date.now() - this.RECENT_HOURS * 60 * 60 * 1000),
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit * 3, // Get more to filter and randomize
    });

    const recentPurchases: RecentPurchase[] = [];

    for (const order of recentOrders) {
      for (const item of order.orderItems) {
        if (recentPurchases.length >= limit) {
          break;
        }

        // Create anonymized customer name
        let customerName = 'Someone';
        if (order.user && Math.random() > 0.3) {
          // 70% chance to show name
          const firstName = order.user.firstName;
          const lastName = order.user.lastName;
          if (firstName && lastName) {
            customerName = `${firstName} ${lastName.charAt(0)}.`;
          } else if (firstName) {
            customerName = firstName;
          }
        }

        // Generate random location for demo purposes
        // In production, you might use real city data from user profiles
        const locations = [
          'Kuala Lumpur',
          'Selangor',
          'Penang',
          'Johor',
          'Perak',
          'Kedah',
          'Kelantan',
          'Terengganu',
          'Pahang',
          'Melaka',
          'Negeri Sembilan',
          'Perlis',
          'Sabah',
          'Sarawak',
        ];
        const customerLocation =
          locations[Math.floor(Math.random() * locations.length)];

        const purchaseData: RecentPurchase = {
          id: `${order.id}-${item.id}`,
          productName: item.productName,
          productSlug: item.product?.slug || '',
          quantity: item.quantity,
          purchasedAt: order.createdAt,
          verified: true,
        };

        // Only add optional properties if they have values
        if (Math.random() > 0.5) {
          purchaseData.customerName = customerName;
        }
        if (Math.random() > 0.4) {
          purchaseData.customerLocation = customerLocation;
        }

        recentPurchases.push(purchaseData);
      }
    }

    // Add some variety by shuffling the results
    return recentPurchases.sort(() => Math.random() - 0.5).slice(0, limit);
  }

  /**
   * Get stock alerts for products with low stock or high demand
   */
  async getStockAlerts(productIds?: string[]): Promise<StockAlert[]> {
    const whereClause = productIds
      ? { id: { in: productIds } }
      : { status: 'ACTIVE' as const };

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        orderItems: {
          where: {
            order: {
              createdAt: {
                gte: new Date(Date.now() - this.RECENT_HOURS * 60 * 60 * 1000),
              },
              status: {
                in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
              },
            },
          },
        },
      },
    });

    const stockAlerts: StockAlert[] = products.map(product => {
      const currentStock = product.stockQuantity;
      const recentPurchases =
        product.orderItems?.reduce(
          (total: number, item: any) => total + item.quantity,
          0
        ) || 0;

      return {
        productId: product.id,
        productName: product.name,
        currentStock,
        isLowStock:
          currentStock <= this.LOW_STOCK_THRESHOLD && currentStock > 0,
        isOutOfStock: currentStock <= 0,
        recentPurchases,
      };
    });

    // Filter to only show items with low stock or recent activity
    return stockAlerts.filter(
      alert =>
        alert.isLowStock || alert.isOutOfStock || alert.recentPurchases > 0
    );
  }

  /**
   * Get product popularity metrics
   */
  async getProductPopularity(productId: string): Promise<{
    viewsLast24h?: number;
    purchasesLast24h: number;
    totalPurchasesLastWeek: number;
    isPopular: boolean;
    isTrending: boolean;
  }> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get purchase data
    const [purchasesLast24h, totalPurchasesLastWeek] = await Promise.all([
      prisma.orderItem.aggregate({
        where: {
          productId,
          order: {
            createdAt: { gte: last24h },
            status: {
              in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
            },
          },
        },
        _sum: { quantity: true },
      }),

      prisma.orderItem.aggregate({
        where: {
          productId,
          order: {
            createdAt: { gte: lastWeek },
            status: {
              in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
            },
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const purchases24h = purchasesLast24h._sum.quantity || 0;
    const purchasesWeek = totalPurchasesLastWeek._sum.quantity || 0;

    return {
      purchasesLast24h: purchases24h,
      totalPurchasesLastWeek: purchasesWeek,
      isPopular: purchasesWeek >= 10, // 10+ purchases in a week
      isTrending: purchases24h >= 3, // 3+ purchases in 24h
    };
  }

  /**
   * Generate social proof message for a product
   */
  generateSocialProofMessage(
    stockAlert: StockAlert,
    popularity: {
      purchasesLast24h: number;
      totalPurchasesLastWeek: number;
      isPopular: boolean;
      isTrending: boolean;
    }
  ): string {
    const messages: string[] = [];

    // Stock-based messages
    if (stockAlert.isOutOfStock) {
      messages.push('Out of stock');
    } else if (stockAlert.isLowStock) {
      messages.push(`Only ${stockAlert.currentStock} left in stock!`);
    }

    // Popularity-based messages
    if (popularity.isTrending) {
      messages.push(
        `${popularity.purchasesLast24h} purchased in the last 24 hours`
      );
    } else if (popularity.isPopular) {
      messages.push(`${popularity.totalPurchasesLastWeek} sold this week`);
    }

    // Recent activity
    if (stockAlert.recentPurchases > 0) {
      messages.push(`${stockAlert.recentPurchases} recently purchased`);
    }

    return messages.join(' • ');
  }

  /**
   * Create fake recent purchases for demo purposes
   * In production, this should be removed and use real data
   */
  async createDemoRecentPurchases(): Promise<RecentPurchase[]> {
    const demoProducts = [
      'Premium Organic Coffee Beans',
      'Wireless Bluetooth Headphones',
      'Stainless Steel Water Bottle',
      'Eco-Friendly Bamboo Toothbrush',
      'Smart Fitness Tracker',
    ];

    const demoCustomers = [
      'Ahmad K.',
      'Siti N.',
      'Wei L.',
      'Priya S.',
      'David T.',
      'Someone from KL',
      'A customer',
      'Anonymous buyer',
    ];

    const locations = ['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak'];

    const demoPurchases: RecentPurchase[] = [];

    for (let i = 0; i < this.MAX_RECENT_PURCHASES; i++) {
      const minutesAgo = Math.floor(Math.random() * 1440); // Random time in last 24 hours
      const purchasedAt = new Date(Date.now() - minutesAgo * 60 * 1000);

      const demoPurchase: RecentPurchase = {
        id: `demo-${i}`,
        productName:
          demoProducts[Math.floor(Math.random() * demoProducts.length)],
        productSlug: `product-${i}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        purchasedAt,
        verified: true,
      };

      // Only add optional properties if they have values
      if (Math.random() > 0.3) {
        demoPurchase.customerName =
          demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
      }
      if (Math.random() > 0.4) {
        demoPurchase.customerLocation =
          locations[Math.floor(Math.random() * locations.length)];
      }

      demoPurchases.push(demoPurchase);
    }

    return demoPurchases.sort(
      (a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime()
    );
  }
}

// Export singleton instance
export const recentActivityService = new RecentActivityService();
