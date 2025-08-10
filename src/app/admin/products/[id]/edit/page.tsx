/**
 * Admin Product Edit Page - JRM E-commerce Platform
 * Modern tabbed interface for editing existing products with full functionality preservation
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CustomDateRangePicker } from '@/components/ui/custom-date-range-picker';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Loader2,
  Package,
  DollarSign,
  Archive,
  ImageIcon,
  Settings,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';
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
  categoryIds: string[];
  regularPrice: number;
  memberPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockAlert: number;
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  status: string;
  featured: boolean;
  isPromotional: boolean;
  isQualifyingForMembership: boolean;
  promotionalPrice?: number;
  promotionStartDate?: Date;
  promotionEndDate?: Date;
  memberOnlyUntil?: Date;
  earlyAccessStart?: Date;
  images: ProductImage[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [activeTab, setActiveTab] = useState('basic');
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
    categoryIds: [],
    regularPrice: 0,
    memberPrice: 0,
    costPrice: 0,
    stockQuantity: 0,
    lowStockAlert: 10,
    weight: 0,
    length: '',
    width: '',
    height: '',
    status: 'DRAFT',
    featured: false,
    isPromotional: false,
    isQualifyingForMembership: true,
    promotionalPrice: undefined,
    promotionStartDate: undefined,
    promotionEndDate: undefined,
    memberOnlyUntil: undefined,
    earlyAccessStart: undefined,
    images: [],
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Utility function to parse dimensions string (e.g., "10x20x30" or "10 x 20 x 30")
  const parseDimensions = (dimensionString: string) => {
    if (!dimensionString || typeof dimensionString !== 'string') {
      return { length: '', width: '', height: '' };
    }

    const parts = dimensionString
      .split(/[x×\s*×\s*]/)
      .map(part => part.trim())
      .filter(part => part);
    return {
      length: parts[0] || '',
      width: parts[1] || '',
      height: parts[2] || '',
    };
  };

  // Utility function to format dimensions for storage
  const formatDimensions = (
    length: string | number,
    width: string | number,
    height: string | number
  ): string => {
    const l = length?.toString().trim() || '';
    const w = width?.toString().trim() || '';
    const h = height?.toString().trim() || '';

    if (!l && !w && !h) {
      return '';
    }
    return `${l || '0'} × ${w || '0'} × ${h || '0'}`;
  };

  useEffect(() => {
    fetchCategories();
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        // Convert existing images to uploaded images format
        const existingUploadedImages: UploadedImage[] = (
          product.images || []
        ).map((img: ProductImage, index: number) => ({
          url: img.url,
          filename: `existing-image-${index}`, // Placeholder filename for existing images
          width: 800, // Default dimensions - could be fetched from image metadata
          height: 600,
          size: 0, // Size unknown for existing images
        }));

        setUploadedImages(existingUploadedImages);

        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          description: product.description || '',
          shortDescription: product.shortDescription || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          categoryIds:
            product.categories?.map(
              (pc: { category: { id: string } }) => pc.category.id
            ) || [],
          regularPrice: Number(product.regularPrice) || 0,
          memberPrice: Number(product.memberPrice) || 0,
          costPrice: Number(product.costPrice) || 0,
          stockQuantity: product.stockQuantity || 0,
          lowStockAlert: product.lowStockAlert || 10,
          weight: product.weight || 0,
          length: product.dimensions
            ? parseDimensions(product.dimensions).length
            : '',
          width: product.dimensions
            ? parseDimensions(product.dimensions).width
            : '',
          height: product.dimensions
            ? parseDimensions(product.dimensions).height
            : '',
          status: product.status || 'DRAFT',
          featured: product.featured || false,
          isPromotional: product.isPromotional || false,
          isQualifyingForMembership: product.isQualifyingForMembership ?? true,
          promotionalPrice: product.promotionalPrice
            ? Number(product.promotionalPrice)
            : undefined,
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
          images: product.images || [],
        });
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      router.push('/admin/products');
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

  const handleInputChange = (
    field: string,
    value: string | number | boolean | Date | undefined
  ) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug when name changes
      if (field === 'name' && value) {
        updated.slug = generateSlug(value as string);
      }

      // Clear promotional fields when promotional is disabled
      if (field === 'isPromotional' && !value) {
        updated.promotionalPrice = undefined;
        updated.promotionStartDate = undefined;
        updated.promotionEndDate = undefined;
      }

      return updated;
    });

    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImagesUpload = (images: UploadedImage[]) => {
    setUploadedImages(images);

    // Convert uploaded images to product images format
    const productImages: ProductImage[] = images.map((img, index) => ({
      url: img.url, // Use the actual uploaded URL, not preview
      altText: '', // Will be set separately if needed
      isPrimary: index === 0, // First image is primary
    }));

    setFormData(prev => ({ ...prev, images: productImages }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (formData.categoryIds.length === 0) {
      newErrors.categoryIds = 'At least one category is required';
    }
    if (formData.regularPrice <= 0) {
      newErrors.regularPrice = 'Regular price must be greater than 0';
    }
    if (formData.memberPrice <= 0) {
      newErrors.memberPrice = 'Member price must be greater than 0';
    }
    if (formData.memberPrice >= formData.regularPrice) {
      newErrors.memberPrice = 'Member price must be less than regular price';
    }
    if (formData.costPrice < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }
    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }

    // Promotional pricing validation
    if (formData.isPromotional) {
      if (!formData.promotionalPrice || formData.promotionalPrice <= 0) {
        newErrors.promotionalPrice =
          'Promotional price is required and must be greater than 0';
      } else if (formData.promotionalPrice >= formData.memberPrice) {
        newErrors.promotionalPrice =
          'Promotional price must be less than member price';
      }

      if (formData.promotionStartDate && formData.promotionEndDate) {
        const startDate = formData.promotionStartDate;
        const endDate = formData.promotionEndDate;
        const now = new Date();

        if (endDate <= startDate) {
          newErrors.promotionEndDate = 'End date must be after start date';
        }

        if (endDate <= now) {
          newErrors.promotionEndDate = 'End date must be in the future';
        }
      }
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
      const processedFormData = {
        ...formData,
        regularPrice: Number(formData.regularPrice),
        memberPrice: Number(formData.memberPrice),
        costPrice: Number(formData.costPrice),
        stockQuantity: Number(formData.stockQuantity),
        lowStockAlert: Number(formData.lowStockAlert),
        weight:
          formData.weight && formData.weight !== ''
            ? Number(formData.weight)
            : null,
        dimensions:
          formatDimensions(
            formData.length || '',
            formData.width || '',
            formData.height || ''
          ) || null,
        promotionalPrice: formData.promotionalPrice
          ? Number(formData.promotionalPrice)
          : null,
        promotionStartDate: formData.promotionStartDate || null,
        promotionEndDate: formData.promotionEndDate || null,
        memberOnlyUntil: formData.memberOnlyUntil || null,
        earlyAccessStart: formData.earlyAccessStart || null,
        images: uploadedImages.map((img, index) => ({
          url: img.url,
          altText: '',
          isPrimary: index === 0,
        })),
      };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedFormData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin/products');
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ submit: errorMessage });
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

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/products');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete product');
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete product';
      setErrors({ delete: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const getTabStatus = (tabId: string): 'completed' | 'current' | 'pending' => {
    if (tabId === activeTab) {
      return 'current';
    }

    switch (tabId) {
      case 'basic':
        return formData.name && formData.sku && formData.categoryIds.length > 0
          ? 'completed'
          : 'pending';
      case 'pricing':
        return formData.regularPrice > 0 &&
          formData.memberPrice > 0 &&
          formData.memberPrice < formData.regularPrice
          ? 'completed'
          : 'pending';
      case 'inventory':
        return formData.stockQuantity >= 0 ? 'completed' : 'pending';
      case 'media':
        return uploadedImages.length > 0 ? 'completed' : 'pending';
      case 'advanced':
        return 'completed'; // Advanced settings are optional
      default:
        return 'pending';
    }
  };

  const TabStatusIcon = ({
    status,
  }: {
    status: 'completed' | 'current' | 'pending';
  }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'current':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <div className="h-2 w-2 bg-gray-300 rounded-full" />;
    }
  };

  const calculateProgress = () => {
    const tabs = ['basic', 'pricing', 'inventory', 'media', 'advanced'];
    const completedTabs = tabs.filter(
      tab => getTabStatus(tab) === 'completed'
    ).length;
    return (completedTabs / tabs.length) * 100;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-gray-600 mt-1">
              Update your product information and settings
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {(errors.submit || errors.delete) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-700 mt-1">
                {errors.submit || errors.delete}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Form Area (3/4 width) */}
          <div className="lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Basic
                  <TabStatusIcon status={getTabStatus('basic')} />
                </TabsTrigger>
                <TabsTrigger
                  value="pricing"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  Pricing
                  <TabStatusIcon status={getTabStatus('pricing')} />
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Inventory
                  <TabStatusIcon status={getTabStatus('inventory')} />
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                  <TabStatusIcon status={getTabStatus('media')} />
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Advanced
                  <TabStatusIcon status={getTabStatus('advanced')} />
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={e =>
                            handleInputChange('name', e.target.value)
                          }
                          placeholder="Enter product name"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="slug">URL Slug</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={e =>
                            handleInputChange('slug', e.target.value)
                          }
                          placeholder="product-url-slug"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={e =>
                            handleInputChange('sku', e.target.value)
                          }
                          placeholder="PROD-001"
                        />
                        {errors.sku && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.sku}
                          </p>
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

                      <div>
                        <Label htmlFor="categories">Categories *</Label>
                        <div className="space-y-2">
                          {/* Category Container with Selected Tags and Dropdown */}
                          <div className="border rounded-md p-3 bg-white">
                            {/* Selected Categories Tags */}
                            {formData.categoryIds.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {formData.categoryIds.map(categoryId => {
                                  const category = categories.find(
                                    c => c.id === categoryId
                                  );
                                  if (!category) {
                                    return null;
                                  }
                                  return (
                                    <Badge
                                      key={categoryId}
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      {category.name}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newCategoryIds =
                                            formData.categoryIds.filter(
                                              id => id !== categoryId
                                            );
                                          handleInputChange(
                                            'categoryIds',
                                            newCategoryIds
                                          );
                                        }}
                                        className="ml-1 hover:bg-gray-200 rounded-full p-1"
                                      >
                                        ✕
                                      </button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                            {/* Category Selector */}
                            <Select
                              value=""
                              onValueChange={value => {
                                if (
                                  value &&
                                  !formData.categoryIds.includes(value)
                                ) {
                                  const newCategoryIds = [
                                    ...formData.categoryIds,
                                    value,
                                  ];
                                  handleInputChange(
                                    'categoryIds',
                                    newCategoryIds
                                  );
                                }
                              }}
                            >
                              <SelectTrigger className="border-0 shadow-none p-0 h-auto">
                                <SelectValue placeholder="+ Add a category..." />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(categories) &&
                                  categories
                                    .filter(
                                      category =>
                                        !formData.categoryIds.includes(
                                          category.id
                                        )
                                    )
                                    .map(category => (
                                      <SelectItem
                                        key={category.id}
                                        value={category.id}
                                      >
                                        {category.name}
                                      </SelectItem>
                                    ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {errors.categoryIds && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.categoryIds}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="shortDescription">
                        Short Description
                      </Label>
                      <Textarea
                        id="shortDescription"
                        value={formData.shortDescription}
                        onChange={e =>
                          handleInputChange('shortDescription', e.target.value)
                        }
                        placeholder="Brief product description for listings"
                        rows={3}
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
                        rows={6}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="regularPrice">
                          Regular Price (RM) *
                        </Label>
                        <Input
                          id="regularPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.regularPrice}
                          onChange={e =>
                            handleInputChange(
                              'regularPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
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
                          min="0"
                          value={formData.memberPrice}
                          onChange={e =>
                            handleInputChange(
                              'memberPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                        />
                        {errors.memberPrice && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.memberPrice}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="costPrice">Cost Price (RM)</Label>
                        <Input
                          id="costPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.costPrice}
                          onChange={e =>
                            handleInputChange(
                              'costPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                        />
                        {errors.costPrice && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.costPrice}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Membership Qualification */}
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">
                            Membership Qualification
                          </p>
                          <p className="text-sm text-blue-700">
                            Allow this product to count towards membership
                            qualification
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.isQualifyingForMembership}
                        onCheckedChange={value =>
                          handleInputChange('isQualifyingForMembership', value)
                        }
                      />
                    </div>

                    {/* Promotional Pricing */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-orange-100 rounded-full">
                            <Calendar className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-orange-900">
                              Promotional Pricing
                            </p>
                            <p className="text-sm text-orange-700">
                              Enable special promotional pricing for limited
                              time
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={formData.isPromotional}
                          onCheckedChange={value =>
                            handleInputChange('isPromotional', value)
                          }
                        />
                      </div>

                      {formData.isPromotional && (
                        <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div>
                            <Label htmlFor="promotionalPrice">
                              Promotional Price (RM) *
                            </Label>
                            <Input
                              id="promotionalPrice"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.promotionalPrice || ''}
                              onChange={e =>
                                handleInputChange(
                                  'promotionalPrice',
                                  parseFloat(e.target.value) || undefined
                                )
                              }
                              placeholder="0.00"
                            />
                            {errors.promotionalPrice && (
                              <p className="text-sm text-red-600 mt-1">
                                {errors.promotionalPrice}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label>Promotion Period</Label>
                            <CustomDateRangePicker
                              startDate={formData.promotionStartDate}
                              endDate={formData.promotionEndDate}
                              onStartDateChange={startDate =>
                                handleInputChange(
                                  'promotionStartDate',
                                  startDate
                                )
                              }
                              onEndDateChange={endDate =>
                                handleInputChange('promotionEndDate', endDate)
                              }
                              placeholder="Select promotion period"
                            />
                            {errors.promotionEndDate && (
                              <p className="text-sm text-red-600 mt-1">
                                {errors.promotionEndDate}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="h-5 w-5" />
                      Inventory Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          min="0"
                          value={formData.stockQuantity}
                          onChange={e =>
                            handleInputChange(
                              'stockQuantity',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          placeholder="0"
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
                          min="0"
                          value={formData.lowStockAlert}
                          onChange={e =>
                            handleInputChange(
                              'lowStockAlert',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          placeholder="10"
                        />
                      </div>

                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.weight || ''}
                          onChange={e =>
                            handleInputChange('weight', e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <Label>Dimensions (cm)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label
                              htmlFor="length"
                              className="text-xs text-gray-500"
                            >
                              Length
                            </Label>
                            <Input
                              id="length"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.length || ''}
                              onChange={e =>
                                handleInputChange('length', e.target.value)
                              }
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="width"
                              className="text-xs text-gray-500"
                            >
                              Width
                            </Label>
                            <Input
                              id="width"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.width || ''}
                              onChange={e =>
                                handleInputChange('width', e.target.value)
                              }
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="height"
                              className="text-xs text-gray-500"
                            >
                              Height
                            </Label>
                            <Input
                              id="height"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.height || ''}
                              onChange={e =>
                                handleInputChange('height', e.target.value)
                              }
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Images Tab */}
              <TabsContent value="media" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Product Images
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      initialImages={uploadedImages}
                      onUpload={handleImagesUpload}
                      maxFiles={5}
                      maxSize={10}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Advanced Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="status">Product Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={value =>
                          handleInputChange('status', value)
                        }
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

                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          <Sparkles className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-yellow-900">
                            Featured Product
                          </p>
                          <p className="text-sm text-yellow-700">
                            Display this product in featured sections
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.featured}
                        onCheckedChange={value =>
                          handleInputChange('featured', value)
                        }
                      />
                    </div>

                    {/* Member Early Access */}
                    <div className="space-y-4">
                      <div>
                        <Label>Member Early Access Period</Label>
                        <CustomDateRangePicker
                          startDate={formData.earlyAccessStart}
                          endDate={formData.memberOnlyUntil}
                          onStartDateChange={startDate =>
                            handleInputChange('earlyAccessStart', startDate)
                          }
                          onEndDateChange={endDate =>
                            handleInputChange('memberOnlyUntil', endDate)
                          }
                          placeholder="Select member early access period"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Product will be available to members only during this
                          period
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar (1/4 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Update Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Completion</span>
                        <span>{Math.round(calculateProgress())}%</span>
                      </div>
                      <Progress value={calculateProgress()} className="h-2" />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div
                        className={`flex items-center gap-2 ${getTabStatus('basic') === 'completed' ? 'text-green-600' : 'text-gray-600'}`}
                      >
                        <TabStatusIcon status={getTabStatus('basic')} />
                        Basic Information
                      </div>
                      <div
                        className={`flex items-center gap-2 ${getTabStatus('pricing') === 'completed' ? 'text-green-600' : 'text-gray-600'}`}
                      >
                        <TabStatusIcon status={getTabStatus('pricing')} />
                        Pricing Setup
                      </div>
                      <div
                        className={`flex items-center gap-2 ${getTabStatus('inventory') === 'completed' ? 'text-green-600' : 'text-gray-600'}`}
                      >
                        <TabStatusIcon status={getTabStatus('inventory')} />
                        Inventory Details
                      </div>
                      <div
                        className={`flex items-center gap-2 ${getTabStatus('media') === 'completed' ? 'text-green-600' : 'text-gray-600'}`}
                      >
                        <TabStatusIcon status={getTabStatus('media')} />
                        Product Images
                      </div>
                      <div
                        className={`flex items-center gap-2 ${getTabStatus('advanced') === 'completed' ? 'text-green-600' : 'text-gray-600'}`}
                      >
                        <TabStatusIcon status={getTabStatus('advanced')} />
                        Advanced Settings
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button type="submit" className="w-full" disabled={saving}>
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

                  <Link
                    href={`/products/${formData.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      <Eye className="h-4 w-4 mr-2" />
                      Live View Product
                    </Button>
                  </Link>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
