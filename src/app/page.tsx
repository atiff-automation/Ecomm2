/**
 * Homepage - Malaysian E-commerce Platform
 * Features hero section, featured products, categories, and membership benefits
 */

'use client';

import React, { useState, useEffect } from 'react';
import SEOHead from '@/components/seo/SEOHead';
import { SEOService } from '@/lib/seo/seo-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Star,
  Users,
  Truck,
  Shield,
  Award,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { SearchBar } from '@/components/search/SearchBar';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { ProductRecommendations } from '@/components/product/ProductRecommendations';
import { CompactPriceDisplay } from '@/components/pricing/PriceDisplay';
import { DynamicHeroSection } from '@/components/homepage/DynamicHeroSection';
import { ProductCard } from '@/components/product/ProductCard';
import { productService } from '@/lib/services/product-service';
import { categoryService } from '@/lib/services/category-service';
import { useCart } from '@/hooks/use-cart';
import config from '@/lib/config/app-config';
import { ProductGrid } from '@/components/ui/layout';

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  regularPrice: number;
  memberPrice: number;
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  isPromotional: boolean;
  isQualifyingForMembership: boolean;
  promotionalPrice?: number | null;
  promotionStartDate?: string | null;
  promotionEndDate?: string | null;
  memberOnlyUntil?: string | null;
  earlyAccessStart?: string | null;
  stockQuantity: number;
  categories: Array<{
    category: {
      name: string;
      slug: string;
    };
  }>;
  images: Array<{
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface SiteTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}

interface HeroSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  backgroundType: 'IMAGE' | 'VIDEO';
  backgroundImage?: string | null;
  backgroundVideo?: string | null;
  overlayOpacity: number;
  textAlignment: 'left' | 'center' | 'right';
  showTitle: boolean;
  showCTA: boolean;
  isActive: boolean;
}

export default function HomePage() {
  const { data: session } = useSession();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [promotionalProducts, setPromotionalProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteTheme, setSiteTheme] = useState<SiteTheme | null>(null);
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [sliderConfig, setSliderConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Generate SEO data for homepage
  const seoData = SEOService.getHomepageSEO();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Use service layer for data fetching with built-in error handling and caching
        const [
          products,
          promotionalProducts,
          categories,
          customizationResponse,
        ] = await Promise.all([
          productService.getFeaturedProducts(8),
          productService.getPromotionalProducts(8),
          categoryService.getCategories({ includeProductCount: true }),
          fetch('/api/site-customization/current'), // Keep customization API until we create a service for it
        ]);

        setFeaturedProducts(products);
        setPromotionalProducts(promotionalProducts);
        setCategories(categories.slice(0, 6));

        if (customizationResponse.ok) {
          const customizationData = await customizationResponse.json();
          console.log('🎨 Hero Section Data:', customizationData.heroSection);
          console.log(
            '🖼️ Background Image URL:',
            customizationData.heroSection?.backgroundImage
          );
          setSiteTheme(customizationData.theme);
          setHeroSection(customizationData.heroSection);
          setSliderConfig(customizationData.sliderConfig);
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div>
      <SEOHead seo={seoData} />
      <div className="min-h-screen">
        {/* Dynamic Hero Section */}
        <DynamicHeroSection
          key={heroSection?.id || 'default'}
          heroSection={heroSection}
          siteTheme={siteTheme}
          sliderConfig={sliderConfig}
          isLoggedIn={isLoggedIn}
          isMember={isMember}
        />

        {/* On Promotion Section */}
        <section className="py-16 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Percent className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-red-800">
                    On Promotion
                  </h2>
                </div>
                <p className="text-gray-600">
                  Limited time offers with amazing discounts and special deals
                </p>
              </div>
              <Link href="/products?promotional=true">
                <Button
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  View All Deals
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <ProductGrid>
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-6 bg-gray-200 rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </ProductGrid>
            ) : promotionalProducts.length > 0 ? (
              <ProductGrid>
                {promotionalProducts.slice(0, 4).map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={async (productId: string) => {
                      try {
                        await addToCart(productId, 1);
                      } catch (error) {
                        console.error('Add to cart failed:', error);
                      }
                    }}
                    size="md"
                    showDescription={false}
                    showRating={true}
                  />
                ))}
              </ProductGrid>
            ) : (
              <div className="text-center py-12">
                <Percent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  No promotional products available at the moment.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Check back soon for amazing deals and discounts!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
                <p className="text-gray-600">
                  Handpicked products with the best value and quality
                </p>
              </div>
              <Link href="/products?featured=true">
                <Button variant="outline">
                  View All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <ProductGrid>
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-200" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-6 bg-gray-200 rounded w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </ProductGrid>
            ) : featuredProducts.length > 0 ? (
              <ProductGrid>
                {featuredProducts.slice(0, 4).map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={async (productId: string) => {
                      try {
                        await addToCart(productId, 1);
                      } catch (error) {
                        console.error('Add to cart failed:', error);
                      }
                    }}
                    size="md"
                    showDescription={false}
                    showRating={true}
                  />
                ))}
              </ProductGrid>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No featured products available at the moment.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Membership CTA Section */}
        {!isMember && (
          <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="container mx-auto px-4 text-center">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold mb-4">
                  Unlock Member Benefits Today!
                </h2>
                <p className="text-xl text-blue-100 mb-8">
                  Spend RM 80 or more and automatically enjoy member pricing on
                  all future purchases. Save up to 15% on every order!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!isLoggedIn ? (
                    <>
                      <Link href="/auth/signup">
                        <Button
                          size="lg"
                          className="bg-yellow-500 text-blue-900 hover:bg-yellow-400"
                        >
                          Sign Up Now
                        </Button>
                      </Link>
                      <Link href="/auth/signin">
                        <Button
                          size="lg"
                          variant="outline"
                          className="text-white border-white hover:bg-white hover:text-blue-800"
                        >
                          Sign In
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href="/products">
                      <Button
                        size="lg"
                        className="bg-yellow-500 text-blue-900 hover:bg-yellow-400"
                      >
                        Start Shopping
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recently Viewed Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <RecentlyViewed limit={6} />
          </div>
        </section>

        {/* Product Recommendations */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <ProductRecommendations
              type="general"
              limit={Math.floor(config.ui.pagination.defaultPageSize / 2.5)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
