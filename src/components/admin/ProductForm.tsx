/**
 * Unified Product Form Component - JRM E-commerce Platform
 * Single source of truth for product creation and editing forms
 * Following @CLAUDE.md principles: DRY, centralized, no hardcoding
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
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CustomDateRangePicker } from '@/components/ui/custom-date-range-picker';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';
import { Stepper, useStepperState, type StepperStep } from '@/components/ui/stepper';
import { TabStatusIcon } from '@/components/ui/tab-status-icon';
import {
  PRODUCT_FORM_STEPS,
  getStepStatus,
  getErrorTab,
  calculateCompletionPercentage,
  canNavigateToStep,
} from '@/lib/product-tabs-config';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Package,
  DollarSign,
  Settings,
  Image as ImageIcon,
  Zap,
  CheckCircle2,
  Sparkles,
  Calendar,
  Eye,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
  regularPrice: number | string;
  memberPrice: number | string;
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

export interface ProductFormProps {
  mode: 'create' | 'edit';
  productId?: string;
  initialData?: Partial<ProductFormData>;
  onSubmit?: (data: ProductFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const initialFormData: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  sku: '',
  barcode: '',
  categoryIds: [],
  regularPrice: '',
  memberPrice: '',
  stockQuantity: 0,
  lowStockAlert: 10,
  weight: '',
  length: '',
  width: '',
  height: '',
  status: 'DRAFT',
  featured: false,
  isPromotional: false,
  isQualifyingForMembership: false,
  promotionalPrice: 0,
  promotionStartDate: undefined,
  promotionEndDate: undefined,
  memberOnlyUntil: undefined,
  earlyAccessStart: undefined,
  images: [],
};

export function ProductForm({
  mode,
  productId,
  initialData,
  onSubmit,
  onDelete,
}: ProductFormProps) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize form data with initial data or defaults
  const [formData, setFormData] = useState<ProductFormData>(() => ({
    ...initialFormData,
    ...initialData,
  }));
  
  // Initialize stepper with product form steps
  const stepperSteps = PRODUCT_FORM_STEPS.map(step => ({
    id: step.id,
    label: step.label,
    icon: <step.icon className="w-4 h-4" />,
  }));
  
  const { steps, currentStep, goToStep, nextStep, prevStep, currentIndex, isFirstStep, isLastStep } = 
    useStepperState(stepperSteps);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      console.log('🔄 ProductForm received initialData:', initialData);
      console.log('🏷️ CategoryIds from initialData:', initialData.categoryIds);
      setFormData(prev => {
        const newData = {
          ...prev,
          ...initialData,
        };
        console.log('🆕 New formData after merge:', newData);
        console.log('🔖 Final categoryIds in formData:', newData.categoryIds);
        return newData;
      });
    }
  }, [initialData]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        console.log('📁 Categories loaded:', data);
        if (data.categories) {
          console.log('📁 Categories array:', data.categories.map((c: any) => ({ id: c.id, name: c.name })));
        }
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug when name changes
      if (field === 'name' && value) {
        updated.slug = generateSlug(value);
      }

      // Clear promotional fields when promotional is disabled
      if (field === 'isPromotional' && !value) {
        updated.promotionalPrice = 0;
        updated.promotionStartDate = undefined;
        updated.promotionEndDate = undefined;
      }

      return updated;
    });

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validations
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Product slug is required';
    }
    
    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    
    if (formData.categoryIds.length === 0) {
      newErrors.categoryIds = 'At least one category must be selected';
    }
    
    if (!formData.regularPrice || parseFloat(formData.regularPrice.toString()) <= 0) {
      newErrors.regularPrice = 'Valid regular price is required';
    }
    
    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }

    // Promotional pricing validation
    if (formData.isPromotional) {
      if (!formData.promotionalPrice || formData.promotionalPrice <= 0) {
        newErrors.promotionalPrice = 'Valid promotional price is required';
      }
      
      if (!formData.promotionStartDate) {
        newErrors.promotionStartDate = 'Promotion start date is required';
      }
      
      if (!formData.promotionEndDate) {
        newErrors.promotionEndDate = 'Promotion end date is required';
      }
      
      if (formData.promotionStartDate && formData.promotionEndDate && 
          formData.promotionStartDate >= formData.promotionEndDate) {
        newErrors.promotionEndDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    
    // Navigate to first tab with errors
    if (Object.keys(newErrors).length > 0) {
      const errorTab = getErrorTab(newErrors);
      if (errorTab) {
        goToStep(errorTab);
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default submission logic
        const url = mode === 'create' 
          ? '/api/admin/products' 
          : `/api/admin/products/${productId}`;
        
        const method = mode === 'create' ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to ${mode} product`);
        }
        
        toast.success(`Product ${mode === 'create' ? 'created' : 'updated'} successfully!`);
        router.push('/admin/products');
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} product:`, error);
      toast.error(`Failed to ${mode} product. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setLoading(true);
      try {
        await onDelete();
        toast.success('Product deleted successfully!');
        router.push('/admin/products');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImageChange = (images: UploadedImage[]) => {
    const productImages: ProductImage[] = images.map((img, index) => ({
      url: img.url,
      altText: img.altText || formData.name,
      isPrimary: index === 0,
    }));
    
    handleInputChange('images', productImages);
  };

  // Get step status for stepper
  const getStepperStatus = (stepId: string) => {
    return getStepStatus(stepId, formData, errors);
  };

  // Update stepper steps with current status
  const stepsWithStatus = steps.map(step => ({
    ...step,
    status: currentStep === step.id ? 'active' : getStepperStatus(step.id),
  }));

  const getCompletionPercentage = () => {
    return calculateCompletionPercentage(formData, errors);
  };

  const handleStepNavigation = (stepId: string) => {
    if (canNavigateToStep(stepId, currentStep, formData, errors)) {
      goToStep(stepId);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
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
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Product' : 'Edit Product'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {mode === 'create' 
                ? 'Add a new product to your store with all the details' 
                : 'Update product information and settings'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {/* Progress Stepper */}
                <div className="mb-6">
                  <Stepper
                    steps={stepsWithStatus}
                    currentStep={currentStep}
                    onStepClick={handleStepNavigation}
                    className="mb-4"
                  />
                </div>
                <Tabs value={currentStep} onValueChange={goToStep}>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Product Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={e => handleInputChange('name', e.target.value)}
                          placeholder="Enter product name"
                          className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                          <p className="text-sm text-red-600">{errors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug">
                          Slug <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={e => handleInputChange('slug', e.target.value)}
                          placeholder="product-url-slug"
                          className={errors.slug ? 'border-red-500' : ''}
                        />
                        {errors.slug && (
                          <p className="text-sm text-red-600">{errors.slug}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Auto-generated from product name. Used in product URL.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="sku">
                          SKU <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={e => handleInputChange('sku', e.target.value)}
                          placeholder="PROD-001"
                          className={errors.sku ? 'border-red-500' : ''}
                        />
                        {errors.sku && (
                          <p className="text-sm text-red-600">{errors.sku}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input
                          id="barcode"
                          value={formData.barcode}
                          onChange={e => handleInputChange('barcode', e.target.value)}
                          placeholder="1234567890123"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categories">
                        Categories <span className="text-red-500">*</span>
                      </Label>
                      <MultiSelect
                        options={(() => {
                          const categoryOptions: Option[] = Array.isArray(categories?.categories) 
                            ? categories.categories.map(category => ({
                                label: category.name,
                                value: category.id
                              }))
                            : [];
                          console.log('🎯 MultiSelect - Category options:', categoryOptions);
                          return categoryOptions;
                        })()}
                        selected={(() => {
                          console.log('🎯 MultiSelect - Selected categoryIds:', formData.categoryIds);
                          return formData.categoryIds || [];
                        })()}
                        onChange={(values) => {
                          console.log('🎯 MultiSelect - onChange called with:', values);
                          handleInputChange('categoryIds', values);
                        }}
                        placeholder="Select categories"
                        className={errors.categoryIds ? 'border-red-500' : ''}
                        searchPlaceholder="Search categories..."
                      />
                      {errors.categoryIds && (
                        <p className="text-sm text-red-600">{errors.categoryIds}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Input
                        id="shortDescription"
                        value={formData.shortDescription}
                        onChange={e => handleInputChange('shortDescription', e.target.value)}
                        placeholder="Brief product description"
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground">
                        {formData.shortDescription.length}/160 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={e => handleInputChange('description', e.target.value)}
                        placeholder="Detailed product description"
                        rows={6}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.weight}
                          onChange={e => handleInputChange('weight', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="length">Length (cm)</Label>
                        <Input
                          id="length"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.length}
                          onChange={e => handleInputChange('length', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="width">Width (cm)</Label>
                        <Input
                          id="width"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.width}
                          onChange={e => handleInputChange('width', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.height}
                          onChange={e => handleInputChange('height', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Pricing Tab */}
                  <TabsContent value="pricing" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="regularPrice">
                          Regular Price (RM) <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="regularPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.regularPrice}
                          onChange={e => handleInputChange('regularPrice', e.target.value)}
                          placeholder="0.00"
                          className={errors.regularPrice ? 'border-red-500' : ''}
                        />
                        {errors.regularPrice && (
                          <p className="text-sm text-red-600">{errors.regularPrice}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="memberPrice">Member Price (RM)</Label>
                        <Input
                          id="memberPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.memberPrice}
                          onChange={e => handleInputChange('memberPrice', e.target.value)}
                          placeholder="0.00"
                        />
                        <p className="text-xs text-muted-foreground">
                          Special price for members
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isPromotional"
                        checked={formData.isPromotional}
                        onCheckedChange={value => handleInputChange('isPromotional', value)}
                      />
                      <Label htmlFor="isPromotional">Enable Promotional Pricing</Label>
                    </div>

                    {formData.isPromotional && (
                      <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
                        <h3 className="font-medium text-orange-800">Promotional Pricing</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="promotionalPrice">
                              Promotional Price (RM) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="promotionalPrice"
                              type="number"
                              step="0.01"
                              min="0"
                              value={formData.promotionalPrice}
                              onChange={e => handleInputChange('promotionalPrice', parseFloat(e.target.value))}
                              placeholder="0.00"
                              className={errors.promotionalPrice ? 'border-red-500' : ''}
                            />
                            {errors.promotionalPrice && (
                              <p className="text-sm text-red-600">{errors.promotionalPrice}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Promotion Period <span className="text-red-500">*</span>
                          </Label>
                          <CustomDateRangePicker
                            startDate={formData.promotionStartDate}
                            endDate={formData.promotionEndDate}
                            onStartDateChange={date => handleInputChange('promotionStartDate', date)}
                            onEndDateChange={date => handleInputChange('promotionEndDate', date)}
                            placeholder="Select promotion period"
                            className={errors.promotionStartDate || errors.promotionEndDate ? 'border-red-500' : ''}
                          />
                          {(errors.promotionStartDate || errors.promotionEndDate) && (
                            <p className="text-sm text-red-600">
                              {errors.promotionStartDate || errors.promotionEndDate}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Inventory Tab */}
                  <TabsContent value="inventory" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="stockQuantity">
                          Stock Quantity <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          min="0"
                          value={formData.stockQuantity}
                          onChange={e => handleInputChange('stockQuantity', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className={errors.stockQuantity ? 'border-red-500' : ''}
                        />
                        {errors.stockQuantity && (
                          <p className="text-sm text-red-600">{errors.stockQuantity}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                        <Input
                          id="lowStockAlert"
                          type="number"
                          min="0"
                          value={formData.lowStockAlert}
                          onChange={e => handleInputChange('lowStockAlert', parseInt(e.target.value) || 0)}
                          placeholder="10"
                        />
                        <p className="text-xs text-muted-foreground">
                          Get notified when stock falls below this number
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'DRAFT' | 'ACTIVE' | 'INACTIVE') => 
                          handleInputChange('status', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Draft</Badge>
                              <span>Not visible to customers</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <Badge variant="default">Active</Badge>
                              <span>Visible and purchasable</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="INACTIVE">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Inactive</Badge>
                              <span>Hidden from customers</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={value => handleInputChange('featured', value)}
                      />
                      <Label htmlFor="featured">Featured Product</Label>
                      <p className="text-xs text-muted-foreground ml-2">
                        Show in featured products section
                      </p>
                    </div>
                  </TabsContent>

                  {/* Images Tab */}
                  <TabsContent value="media" className="space-y-6">
                    <div className="space-y-2">
                      <Label>Product Images</Label>
                      <ImageUpload
                        value={formData.images.map(img => ({
                          url: img.url,
                          altText: img.altText || formData.name,
                        }))}
                        onChange={handleImageChange}
                        maxFiles={5}
                        maxSize={5 * 1024 * 1024} // 5MB
                        accept="image/*"
                        uploadPath="/api/upload"
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload up to 5 images (max 5MB each). First image will be the primary image.
                      </p>
                    </div>
                  </TabsContent>

                  {/* Advanced Tab */}
                  <TabsContent value="advanced" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isQualifyingForMembership"
                          checked={formData.isQualifyingForMembership}
                          onCheckedChange={value => handleInputChange('isQualifyingForMembership', value)}
                        />
                        <Label htmlFor="isQualifyingForMembership">
                          Qualifying for Membership
                        </Label>
                        <p className="text-xs text-muted-foreground ml-2">
                          Purchase counts towards membership qualification
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Member Only Until</Label>
                        <CustomDateRangePicker
                          startDate={formData.memberOnlyUntil}
                          endDate={undefined}
                          onStartDateChange={date => handleInputChange('memberOnlyUntil', date)}
                          onEndDateChange={() => {}}
                          placeholder="Select member-only period end date"
                          singleDate
                        />
                        <p className="text-xs text-muted-foreground">
                          Product only available to members until this date
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Early Access Start</Label>
                        <CustomDateRangePicker
                          startDate={formData.earlyAccessStart}
                          endDate={undefined}
                          onStartDateChange={date => handleInputChange('earlyAccessStart', date)}
                          onEndDateChange={() => {}}
                          placeholder="Select early access start date"
                          singleDate
                        />
                        <p className="text-xs text-muted-foreground">
                          Members get early access starting from this date
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={isFirstStep}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    Step {currentIndex + 1} of {steps.length}
                  </div>
                  
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isLastStep}
                  >
                    Next
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Progress Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {mode === 'create' ? 'Product Creation Progress' : 'Product Update Progress'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm text-muted-foreground">
                      {getCompletionPercentage()}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getCompletionPercentage()}%` }}
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    {PRODUCT_FORM_STEPS.map(step => {
                      const status = getStepStatus(step.id, formData, errors);
                      return (
                        <div key={step.id} className="flex items-center justify-between">
                          <span>{step.label}</span>
                          <TabStatusIcon 
                            status={status === 'completed' ? 'complete' : 
                                   status === 'error' ? 'error' : 'incomplete'} 
                          />
                        </div>
                      );
                    })}
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
                      mode === 'create' ? 'Creating...' : 'Updating...'
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {mode === 'create' ? 'Create Product' : 'Update Product'}
                      </>
                    )}
                  </Button>

                  {formData.slug && (
                    <Link 
                      href={`/products/${formData.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button 
                        variant="outline" 
                        className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Live View Product
                      </Button>
                    </Link>
                  )}

                  {mode === 'edit' && onDelete && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDelete}
                      className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Product
                    </Button>
                  )}

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
                      Please fix {Object.keys(errors).length} error
                      {Object.keys(errors).length > 1 ? 's' : ''} before saving
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

export default ProductForm;