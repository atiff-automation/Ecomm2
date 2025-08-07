/**
 * Homepage - Malaysian E-commerce Platform
 * Features hero section, featured products, categories, and membership benefits
 */

'use client';

import { useState, useEffect } from 'react';
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
  category: {
    name: string;
    slug: string;
  };
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

export default function HomePage() {
  const { data: session } = useSession();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  // Generate SEO data for homepage
  const seoData = SEOService.getHomepageSEO();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/products?featured=true&limit=8'),
          fetch('/api/categories?includeProductCount=true'),
        ]);

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setFeaturedProducts(productsData.products);
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories.slice(0, 6));
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
    <>
      <SEOHead seo={seoData} />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative container mx-auto px-4 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Welcome to{' '}
                  <span className="text-yellow-300">JRM E-commerce</span>
                </h1>
                <p className="text-xl text-blue-100 max-w-lg">
                  Malaysia&apos;s premier online marketplace with intelligent
                  membership benefits, dual pricing, and local payment
                  integration.
                </p>

                {!isLoggedIn ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/auth/signup">
                      <Button
                        size="lg"
                        className="bg-yellow-500 text-blue-900 hover:bg-yellow-400"
                      >
                        Join as Member
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button
                        size="lg"
                        variant="outline"
                        className="text-white border-white hover:bg-white hover:text-blue-800"
                      >
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/products">
                      <Button
                        size="lg"
                        className="bg-yellow-500 text-blue-900 hover:bg-yellow-400"
                      >
                        Shop Now
                        <ShoppingBag className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    {isMember && (
                      <div className="flex items-center gap-2 text-yellow-300">
                        <Award className="w-5 h-5" />
                        <span className="font-medium">
                          Member Benefits Active
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Search Bar */}
                <div className="max-w-lg mx-auto lg:mx-0 mt-6">
                  <SearchBar
                    placeholder="Search products, brands, categories..."
                    className="w-full"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-300">
                        10K+
                      </div>
                      <div className="text-sm text-blue-100">
                        Happy Customers
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-300">
                        5K+
                      </div>
                      <div className="text-sm text-blue-100">Products</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-300">
                        98%
                      </div>
                      <div className="text-sm text-blue-100">Satisfaction</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-300">
                        24/7
                      </div>
                      <div className="text-sm text-blue-100">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                  const primaryImage =
                    product.images.find(img => img.isPrimary) ||
                    product.images[0];

                  return (
                    <Card
                      key={product.id}
                      className="group hover:shadow-lg transition-shadow"
                    >
                      <div className="relative aspect-square overflow-hidden">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.altText || product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                          </div>
                        )}

                        <div className="absolute top-2 left-2">
                          <Badge className="bg-blue-600">Featured</Badge>
                        </div>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <WishlistButton
                            productId={product.id}
                            size="sm"
                            variant="secondary"
                            className="w-8 h-8 p-0 bg-white/90 hover:bg-white"
                          />
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            {product.category.name}
                          </p>

                          <Link href={`/products/${product.slug}`}>
                            <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                          </Link>

                          {product.averageRating > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= product.averageRating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                ({product.reviewCount})
                              </span>
                            </div>
                          )}

                          <CompactPriceDisplay
                            regularPrice={product.regularPrice}
                            memberPrice={product.memberPrice}
                            isMember={isMember || false}
                            isLoggedIn={isLoggedIn}
                          />

                          <Button
                            className="w-full"
                            onClick={async () => {
                              if (!isLoggedIn) {
                                window.location.href = '/auth/signin';
                                return;
                              }

                              try {
                                const response = await fetch('/api/cart', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    productId: product.id,
                                    quantity: 1,
                                  }),
                                });

                                if (response.ok) {
                                  // TODO: Add toast notification here
                                  // Success handled silently for now
                                } else {
                                  const data = await response.json();
                                  alert(
                                    data.message || 'Failed to add to cart'
                                  );
                                }
                              } catch {
                                alert('Failed to add to cart');
                              }
                            }}
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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
    </>
  );
}
