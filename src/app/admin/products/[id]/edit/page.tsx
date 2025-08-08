/**
 * Admin Product Edit Page - JRM E-commerce Platform
 * Edit existing products with full details and images
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react';
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
  isPromotional: boolean;
  isQualifyingForMembership: boolean;
  images: ProductImage[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    isPromotional: false,
    isQualifyingForMembership: true,
    images: [],
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

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

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        const product = data.product;

        // Convert existing images to UploadedImage format for the component
        const existingUploadedImages: UploadedImage[] = (
          product.images || []
        ).map((img, index) => ({
          url: img.url,
          filename: img.url.split('/').pop() || `image-${index}`,
          width: 400, // Default dimensions - these would ideally come from the database
          height: 400,
          size: 0, // Size not available from existing data
        }));

        setUploadedImages(existingUploadedImages);

        setFormData({
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          sku: product.sku,
          barcode: product.barcode || '',
          categoryId: product.category.id,
          regularPrice: product.regularPrice,
          memberPrice: product.memberPrice,
          costPrice: product.costPrice,
          stockQuantity: product.stockQuantity,
          lowStockAlert: product.lowStockAlert,
          weight: product.weight,
          dimensions: product.dimensions || '',
          status: product.status,
          featured: product.featured,
          isPromotional: product.isPromotional || false,
          isQualifyingForMembership:
            product.isQualifyingForMembership !== undefined
              ? product.isQualifyingForMembership
              : true,
          images: product.images || [],
        });
      } else {
        setErrors({ general: 'Failed to load product' });
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setErrors({ general: 'Failed to load product' });
    } finally {
      setLoading(false);
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

      // Auto-generate slug when name changes (only if slug hasn't been manually edited)
      if (field === 'name' && updated.slug === generateSlug(prev.name)) {
        updated.slug = generateSlug(value);
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

  const handleImageRemove = () => {
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

    setSaving(true);

    try {
      // Convert string numbers to actual numbers for validation
      const processedFormData = {
        ...formData,
        regularPrice: Number(formData.regularPrice),
        memberPrice: Number(formData.memberPrice),
        costPrice: Number(formData.costPrice),
        weight: formData.weight ? Number(formData.weight) : undefined,
      };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedFormData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/admin/products/${productId}?success=updated`);
      } else {
        if (data.field) {
          setErrors({ [data.field]: data.message });
        } else {
          setErrors({ general: data.message || 'Failed to update product' });
        }
      }
    } catch (error) {
      console.error('Product update error:', error);
      setErrors({ general: 'An error occurred while updating the product' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this product? This action cannot be undone.'
      )
    ) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/inventory?success=deleted');
      } else {
        const data = await response.json();
        setErrors({ general: data.message || 'Failed to delete product' });
      }
    } catch (error) {
      console.error('Product delete error:', error);
      setErrors({ general: 'An error occurred while deleting the product' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href={`/admin/products/${productId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Product
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-gray-600">
              Update product information and settings
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={saving}
          >
            Delete Product
          </Button>
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
                        parseInt(e.target.value, 10) || 0
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
                        parseInt(e.target.value, 10) || 0
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPromotional"
                    checked={formData.isPromotional}
                    onCheckedChange={checked =>
                      handleInputChange('isPromotional', checked)
                    }
                  />
                  <Label htmlFor="isPromotional">Promotional Product</Label>
                  <span className="text-sm text-gray-500">
                    (excluded from membership calculation)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isQualifyingForMembership"
                    checked={formData.isQualifyingForMembership}
                    onCheckedChange={checked =>
                      handleInputChange('isQualifyingForMembership', checked)
                    }
                  />
                  <Label htmlFor="isQualifyingForMembership">
                    Membership Qualifying
                  </Label>
                  <span className="text-sm text-gray-500">
                    (counts toward RM80 threshold)
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="sticky top-4">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Product
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
