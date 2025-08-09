/**
 * Admin Product Creation Page - JRM E-commerce Platform
 * Improved UX with tabbed layout and sticky sidebar
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CustomDateRangePicker } from '@/components/ui/custom-date-range-picker';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Package,
  DollarSign,
  Settings,
  Image as ImageIcon,
  Zap,
  Eye,
  CheckCircle2,
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
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
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

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');
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

  // Utility function to format dimensions for storage
  const formatDimensions = (length: string | number, width: string | number, height: string | number): string => {
    const l = length?.toString().trim() || '';
    const w = width?.toString().trim() || '';
    const h = height?.toString().trim() || '';
    
    if (!l && !w && !h) return '';
    return `${l || '0'} × ${w || '0'} × ${h || '0'}`;
  };

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

  const handleInputChange = (
    field: string,
    value: string | number | boolean | Date | undefined
  ) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug when name changes
      if (field === 'name' && value) {
        updated.slug = generateSlug(value);
      }
      
      // Clear promotional fields when promotional is disabled
      if (field === 'isPromotional' && !value) {
        updated.promotionalPrice = undefined;
        updated.promotionStartDate = undefined;
        updated.promotionEndDate = undefined;
      }
      
      return updated;
    });

    // Clear related errors
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    const processedImages: ProductImage[] = images.map((img, index) => ({
      url: img.url,
      altText: img.altText || formData.name,
      isPrimary: index === 0,
    }));
    handleInputChange('images', processedImages);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'URL slug is required';
    }
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (formData.categoryIds.length === 0) {
      newErrors.categoryIds = 'At least one category is required';
    }
    
    // Price validation
    if (formData.regularPrice <= 0) newErrors.regularPrice = 'Regular price must be greater than 0';
    if (formData.memberPrice <= 0) newErrors.memberPrice = 'Member price must be greater than 0';
    if (formData.costPrice <= 0) newErrors.costPrice = 'Cost price must be greater than 0';
    if (formData.memberPrice >= formData.regularPrice) {
      newErrors.memberPrice = 'Member price must be less than regular price';
    }

    // Stock validation
    if (formData.stockQuantity < 0) newErrors.stockQuantity = 'Stock quantity cannot be negative';

    // Promotional pricing validation
    if (formData.isPromotional) {
      if (!formData.promotionalPrice || formData.promotionalPrice <= 0) {
        newErrors.promotionalPrice = 'Promotional price is required and must be greater than 0';
      } else if (formData.promotionalPrice >= formData.regularPrice) {
        newErrors.promotionalPrice = 'Promotional price must be less than regular price';
      }

      if (!formData.promotionStartDate) {
        newErrors.promotionStartDate = 'Please select a promotion start date';
      }

      if (!formData.promotionEndDate) {
        newErrors.promotionEndDate = 'Please select a promotion end date';
      }

      if (formData.promotionStartDate && formData.promotionEndDate) {
        const startDate = formData.promotionStartDate;
        const endDate = formData.promotionEndDate;
        const now = new Date();

        if (startDate >= endDate) {
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
      // Switch to the tab with the first error
      const errorFields = Object.keys(errors);
      if (errorFields.length > 0) {
        const firstError = errorFields[0];
        if (['name', 'slug', 'description', 'shortDescription', 'sku', 'barcode', 'categoryId'].includes(firstError)) {
          setActiveTab('basic');
        } else if (['regularPrice', 'memberPrice', 'costPrice', 'promotionalPrice', 'promotionStartDate', 'promotionEndDate'].includes(firstError)) {
          setActiveTab('pricing');
        } else if (['stockQuantity', 'lowStockAlert'].includes(firstError)) {
          setActiveTab('inventory');
        }
      }
      return;
    }

    setLoading(true);

    try {
      const processedFormData = {
        ...formData,
        regularPrice: Number(formData.regularPrice),
        memberPrice: Number(formData.memberPrice),
        costPrice: Number(formData.costPrice),
        weight: formData.weight && formData.weight !== '' ? Number(formData.weight) : undefined,
        dimensions: formatDimensions(formData.length || '', formData.width || '', formData.height || '') || undefined,
        promotionalPrice: formData.promotionalPrice ? Number(formData.promotionalPrice) : undefined,
        promotionStartDate: formData.promotionStartDate ? formData.promotionStartDate.toISOString() : undefined,
        promotionEndDate: formData.promotionEndDate ? formData.promotionEndDate.toISOString() : undefined,
        memberOnlyUntil: formData.memberOnlyUntil ? formData.memberOnlyUntil.toISOString() : undefined,
        earlyAccessStart: formData.earlyAccessStart ? formData.earlyAccessStart.toISOString() : undefined,
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
      console.error('Product creation error:', error);
      setErrors({ general: 'An error occurred while creating the product' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    const requiredFields = [
      formData.name,
      formData.sku,
      formData.categoryId,
      formData.regularPrice > 0,
      formData.memberPrice > 0,
      formData.costPrice > 0,
    ];
    
    const completedRequired = requiredFields.filter(Boolean).length;
    const totalRequired = requiredFields.length;
    
    const optionalFields = [
      formData.description,
      formData.shortDescription,
      formData.images.length > 0,
      formData.barcode,
      formData.weight,
      formData.dimensions,
    ];
    
    const completedOptional = optionalFields.filter(Boolean).length;
    const totalOptional = optionalFields.length;
    
    return Math.round(((completedRequired + completedOptional * 0.5) / (totalRequired + totalOptional * 0.5)) * 100);
  };

  const getTabStatus = (tab: string) => {
    const tabErrors = {
      basic: ['name', 'slug', 'sku', 'categoryId'],
      pricing: ['regularPrice', 'memberPrice', 'costPrice', 'promotionalPrice', 'promotionStartDate', 'promotionEndDate'],
      inventory: ['stockQuantity', 'lowStockAlert'],
      media: ['images'],
    };

    const hasErrors = tabErrors[tab as keyof typeof tabErrors]?.some(field => errors[field]);
    
    if (hasErrors) return 'error';
    
    // Check completion
    if (tab === 'basic') {
      return (formData.name && formData.sku && formData.categoryId) ? 'complete' : 'incomplete';
    } else if (tab === 'pricing') {
      return (formData.regularPrice > 0 && formData.memberPrice > 0 && formData.costPrice > 0) ? 'complete' : 'incomplete';
    } else if (tab === 'inventory') {
      return formData.stockQuantity >= 0 ? 'complete' : 'incomplete';
    } else if (tab === 'media') {
      return formData.images.length > 0 ? 'complete' : 'incomplete';
    }
    
    return 'incomplete';
  };

  const TabStatusIcon = ({ status }: { status: string }) => {
    if (status === 'complete') return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    if (status === 'error') return <AlertCircle className="h-3 w-3 text-red-600" />;
    return null;
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Form Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Basic
                  <TabStatusIcon status={getTabStatus('basic')} />
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                  <TabStatusIcon status={getTabStatus('pricing')} />
                </TabsTrigger>
                <TabsTrigger value="inventory" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Inventory
                  <TabStatusIcon status={getTabStatus('inventory')} />
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                  <TabStatusIcon status={getTabStatus('media')} />
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Essential product details and descriptions
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {errors.general && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{errors.general}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          onChange={e => handleInputChange('barcode', e.target.value)}
                          placeholder="123456789012"
                        />
                      </div>
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
                                const category = categories.find(c => c.id === categoryId);
                                if (!category) return null;
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
                                        const newCategoryIds = formData.categoryIds.filter(id => id !== categoryId);
                                        handleInputChange('categoryIds', newCategoryIds);
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
                              if (value && !formData.categoryIds.includes(value)) {
                                const newCategoryIds = [...formData.categoryIds, value];
                                handleInputChange('categoryIds', newCategoryIds);
                              }
                            }}
                          >
                            <SelectTrigger className="border-0 shadow-none p-0 h-auto">
                              <SelectValue placeholder="+ Add a category..." />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.isArray(categories) && categories
                                .filter(category => !formData.categoryIds.includes(category.id))
                                .map(category => (
                                  <SelectItem key={category.id} value={category.id}>
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

                    <div>
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Textarea
                        id="shortDescription"
                        value={formData.shortDescription}
                        onChange={e => handleInputChange('shortDescription', e.target.value)}
                        placeholder="Brief product description (shown in product cards)"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Full Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={e => handleInputChange('description', e.target.value)}
                        placeholder="Detailed product description (shown on product page)"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.01"
                          value={formData.weight || ''}
                          onChange={e => handleInputChange('weight', e.target.value)}
                          placeholder="0.50"
                        />
                      </div>

                      <div>
                        <Label>Dimensions (cm)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor="length" className="text-xs text-gray-500">
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
                            <Label htmlFor="width" className="text-xs text-gray-500">
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
                            <Label htmlFor="height" className="text-xs text-gray-500">
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

              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Regular Pricing</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Set standard and member pricing for this product
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="regularPrice">Regular Price (RM) *</Label>
                        <Input
                          id="regularPrice"
                          type="number"
                          step="0.01"
                          value={formData.regularPrice}
                          onChange={e => handleInputChange('regularPrice', parseFloat(e.target.value) || 0)}
                          placeholder="99.90"
                        />
                        {errors.regularPrice && (
                          <p className="text-sm text-red-600 mt-1">{errors.regularPrice}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="memberPrice">Member Price (RM) *</Label>
                        <Input
                          id="memberPrice"
                          type="number"
                          step="0.01"
                          value={formData.memberPrice}
                          onChange={e => handleInputChange('memberPrice', parseFloat(e.target.value) || 0)}
                          placeholder="89.90"
                        />
                        {errors.memberPrice && (
                          <p className="text-sm text-red-600 mt-1">{errors.memberPrice}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="costPrice">Cost Price (RM) *</Label>
                        <Input
                          id="costPrice"
                          type="number"
                          step="0.01"
                          value={formData.costPrice}
                          onChange={e => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                          placeholder="45.00"
                        />
                        {errors.costPrice && (
                          <p className="text-sm text-red-600 mt-1">{errors.costPrice}</p>
                        )}
                      </div>
                    </div>

                    {formData.regularPrice > 0 && formData.memberPrice > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <div className="text-sm text-green-800">
                            <p className="font-medium">Pricing Preview</p>
                            <p>
                              Members save RM{(formData.regularPrice - formData.memberPrice).toFixed(2)} 
                              ({Math.round(((formData.regularPrice - formData.memberPrice) / formData.regularPrice) * 100)}% discount)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          Promotional Pricing
                          <Switch
                            checked={formData.isPromotional}
                            onCheckedChange={checked => handleInputChange('isPromotional', checked)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground font-normal mt-1">
                          Enable special pricing with automatic membership override
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {formData.isPromotional ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="promotionalPrice">Promotional Price (RM) *</Label>
                          <Input
                            id="promotionalPrice"
                            type="number"
                            step="0.01"
                            value={formData.promotionalPrice || ''}
                            onChange={e => handleInputChange('promotionalPrice', parseFloat(e.target.value) || undefined)}
                            placeholder="Enter promotional price"
                          />
                          {errors.promotionalPrice && (
                            <p className="text-sm text-red-600">{errors.promotionalPrice}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Promotion Period *</Label>
                          <CustomDateRangePicker
                            startDate={formData.promotionStartDate}
                            endDate={formData.promotionEndDate}
                            onStartDateChange={date => handleInputChange('promotionStartDate', date)}
                            onEndDateChange={date => handleInputChange('promotionEndDate', date)}
                            placeholder="Select promotion start and end dates"
                          />
                          {(errors.promotionStartDate || errors.promotionEndDate) && (
                            <p className="text-sm text-red-600">
                              {errors.promotionStartDate || errors.promotionEndDate}
                            </p>
                          )}
                        </div>

                        {formData.promotionalPrice && formData.regularPrice > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                              <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Promotional Savings</p>
                                <ul className="space-y-1 text-sm">
                                  <li>
                                    • Save RM{(formData.regularPrice - formData.promotionalPrice).toFixed(2)} from regular price
                                    ({Math.round(((formData.regularPrice - formData.promotionalPrice) / formData.regularPrice) * 100)}% off)
                                  </li>
                                  <li>
                                    • No membership required during promotion
                                  </li>
                                  <li>
                                    • Automatically excludes from RM80 threshold
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Enable promotion to configure special pricing</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Stock Management</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage inventory levels and stock alerts
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          min="0"
                          value={formData.stockQuantity}
                          onChange={e => handleInputChange('stockQuantity', parseInt(e.target.value, 10) || 0)}
                          placeholder="100"
                        />
                        {errors.stockQuantity && (
                          <p className="text-sm text-red-600 mt-1">{errors.stockQuantity}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                        <Input
                          id="lowStockAlert"
                          type="number"
                          min="0"
                          value={formData.lowStockAlert}
                          onChange={e => handleInputChange('lowStockAlert', parseInt(e.target.value, 10) || 0)}
                          placeholder="10"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Receive alerts when stock falls below this level
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Product Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={value => handleInputChange('status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft - Not visible</SelectItem>
                            <SelectItem value="ACTIVE">Active - Public</SelectItem>
                            <SelectItem value="INACTIVE">Inactive - Hidden</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 pt-8">
                        <Switch
                          id="featured"
                          checked={formData.featured}
                          onCheckedChange={checked => handleInputChange('featured', checked)}
                        />
                        <Label htmlFor="featured">Featured Product</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isQualifyingForMembership"
                          checked={formData.isQualifyingForMembership}
                          onCheckedChange={checked => handleInputChange('isQualifyingForMembership', checked)}
                        />
                        <Label htmlFor="isQualifyingForMembership">Membership Qualifying</Label>
                      </div>
                      <p className="text-xs text-gray-500 ml-7">
                        Counts toward RM80 threshold when not on promotion
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Media Tab */}
              <TabsContent value="media" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Upload high-quality images to showcase your product
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      images={uploadedImages}
                      onImagesChange={handleImagesChange}
                      maxImages={5}
                      className="w-full"
                    />
                    <div className="mt-4 text-sm text-gray-600">
                      <p className="font-medium mb-2">Image Guidelines:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• First image will be used as the primary product image</li>
                        <li>• Recommended size: 800x800px or larger</li>
                        <li>• Supported formats: JPG, PNG, WebP</li>
                        <li>• Maximum file size: 5MB per image</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Member Early Access</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Configure member-only access periods and early promotional access
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="memberOnlyUntil">Member-Only Until (Optional)</Label>
                      <CustomDateRangePicker
                        startDate={formData.memberOnlyUntil}
                        endDate={undefined}
                        onStartDateChange={date => handleInputChange('memberOnlyUntil', date)}
                        onEndDateChange={() => {}}
                        placeholder="Select member-only period end date"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        Product will be visible only to members until this date
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="earlyAccessStart">Early Access Start (Optional)</Label>
                      <CustomDateRangePicker
                        startDate={formData.earlyAccessStart}
                        endDate={undefined}
                        onStartDateChange={date => handleInputChange('earlyAccessStart', date)}
                        onEndDateChange={() => {}}
                        placeholder="Select early access start date"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">
                        Members get early access to promotions from this date
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="text-sm text-amber-800">
                          <p className="font-medium mb-1">Early Access System</p>
                          <ul className="space-y-1 text-sm">
                            <li>• <strong>Member-Only Until</strong>: Product is completely hidden from non-members</li>
                            <li>• <strong>Early Access Start</strong>: Members see promotional pricing before public launch</li>
                            <li>• Works with promotional pricing to create member exclusivity</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Progress Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Product Creation Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm text-muted-foreground">{getCompletionPercentage()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${getCompletionPercentage()}%` }}
                    />
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>Basic Info</span>
                      <TabStatusIcon status={getTabStatus('basic')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pricing</span>
                      <TabStatusIcon status={getTabStatus('pricing')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Inventory</span>
                      <TabStatusIcon status={getTabStatus('inventory')} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Images</span>
                      <TabStatusIcon status={getTabStatus('media')} />
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Action Buttons */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      'Creating...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Product
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => router.back()} 
                    className="w-full"
                    disabled={loading}
                  >
                    Cancel
                  </Button>

                  {Object.keys(errors).length > 0 && (
                    <div className="text-xs text-red-600 text-center">
                      Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} before saving
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}