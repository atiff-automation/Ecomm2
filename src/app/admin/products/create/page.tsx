/**
 * Admin Product Creation Page - JRM E-commerce Platform
 * Uses unified ProductForm component following @CLAUDE.md principles
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { toast } from 'sonner';

export default function CreateProductPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    // Process form data to match API expectations
    const filteredCategoryIds = formData.categoryIds?.filter((id: string) => id && id.trim() !== '') || [];
    
    const processedFormData = {
      ...formData,
      // Only include categoryIds if there are valid categories, otherwise exclude the field
      ...(filteredCategoryIds.length > 0 && { categoryIds: filteredCategoryIds }),
      regularPrice: formData.regularPrice && formData.regularPrice !== '' ? parseFloat(formData.regularPrice.toString()) : 0,
      memberPrice: formData.memberPrice && formData.memberPrice !== '' ? parseFloat(formData.memberPrice.toString()) : null,
      weight: parseFloat(formData.weight.toString()),
      // Convert dimensions object to JSON string as expected by API
      dimensions: JSON.stringify({
        length: formData.length && formData.length !== '' ? parseFloat(formData.length.toString()) : null,
        width: formData.width && formData.width !== '' ? parseFloat(formData.width.toString()) : null,
        height: formData.height && formData.height !== '' ? parseFloat(formData.height.toString()) : null,
      }),
      images: formData.images.map((img: any, index: number) => ({
        url: img.url,
        altText: img.altText || formData.name,
        isPrimary: index === 0,
      })),
    };

    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedFormData),
    });

    if (!response.ok) {
      throw new Error('Failed to create product');
    }

    toast.success('Product created successfully!');
    router.push('/admin/products');
  };

  return (
    <ProductForm
      mode="create"
      onSubmit={handleSubmit}
    />
  );
}