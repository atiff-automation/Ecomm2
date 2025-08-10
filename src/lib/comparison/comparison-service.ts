/**
 * Product Comparison Service
 * Handles product comparison functionality for customers
 */

import { prisma } from '@/lib/db/prisma';

export interface ComparisonProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  regularPrice: number;
  memberPrice: number;
  images: string[];
  categories: Array<{
    category: {
      id: string;
      name: string;
    };
  }>;
  specifications: Record<string, string>;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
}

export class ComparisonService {
  private readonly MAX_COMPARISON_PRODUCTS = 4;

  /**
   * Get products for comparison
   */
  async getComparisonProducts(
    productIds: string[]
  ): Promise<ComparisonProduct[]> {
    try {
      if (productIds.length > this.MAX_COMPARISON_PRODUCTS) {
        throw new Error(
          `Maximum ${this.MAX_COMPARISON_PRODUCTS} products allowed for comparison`
        );
      }

      const products = await prisma.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          status: 'ACTIVE',
        },
        include: {
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
          images: {
            select: {
              url: true,
            },
          },
        },
      });

      return products.map(product => {
        const ratings = product.reviews.map(r => r.rating);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;

        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          regularPrice: Number(product.regularPrice),
          memberPrice: Number(product.memberPrice),
          images: product.images.map(img => img.url),
          categories: product.categories.map(cat => ({
            category: {
              id: cat.category.id,
              name: cat.category.name,
            },
          })),
          specifications: {},
          stockQuantity: product.stockQuantity,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product.reviews.length,
        };
      });
    } catch (error) {
      console.error('Error fetching comparison products:', error);
      throw new Error('Failed to fetch products for comparison');
    }
  }

  /**
   * Get comparison table data with unified specifications
   */
  async getComparisonTable(productIds: string[]): Promise<{
    products: ComparisonProduct[];
    specifications: Array<{
      key: string;
      label: string;
      values: Record<string, string | number | null>;
    }>;
  }> {
    const products = await this.getComparisonProducts(productIds);

    // Collect all specification keys from all products
    const allSpecKeys = new Set<string>();
    products.forEach(product => {
      Object.keys(product.specifications).forEach(key => {
        allSpecKeys.add(key);
      });
    });

    // Add common product attributes as specifications
    const commonSpecs = [
      { key: 'price_regular', label: 'Regular Price' },
      { key: 'price_member', label: 'Member Price' },
      { key: 'stock', label: 'Stock Quantity' },
      { key: 'rating', label: 'Average Rating' },
      { key: 'reviews', label: 'Total Reviews' },
      { key: 'category', label: 'Category' },
    ];

    const specifications = [
      ...commonSpecs.map(spec => ({
        key: spec.key,
        label: spec.label,
        values: products.reduce(
          (acc, product) => {
            switch (spec.key) {
              case 'price_regular':
                acc[product.id] = `RM ${product.regularPrice.toFixed(2)}`;
                break;
              case 'price_member':
                acc[product.id] = `RM ${product.memberPrice.toFixed(2)}`;
                break;
              case 'stock':
                acc[product.id] = product.stockQuantity;
                break;
              case 'rating':
                acc[product.id] =
                  product.averageRating > 0
                    ? `${product.averageRating}/5`
                    : 'No ratings';
                break;
              case 'reviews':
                acc[product.id] = product.reviewCount;
                break;
              case 'category':
                acc[product.id] = product.categories?.[0]?.category?.name || 'Uncategorized';
                break;
              default:
                acc[product.id] = null;
            }
            return acc;
          },
          {} as Record<string, string | number | null>
        ),
      })),
      ...Array.from(allSpecKeys).map(specKey => ({
        key: specKey,
        label: this.formatSpecificationLabel(specKey),
        values: products.reduce(
          (acc, product) => {
            acc[product.id] = product.specifications[specKey] || null;
            return acc;
          },
          {} as Record<string, string | number | null>
        ),
      })),
    ];

    return {
      products,
      specifications,
    };
  }

  /**
   * Get similar products for comparison suggestions
   */
  async getSimilarProductsForComparison(
    productId: string,
    limit: number = 6
  ): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      regularPrice: number;
      memberPrice: number;
      images: string[];
      category: string;
    }>
  > {
    try {
      // Get the current product's categories
      const currentProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!currentProduct) {
        return [];
      }

      // Get similar products from the same categories
      const categoryIds = currentProduct.categories.map(cat => cat.category.id);
      const similarProducts = await prisma.product.findMany({
        where: {
          categories: {
            some: {
              categoryId: {
                in: categoryIds,
              },
            },
          },
          id: {
            not: productId, // Exclude the current product
          },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          regularPrice: true,
          memberPrice: true,
          images: {
            select: {
              url: true,
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return similarProducts.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        regularPrice: Number(product.regularPrice),
        memberPrice: Number(product.memberPrice),
        images: product.images.map(img => img.url),
        category: product.categories?.[0]?.category?.name || 'Uncategorized',
      }));
    } catch (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
  }

  /**
   * Format specification key to human-readable label
   */
  private formatSpecificationLabel(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get maximum number of products allowed for comparison
   */
  getMaxComparisonProducts(): number {
    return this.MAX_COMPARISON_PRODUCTS;
  }
}

// Export singleton instance
export const comparisonService = new ComparisonService();
