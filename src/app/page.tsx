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
  isActive: boolean;
}

export default function HomePage() {
  const { data: session } = useSession();
  const { addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [siteTheme, setSiteTheme] = useState<SiteTheme | null>(null);
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Generate SEO data for homepage
  const seoData = SEOService.getHomepageSEO();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Use service layer for data fetching with built-in error handling and caching
        const [products, categories, customizationResponse] = await Promise.all(
          [
            productService.getFeaturedProducts(8),
            categoryService.getCategories({ includeProductCount: true }),
            fetch('/api/site-customization/current'), // Keep customization API until we create a service for it
          ]
        );

        setFeaturedProducts(products);
        setCategories(categories.slice(0, 6));

        if (customizationResponse.ok) {
          const customizationData = await customizationResponse.json();
          setSiteTheme(customizationData.theme);
          setHeroSection(customizationData.heroSection);
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
          isLoggedIn={isLoggedIn}
          isMember={isMember}
        />
        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Why Choose JRM E-commerce?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Experience the best of Malaysian online shopping with features
                designed for local needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Smart Membership</h3>
                  <p className="text-sm text-gray-600">
                    Automatic member pricing when you spend RM 80 or more
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Fast Delivery</h3>
                  <p className="text-sm text-gray-600">
                    Free shipping nationwide for orders over RM 150
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Secure Payment</h3>
                  <p className="text-sm text-gray-600">
                    Malaysian payment gateways with bank-level security
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Quality Guarantee</h3>
                  <p className="text-sm text-gray-600">
                    1-year warranty on all products with easy returns
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover our wide range of products across various categories
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {categories.map(category => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.id}`}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-2">{category.name}</h3>
                        <p className="text-sm text-gray-600">
                          {category.productCount || 0} products
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.slice(0, 4).map(product => {
                  const handleAddToCart = async (productId: string) => {
                    if (!isLoggedIn) {
                      window.location.href = '/auth/signin';
                      return;
                    }

                    try {
                      await addToCart(productId, 1);
                    } catch (error) {
                      // Error handling is done in the useCart hook
                      console.error('Add to cart failed:', error);
                    }
                  };

                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      size="md"
                      showDescription={false}
                      showRating={true}
                    />
                  );
                })}
              </div>
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
            <ProductRecommendations type="general" limit={8} />
          </div>
        </section>
      </div>
    </div>
  );
}
