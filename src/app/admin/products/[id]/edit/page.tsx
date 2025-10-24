/**
 * Admin Product Edit Page - JRM E-commerce Platform
 * Uses unified ProductForm component following @CLAUDE.md principles
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { toast } from 'sonner';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  barcode: string;
  categoryIds: string[];
  regularPrice: number | string;
  memberPrice: number | string;
  stockQuantity: number;
  lowStockAlert: number;
  weight: number | string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  featured: boolean;
  isPromotional: boolean;
  isQualifyingForMembership: boolean;
  promotionalPrice?: number;
  promotionStartDate?: Date;
  promotionEndDate?: Date;
  memberOnlyUntil?: Date;
  earlyAccessStart?: Date;
  images: Array<{
    url: string;
    altText?: string;
    isPrimary: boolean;
  }>;
}

interface ProductCategory {
  category: {
    id: string;
    name: string;
  };
}

interface ProductImage {
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<ProductFormData>>({});

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        const product = data.product;

        // Transform the product data to match our form structure
        const productData: Partial<ProductFormData> = {
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          categoryIds:
            product.categories?.map((cat: ProductCategory) => cat.category.id) || [],
          regularPrice: product.regularPrice || '',
          memberPrice: product.memberPrice || '',
          stockQuantity: product.stockQuantity || 0,
          lowStockAlert: product.lowStockAlert || 10,
          weight: product.weight || 0,
          length: product.dimensions?.length || '',
          width: product.dimensions?.width || '',
          height: product.dimensions?.height || '',
          status: product.status || 'DRAFT',
          featured: product.featured || false,
          isPromotional: product.isPromotional || false,
          isQualifyingForMembership: product.isQualifyingForMembership || false,
          promotionalPrice: product.promotionalPrice || 0,
          promotionStartDate: product.promotionStartDate
            ? new Date(product.promotionStartDate)
            : undefined,
          promotionEndDate: product.promotionEndDate
            ? new Date(product.promotionEndDate)
            : undefined,
          memberOnlyUntil: product.memberOnlyUntil
            ? new Date(product.memberOnlyUntil)
            : undefined,
          earlyAccessStart: product.earlyAccessStart
            ? new Date(product.earlyAccessStart)
            : undefined,
          images:
            product.images?.map((img: ProductImage, index: number) => ({
              url: img.url,
              altText: img.altText || product.name,
              isPrimary: index === 0,
              // Add missing properties for existing images
              filename: img.url?.split('/').pop() || 'unknown',
              size: 0, // Unknown size for existing images
              width: 0, // Unknown dimensions for existing images
              height: 0,
            })) || [],
        };

        setInitialData(productData);
      } else {
        toast.error('Product not found');
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product data');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: ProductFormData) => {
    // Process form data to match API expectations
    const filteredCategoryIds =
      formData.categoryIds?.filter(id => id && id.trim() !== '') || [];

    const processedFormData = {
      ...formData,
      // Only include categoryIds if there are valid categories, otherwise exclude the field
      ...(filteredCategoryIds.length > 0 && {
        categoryIds: filteredCategoryIds,
      }),
      regularPrice:
        formData.regularPrice && formData.regularPrice !== ''
          ? parseFloat(formData.regularPrice.toString())
          : 0,
      memberPrice:
        formData.memberPrice && formData.memberPrice !== ''
          ? parseFloat(formData.memberPrice.toString())
          : null,
      weight: parseFloat(formData.weight.toString()),
      // Send dimensions as JSON object (not stringified)
      dimensions: {
        length:
          formData.length && formData.length !== ''
            ? parseFloat(formData.length.toString())
            : null,
        width:
          formData.width && formData.width !== ''
            ? parseFloat(formData.width.toString())
            : null,
        height:
          formData.height && formData.height !== ''
            ? parseFloat(formData.height.toString())
            : null,
      },
      images: formData.images.map((img, index) => ({
        url: img.url,
        altText: img.altText || formData.name,
        isPrimary: index === 0,
      })),
    };

    const response = await fetchWithCSRF(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processedFormData),
    });

    if (!response.ok) {
      throw new Error('Failed to update product');
    }

    toast.success('Product updated successfully!');
    router.push('/admin/products');
  };

  const handleDelete = async () => {
    const response = await fetchWithCSRF(`/api/admin/products/${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete product');
    }

    // Success will be handled by the ProductForm component
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-muted-foreground">Loading product data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      mode="edit"
      productId={productId}
      initialData={initialData}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}
