/**
 * Admin Product Creation Page - JRM E-commerce Platform
 * Form to create new products with full details and images
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  url: string;
  altText?: string;
  isPrimary: boolean;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  barcode: string;
  categoryId: string;
  regularPrice: number;
  memberPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockAlert: number;
  weight?: number;
  dimensions: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  featured: boolean;
  images: ProductImage[];
}

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    sku: '',
    barcode: '',
    categoryId: '',
    regularPrice: 0,
    memberPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    lowStockAlert: 10,
    weight: 0,
    dimensions: '',
    status: 'DRAFT',
    featured: false,
    images: [],
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug when name changes
      if (field === 'name' && !prev.slug) {
        updated.slug = generateSlug(value);
      }

      // Auto-generate SKU when name changes (simple version)
      if (field === 'name' && !prev.sku) {
        const skuBase = value
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 8);
        updated.sku = `${skuBase}-${Date.now().toString().slice(-4)}`;
      }

      return updated;
    });

    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImagesUpload = (images: UploadedImage[]) => {
    setUploadedImages(images);

    // Convert uploaded images to product image format
    const productImages: ProductImage[] = images.map((img, index) => ({
      url: img.url,
      altText: formData.name || 'Product image',
      isPrimary: index === 0, // First image is primary by default
    }));

    handleInputChange('images', productImages);
  };

  const handleImageRemove = (index: number) => {
    // This will be handled by the ImageUpload component
    // The component will call handleImagesUpload with the updated list
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Product slug is required';
    }
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    if (formData.regularPrice <= 0) {
      newErrors.regularPrice = 'Regular price must be greater than 0';
    }
    if (formData.memberPrice <= 0) {
      newErrors.memberPrice = 'Member price must be greater than 0';
    }
    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }
    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }
    if (formData.memberPrice > formData.regularPrice) {
      newErrors.memberPrice =
        'Member price should not be higher than regular price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert string numbers to actual numbers for validation
      const processedFormData = {
        ...formData,
        regularPrice: Number(formData.regularPrice),
        memberPrice: Number(formData.memberPrice),
        costPrice: Number(formData.costPrice),
        weight: formData.weight ? Number(formData.weight) : undefined,
      };

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedFormData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin/inventory?success=created');
      } else {
        if (data.field) {
          setErrors({ [data.field]: data.message });
        } else {
          setErrors({ general: data.message || 'Failed to create product' });
        }
      }
    } catch (error) {
      setErrors({ general: 'An error occurred while creating the product' });
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-3xl font-bold">Create Product</h1>
            <p className="text-gray-600">Add a new product to your inventory</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Product Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {errors.general && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{errors.general}</span>
                  </div>
                )}

                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={e => handleInputChange('slug', e.target.value)}
                    placeholder="product-url-slug"
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600 mt-1">{errors.slug}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={e =>
                      handleInputChange('shortDescription', e.target.value)
                    }
                    placeholder="Brief product description"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="Detailed product description"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU *</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={e => handleInputChange('sku', e.target.value)}
                      placeholder="PROD-001"
                    />
                    {errors.sku && (
                      <p className="text-sm text-red-600 mt-1">{errors.sku}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={formData.barcode}
                      onChange={e =>
                        handleInputChange('barcode', e.target.value)
                      }
                      placeholder="123456789012"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={value =>
                      handleInputChange('categoryId', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.categoryId}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={formData.weight || ''}
                      onChange={e =>
                        handleInputChange(
                          'weight',
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      placeholder="0.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dimensions">Dimensions (L x W x H)</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={e =>
                        handleInputChange('dimensions', e.target.value)
                      }
                      placeholder="10 x 5 x 2 cm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onUpload={handleImagesUpload}
                  onRemove={handleImageRemove}
                  maxFiles={5}
                  maxSize={10}
                  initialImages={uploadedImages}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="regularPrice">Regular Price (RM) *</Label>
                  <Input
                    id="regularPrice"
                    type="number"
                    step="0.01"
                    value={formData.regularPrice}
                    onChange={e =>
                      handleInputChange(
                        'regularPrice',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                  {errors.regularPrice && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.regularPrice}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="memberPrice">Member Price (RM) *</Label>
                  <Input
                    id="memberPrice"
                    type="number"
                    step="0.01"
                    value={formData.memberPrice}
                    onChange={e =>
                      handleInputChange(
                        'memberPrice',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                  {errors.memberPrice && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.memberPrice}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="costPrice">Cost Price (RM) *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={e =>
                      handleInputChange(
                        'costPrice',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                  {errors.costPrice && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.costPrice}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={e =>
                      handleInputChange(
                        'stockQuantity',
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                  {errors.stockQuantity && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.stockQuantity}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    value={formData.lowStockAlert}
                    onChange={e =>
                      handleInputChange(
                        'lowStockAlert',
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status & Visibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={value => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={checked =>
                      handleInputChange('featured', checked)
                    }
                  />
                  <Label htmlFor="featured">Featured Product</Label>
                </div>
              </CardContent>
            </Card>

            <div className="sticky top-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  'Creating...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Product
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
