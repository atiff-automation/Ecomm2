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
    const response = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
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