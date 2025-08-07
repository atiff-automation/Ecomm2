/**
 * Admin Product View Page - JRM E-commerce Platform
 * Detailed view of a single product for admin users
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Edit,
  Eye,
  Package,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

interface ProductImage {
  url: string;
  altText: string;
  isPrimary: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  regularPrice: number;
  memberPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockAlert: number;
  weight?: number;
  dimensions?: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
  images: ProductImage[];
}

export default function ProductViewPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);

      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      } else {
        setError('Failed to load product');
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'DRAFT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatus = () => {
    if (!product) {
      return null;
    }

    if (product.stockQuantity === 0) {
      return { text: 'Out of Stock', color: 'text-red-600', icon: AlertCircle };
    } else if (product.stockQuantity <= product.lowStockAlert) {
      return { text: 'Low Stock', color: 'text-yellow-600', icon: Clock };
    } else {
      return { text: 'In Stock', color: 'text-green-600', icon: CheckCircle };
    }
  };

  const stockStatus = getStockStatus();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">
            {error || "The product you're looking for doesn't exist."}
          </p>
          <Button asChild>
            <Link href="/admin/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin/inventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-600">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href={`/admin/products/${product.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/products/${product.slug}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              View Live
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
              {product.images && product.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.images.map((image, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={image.url}
                        alt={image.altText}
                        width={300}
                        height={300}
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      {image.isPrimary && (
                        <Badge className="absolute top-2 left-2 bg-blue-600">
                          Primary
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p>No images uploaded for this product</p>
                  <p className="text-sm text-gray-400">
                    Use the edit page to add images
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Description */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.shortDescription && (
                <div>
                  <h4 className="font-medium mb-2">Short Description</h4>
                  <p className="text-gray-700">{product.shortDescription}</p>
                </div>
              )}

              {product.description && (
                <div>
                  <h4 className="font-medium mb-2">Full Description</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}

              {product.dimensions && (
                <div>
                  <h4 className="font-medium mb-2">Dimensions</h4>
                  <p className="text-gray-700">{product.dimensions}</p>
                </div>
              )}

              {product.weight && (
                <div>
                  <h4 className="font-medium mb-2">Weight</h4>
                  <p className="text-gray-700">{product.weight} kg</p>
                </div>
              )}

              {product.barcode && (
                <div>
                  <h4 className="font-medium mb-2">Barcode</h4>
                  <p className="font-mono text-gray-700">{product.barcode}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-gray-600">
                    {formatDate(product.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <p className="text-gray-600">
                    {formatDate(product.updatedAt)}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <p className="text-gray-600">{product.category.name}</p>
                </div>
                <div>
                  <span className="font-medium">URL Slug:</span>
                  <p className="text-gray-600 font-mono">{product.slug}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium">Status</span>
                <div className="mt-1">
                  <Badge className={getStatusColor(product.status)}>
                    {product.status}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-sm font-medium">Featured Product</span>
                <div className="mt-1">
                  <Badge variant={product.featured ? 'default' : 'secondary'}>
                    {product.featured ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium">Regular Price</span>
                <p className="text-lg font-bold">
                  {formatCurrency(product.regularPrice)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Member Price</span>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(product.memberPrice)}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium">Cost Price</span>
                <p className="text-sm text-gray-600">
                  {formatCurrency(product.costPrice)}
                </p>
              </div>
              <div className="pt-2 border-t">
                <span className="text-sm font-medium">Profit Margin</span>
                <p className="text-sm font-medium">
                  {(
                    ((product.regularPrice - product.costPrice) /
                      product.regularPrice) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium">Stock Quantity</span>
                <p className="text-2xl font-bold">{product.stockQuantity}</p>
              </div>

              {stockStatus && (
                <div className="flex items-center space-x-2">
                  <stockStatus.icon
                    className={`h-4 w-4 ${stockStatus.color}`}
                  />
                  <span className={`text-sm font-medium ${stockStatus.color}`}>
                    {stockStatus.text}
                  </span>
                </div>
              )}

              <div>
                <span className="text-sm font-medium">Low Stock Alert</span>
                <p className="text-sm text-gray-600">
                  {product.lowStockAlert} units
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
