/**
 * Social Proof Service
 * Manages recently purchased items and stock level indicators
 */

import { prisma } from '@/lib/db/prisma';
import { OrderStatus } from '@prisma/client';

export interface RecentPurchase {
  productName: string;
  quantity: number;
  customerLocation: string; // City/State
  purchasedAt: Date;
  isAnonymized: boolean;
}

export interface StockLevel {
  productId: string;
  currentStock: number;
  isLowStock: boolean;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  lowStockThreshold: number;
}

export class SocialProofService {
  private readonly RECENT_PURCHASES_HOURS = 24;
  private readonly MAX_RECENT_PURCHASES = 5;

  /**
   * Get recent purchases for social proof display
   */
  async getRecentPurchases(productId?: string): Promise<RecentPurchase[]> {
    try {
      const hoursAgo = new Date(
        Date.now() - this.RECENT_PURCHASES_HOURS * 60 * 60 * 1000
      );

      const recentOrders = await prisma.orderItem.findMany({
        where: {
          ...(productId && { productId }),
          order: {
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.READY_TO_SHIP,
                OrderStatus.IN_TRANSIT,
                OrderStatus.OUT_FOR_DELIVERY,
                OrderStatus.DELIVERED,
              ],
            },
            createdAt: {
              gte: hoursAgo,
            },
          },
        },
        include: {
          order: {
            include: {
              shippingAddress: {
                select: {
                  city: true,
                  state: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: this.MAX_RECENT_PURCHASES,
      });

      return recentOrders.map(orderItem => ({
        productName: orderItem.productName,
        quantity: orderItem.quantity,
        customerLocation: this.anonymizeLocation(
          orderItem.order.shippingAddress?.city || 'Malaysia',
          orderItem.order.shippingAddress?.state || 'MY'
        ),
        purchasedAt: orderItem.createdAt,
        isAnonymized: true,
      }));
    } catch (error) {
      console.error('Error fetching recent purchases:', error);
      return [];
    }
  }

  /**
   * Get stock levels for products
   */
  async getStockLevels(
    productIds: string[]
  ): Promise<Record<string, StockLevel>> {
    try {
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          stockQuantity: true,
          lowStockAlert: true,
        },
      });

      const stockLevels: Record<string, StockLevel> = {};

      products.forEach(product => {
        const threshold = product.lowStockAlert;
        const stock = product.stockQuantity;

        stockLevels[product.id] = {
          productId: product.id,
          currentStock: stock,
          isLowStock: stock <= threshold && stock > 0,
          stockStatus:
            stock === 0
              ? 'out_of_stock'
              : stock <= threshold
                ? 'low_stock'
                : 'in_stock',
          lowStockThreshold: threshold,
        };
      });

      return stockLevels;
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      return {};
    }
  }

  /**
   * Get purchase count for last 24 hours for a product
   */
  async getPurchaseCount(productId: string): Promise<number> {
    try {
      const hoursAgo = new Date(
        Date.now() - this.RECENT_PURCHASES_HOURS * 60 * 60 * 1000
      );

      const count = await prisma.orderItem.count({
        where: {
          productId,
          order: {
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.READY_TO_SHIP,
                OrderStatus.IN_TRANSIT,
                OrderStatus.OUT_FOR_DELIVERY,
                OrderStatus.DELIVERED,
              ],
            },
            createdAt: {
              gte: hoursAgo,
            },
          },
        },
      });

      return count;
    } catch (error) {
      console.error('Error fetching purchase count:', error);
      return 0;
    }
  }

  /**
   * Get trending products based on recent purchases
   */
  async getTrendingProducts(limit: number = 10): Promise<
    Array<{
      productId: string;
      productName: string;
      purchaseCount: number;
      slug: string;
    }>
  > {
    try {
      const hoursAgo = new Date(
        Date.now() - this.RECENT_PURCHASES_HOURS * 60 * 60 * 1000
      );

      const trendingProducts = await prisma.orderItem.groupBy({
        by: ['productId', 'productName'],
        where: {
          order: {
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.READY_TO_SHIP,
                OrderStatus.IN_TRANSIT,
                OrderStatus.OUT_FOR_DELIVERY,
                OrderStatus.DELIVERED,
              ],
            },
            createdAt: {
              gte: hoursAgo,
            },
          },
        },
        _count: {
          productId: true,
        },
        orderBy: {
          _count: {
            productId: 'desc',
          },
        },
        take: limit,
      });

      // Get product details for trending items
      const productIds = trendingProducts.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
        },
        select: {
          id: true,
          slug: true,
        },
      });

      const productSlugs = products.reduce(
        (acc, product) => {
          acc[product.id] = product.slug;
          return acc;
        },
        {} as Record<string, string>
      );

      return trendingProducts.map(item => ({
        productId: item.productId,
        productName: item.productName,
        purchaseCount: item._count.productId,
        slug: productSlugs[item.productId] || '',
      }));
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    }
  }

  /**
   * Get social proof message for a product
   */
  getSocialProofMessage(stockLevel: StockLevel, purchaseCount: number): string {
    if (stockLevel.stockStatus === 'out_of_stock') {
      return 'Out of stock';
    }

    if (stockLevel.isLowStock) {
      return `Only ${stockLevel.currentStock} left in stock!`;
    }

    if (purchaseCount > 0) {
      return `${purchaseCount} people bought this in the last 24 hours`;
    }

    if (stockLevel.currentStock < 50) {
      return `${stockLevel.currentStock} in stock`;
    }

    return 'In stock';
  }

  /**
   * Anonymize customer location for privacy
   */
  private anonymizeLocation(city: string, state: string): string {
    // List of major Malaysian cities that can be shown
    const majorCities = [
      'Kuala Lumpur',
      'George Town',
      'Ipoh',
      'Shah Alam',
      'Petaling Jaya',
      'Klang',
      'Johor Bahru',
      'Subang Jaya',
      'Kuching',
      'Kota Kinabalu',
      'Seremban',
      'Kuantan',
      'Kota Bharu',
      'Alor Setar',
      'Malacca City',
    ];

    if (majorCities.includes(city)) {
      return city;
    }

    // For smaller cities, just show state
    const stateNames: Record<string, string> = {
      KUL: 'Kuala Lumpur',
      SEL: 'Selangor',
      JOH: 'Johor',
      MLK: 'Melaka',
      NSN: 'Negeri Sembilan',
      PHG: 'Pahang',
      PRK: 'Perak',
      PLS: 'Perlis',
      PNG: 'Pulau Pinang',
      KDH: 'Kedah',
      TRG: 'Terengganu',
      KTN: 'Kelantan',
      SBH: 'Sabah',
      SWK: 'Sarawak',
      LBN: 'Labuan',
    };

    return stateNames[state] || 'Malaysia';
  }
}

// Export singleton instance
export const socialProofService = new SocialProofService();
