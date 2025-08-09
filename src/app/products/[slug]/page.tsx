/**
 * Product Detail Page - Malaysian E-commerce Platform
 * Comprehensive product view with reviews, pricing, and membership benefits
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  Award,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { getBestPrice, calculatePromotionStatus, getPromotionDisplayText } from '@/lib/promotions/promotion-utils';
import { canUserAccessProduct, getEarlyAccessPrice, calculateEarlyAccessStatus } from '@/lib/member/early-access-utils';

interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  regularPrice: number;
  memberPrice: number;
  images: ProductImage[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  regularPrice: number;
  memberPrice: number;
  stockQuantity: number;
  lowStockAlert: number;
  weight?: number;
  dimensions?: string;
  featured: boolean;
  isPromotional: boolean;
  isQualifyingForMembership: boolean;
  promotionalPrice?: number | null;
  promotionStartDate?: string | null;
  promotionEndDate?: string | null;
  memberOnlyUntil?: string | null;
  earlyAccessStart?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  category: {
    id: string;
    name: string;
    slug: string;
    
  };
  images: ProductImage[];
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
  relatedProducts: RelatedProduct[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const slug = params.slug as string;
  const isLoggedIn = !!session?.user;
  const isMember = session?.user?.isMember;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/products/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          }
          throw new Error('Failed to load product');
        }

        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!product) {
      return;
    }

    setAddingToCart(true);
    try {
      // TODO: Implement add to cart API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success(
        `Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart`
      );
    } catch {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) {
      return;
    }

    const validQuantity = Math.max(
      1,
      Math.min(newQuantity, product.stockQuantity)
    );
    setQuantity(validQuantity);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-12 bg-gray-200 rounded w-1/3" />
              <div className="h-10 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || 'The product you are looking for does not exist.'}
          </p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stockQuantity === 0;
  
  // Check early access permissions
  const canAccess = canUserAccessProduct(product, isMember);
  const earlyAccessStatus = calculateEarlyAccessStatus(product);
  
  // Calculate best price using promotional and early access logic
  const priceInfo = getBestPrice(product, isMember);
  const earlyAccessPrice = getEarlyAccessPrice(product, isMember);
  const promotionStatus = calculatePromotionStatus(product);
  const promotionText = getPromotionDisplayText(promotionStatus);
  
  // Use early access price if applicable
  const finalPrice = earlyAccessPrice.hasEarlyAccess ? earlyAccessPrice : priceInfo;
  
  // Handle restricted access
  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
            <div className="text-2xl">🔒</div>
          </div>
          <h1 className="text-2xl font-bold mb-4">Members Only</h1>
          <p className="text-muted-foreground mb-6">
            This product is currently available for members only
            {product.memberOnlyUntil && (
              <span> until {new Date(product.memberOnlyUntil).toLocaleDateString('en-MY')}</span>
            )}
          </p>
          <div className="space-y-3">
            <Link href="/membership">
              <Button className="w-full">Join Membership</Button>
            </Link>
            <Link href="/products">
              <Button variant="outline" className="w-full">
                Browse Other Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const isLowStock =
    product.stockQuantity <= product.lowStockAlert && product.stockQuantity > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-primary">
            Products
          </Link>
          <span>/</span>
          <Link
            href={`/products?category=${product.category.id}`}
            className="hover:text-primary"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square relative overflow-hidden rounded-lg border">
            {product.images.length > 0 ? (
              <Image
                src={
                  product.images[selectedImageIndex]?.url ||
                  product.images[0].url
                }
                alt={
                  product.images[selectedImageIndex]?.altText || product.name
                }
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}

            {/* Image Navigation */}
            {product.images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2"
                  onClick={() =>
                    setSelectedImageIndex(prev =>
                      prev === 0 ? product.images.length - 1 : prev - 1
                    )
                  }
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  onClick={() =>
                    setSelectedImageIndex(prev =>
                      prev === product.images.length - 1 ? 0 : prev + 1
                    )
                  }
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 relative rounded border-2 overflow-hidden ${
                    selectedImageIndex === index
                      ? 'border-primary'
                      : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.altText || product.name}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.featured && (
                <Badge variant="secondary" className="bg-yellow-500 text-white">
                  <Award className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {product.isPromotional && (
                <Badge variant="destructive">Promotion</Badge>
              )}
              {isLowStock && (
                <Badge
                  variant="outline"
                  className="text-orange-600 border-orange-600"
                >
                  Low Stock
                </Badge>
              )}
              {isOutOfStock && (
                <Badge
                  variant="outline"
                  className="text-red-600 border-red-600"
                >
                  Out of Stock
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>

          {/* Rating */}
          {product.averageRating > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= product.averageRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="font-medium ml-1">
                  {product.averageRating}
                </span>
              </div>
              <span className="text-muted-foreground">
                ({product.reviewCount}{' '}
                {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-3xl font-bold ${
                  finalPrice.priceType === 'early-access' ? 'text-purple-600' :
                  finalPrice.priceType === 'promotional' ? 'text-red-600' : 
                  finalPrice.priceType === 'member' ? 'text-green-600' : 
                  'text-gray-900'
                }`}>
                  {formatPrice(finalPrice.price)}
                </span>
                {finalPrice.priceType === 'early-access' && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Early Access
                  </Badge>
                )}
                {finalPrice.priceType === 'promotional' && (
                  <Badge variant="destructive" className="bg-red-500 text-white">
                    {promotionText || 'Special Price'}
                  </Badge>
                )}
                {finalPrice.priceType === 'member' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Member Price
                  </Badge>
                )}
                {earlyAccessStatus.isMemberOnly && !isMember && (
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-500">
                    Members Only
                  </Badge>
                )}
                {earlyAccessStatus.isEarlyAccessPromotion && isMember && (
                  <Badge variant="secondary" className="bg-purple-500 text-white">
                    Early Access Active
                  </Badge>
                )}
                {promotionStatus.isScheduled && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    {promotionText || 'Coming Soon'}
                  </Badge>
                )}
                {product.isQualifyingForMembership && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    ✓ Membership Qualifying
                  </Badge>
                )}
              </div>
              
              {/* Original price and savings */}
              {priceInfo.savings > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(finalPrice.originalPrice)}
                  </span>
                  <span className={`font-medium ${
                    finalPrice.priceType === 'early-access' ? 'text-purple-600' :
                    finalPrice.priceType === 'promotional' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    You save {formatPrice(finalPrice.savings)}
                  </span>
                </div>
              )}
              
              {/* Member price preview for non-members */}
              {!isMember && finalPrice.priceType === 'regular' && product.memberPrice < product.regularPrice && !promotionStatus.isActive && !earlyAccessStatus.isMemberOnly && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>
                      Member price: {formatPrice(product.memberPrice)}
                    </strong>
                    <br />
                    Save {formatPrice(product.regularPrice - product.memberPrice)} with membership
                  </p>
                </div>
              )}
              
              {/* Early access information */}
              {earlyAccessStatus.isEarlyAccessPromotion && (
                <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800">
                    <strong>🎆 Early Access Promotion</strong>
                    <br />
                    {isMember 
                      ? 'You have early access to this promotion!' 
                      : `Members get early access starting ${earlyAccessStatus.earlyAccessStart?.toLocaleDateString('en-MY')}`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="font-medium">Quantity:</label>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stockQuantity}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {product.stockQuantity} available
              </span>
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4 text-green-600" />
              <span>Free shipping for orders over RM 150</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>1 year warranty included</span>
            </div>
            {product.category.isQualifyingCategory && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-purple-600" />
                <span>Qualifies for membership benefits</span>
              </div>
            )}
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <div>
              <h3 className="font-semibold mb-2">Overview</h3>
              <p className="text-muted-foreground">
                {product.shortDescription}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs defaultValue="description" className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({product.reviewCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <Card>
            <CardContent className="p-6">
              {product.description ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{product.description}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No description available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Product Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>SKU:</span>
                      <span>{product.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span>{product.category.name}</span>
                    </div>
                    {product.weight && (
                      <div className="flex justify-between">
                        <span>Weight:</span>
                        <span>{product.weight} kg</span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex justify-between">
                        <span>Dimensions:</span>
                        <span>{product.dimensions}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Availability</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span
                        className={
                          isOutOfStock
                            ? 'text-red-600'
                            : isLowStock
                              ? 'text-orange-600'
                              : 'text-green-600'
                        }
                      >
                        {isOutOfStock
                          ? 'Out of Stock'
                          : `${product.stockQuantity} available`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-green-600">In Production</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {product.reviews.length > 0 ? (
                <div className="space-y-6">
                  {product.reviews.map(review => (
                    <div
                      key={review.id}
                      className="border-b pb-6 last:border-b-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">
                            {review.user.name}
                          </span>
                          {review.isVerifiedPurchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-semibold mb-2">{review.title}</h4>
                      )}
                      {review.comment && (
                        <p className="text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No reviews yet. Be the first to review this product!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      {product.relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.relatedProducts.map(relatedProduct => {
              const primaryImage =
                relatedProduct.images.find(img => img.isPrimary) ||
                relatedProduct.images[0];

              return (
                <Card
                  key={relatedProduct.id}
                  className="group hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={relatedProduct.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <Link href={`/products/${relatedProduct.slug}`}>
                      <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                        {relatedProduct.name}
                      </h3>
                    </Link>
                    <div className="mt-2">
                      <span className="font-bold">
                        {formatPrice(relatedProduct.regularPrice)}
                      </span>
                      {relatedProduct.memberPrice <
                        relatedProduct.regularPrice && (
                        <div className="text-xs text-muted-foreground">
                          Member: {formatPrice(relatedProduct.memberPrice)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
