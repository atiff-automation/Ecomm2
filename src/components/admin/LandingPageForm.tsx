/**
 * Unified Landing Page Form Component - JRM E-commerce Platform
 * Single source of truth for landing page creation and editing forms
 * Following @CLAUDE.md principles: DRY, centralized, no hardcoding
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { fetchWithCSRF } from '@/lib/utils/fetch-with-csrf';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { landingPageCreateSchema, landingPageUpdateSchema } from '@/lib/validations/landing-page-validation';
import type { LandingPageFormData } from '@/types/landing-page.types';
import TipTapEditor from '@/components/admin/TipTapEditor';
import { calculateReadingTime, LANDING_PAGE_CONSTANTS, generateExcerpt } from '@/lib/constants/landing-page-constants';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductShowcaseSelector } from '@/components/admin/landing-pages/ProductShowcaseSelector';

export interface LandingPageFormProps {
  mode: 'create' | 'edit';
  landingPageId?: string;
  initialData?: Partial<LandingPageFormData>;
  onSubmit?: (data: LandingPageFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const initialFormData: LandingPageFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '<p>Start writing your landingPage...</p>',
  featuredImage: '',
  featuredImageAlt: '',
  tags: [],
  status: 'DRAFT',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: [],
  featuredProductIds: [],
  productShowcaseLayout: 'GRID',
};

export function LandingPageForm({
  mode,
  landingPageId,
  initialData,
  onSubmit,
  onDelete,
}: LandingPageFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [tagInput, setTagInput] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Choose validation schema based on mode
  const validationSchema = mode === 'create' ? landingPageCreateSchema : landingPageUpdateSchema;

  // Form setup
  const form = useForm<LandingPageFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...initialFormData,
      ...initialData,
    },
  });

  // Fetch existing landing page data for edit mode
  useEffect(() => {
    if (mode === 'edit' && landingPageId) {
      fetchLandingPage();
    }
  }, [mode, landingPageId]);

  const fetchLandingPage = async () => {
    if (!landingPageId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/landing-pages/${landingPageId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch landing page');
      }

      const data = await response.json();
      const landingPage = data.landingPage;

      // Populate form
      form.reset({
        title: landingPage.title,
        slug: landingPage.slug,
        excerpt: landingPage.excerpt || '',
        content: landingPage.content,
        featuredImage: landingPage.featuredImage,
        featuredImageAlt: landingPage.featuredImageAlt,
        tags: landingPage.tags.map((t: any) => t.tag.name),
        status: landingPage.status,
        publishedAt: landingPage.publishedAt ? new Date(landingPage.publishedAt) : undefined,
        metaTitle: landingPage.metaTitle || '',
        metaDescription: landingPage.metaDescription || '',
        metaKeywords: landingPage.metaKeywords || [],
        featuredProductIds: landingPage.featuredProductIds || [],
        productShowcaseLayout: landingPage.productShowcaseLayout || 'GRID',
      });

      // Set featured image state for ImageUpload component
      setFeaturedImageUrl(landingPage.featuredImage || '');
    } catch (error) {
      console.error('Error fetching landing page:', error);
      toast.error('Failed to load landing page');
      router.push('/admin/landing-pages');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from title (create mode only)
  const handleTitleChange = (value: string) => {
    form.setValue('title', value);

    if (mode === 'create' && !form.formState.dirtyFields.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      form.setValue('slug', slug);
    }

    // Auto-generate meta title if empty (create mode only)
    if (mode === 'create' && !form.formState.dirtyFields.metaTitle) {
      form.setValue('metaTitle', value);
    }
  };

  // Auto-generate excerpt from content if empty (create mode only)
  const handleContentChange = (html: string) => {
    form.setValue('content', html);

    if (mode === 'create' && !form.formState.dirtyFields.excerpt) {
      const excerpt = generateExcerpt(html, 157);
      form.setValue('excerpt', excerpt);
    }
  };

  // Handle tag addition
  const handleAddTag = () => {
    const tags = form.getValues('tags');
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < LANDING_PAGE_CONSTANTS.VALIDATION.MAX_TAGS) {
      form.setValue('tags', [...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    const tags = form.getValues('tags');
    form.setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };

  // Handle featured image change
  const handleFeaturedImageChange = (images: UploadedImage[]) => {
    const url = images[0]?.url || '';
    setFeaturedImageUrl(url);
    form.setValue('featuredImage', url);
  };

  // Submit handler
  const handleSubmit = async (data: LandingPageFormData) => {
    try {
      setIsSubmitting(true);

      // Calculate reading time
      const readingTimeMin = calculateReadingTime(data.content);

      // Prepare payload
      const payload = {
        ...data,
        readingTimeMin,
        publishedAt: data.status === 'PUBLISHED' ? (data.publishedAt || new Date()) : undefined,
      };

      if (onSubmit) {
        await onSubmit(payload);
      } else {
        // Default submission logic
        const url = mode === 'create'
          ? '/api/admin/landing-pages'
          : `/api/admin/landing-pages/${landingPageId}`;
        const method = mode === 'create' ? 'POST' : 'PUT';

        const response = await fetchWithCSRF(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to ${mode} landing page`);
        }

        toast.success(`Landing page ${mode === 'create' ? 'created' : 'updated'} successfully`);
        router.push('/admin/landing-pages');
        router.refresh();
      }
    } catch (error) {
      console.error(`Error ${mode}ing landing page:`, error);
      toast.error(
        error instanceof Error ? error.message : `Failed to ${mode} landing page`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== 'edit' || !onDelete) {
      return;
    }
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setDeleteDialogOpen(false);
    try {
      await onDelete!();
      toast.success('Landing page deleted successfully!');
      router.push('/admin/landing-pages');
    } catch (error) {
      console.error('Error deleting landing page:', error);
      toast.error('Failed to delete landing page. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 md:py-8 px-4 max-w-6xl">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Link href="/admin/landing-pages">
          <Button variant="ghost" size="sm" className="mb-3 md:mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Landing Pages
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">
          {mode === 'create' ? 'Create New Landing Page' : 'Edit Landing Page'}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {mode === 'create'
            ? 'Write and publish a new landing page for your website'
            : 'Update landing page details and content'}
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            handleSubmit,
            (errors) => console.log('❌ Validation errors:', errors)
          )}
          className="space-y-6"
        >
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Title <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Spring Sale Campaign 2025"
                        {...field}
                        onChange={(e) => handleTitleChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      {LANDING_PAGE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH}-{LANDING_PAGE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH} characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug */}
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Slug <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="10-health-benefits-traditional-jamu"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {mode === 'create'
                        ? 'URL-friendly identifier (auto-generated)'
                        : 'URL-friendly identifier (changing this may break existing links)'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Status <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Auto-set publishedAt when status changes to PUBLISHED
                          if (value === 'PUBLISHED' && !form.getValues('publishedAt')) {
                            form.setValue('publishedAt', new Date());
                          }
                        }}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="PUBLISHED">Published</SelectItem>
                          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="space-y-2">
                      {field.value.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((tag) => (
                            <div
                              key={tag}
                              className="inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-destructive"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          placeholder={LANDING_PAGE_CONSTANTS.TAG_EXAMPLES}
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddTag}
                          disabled={field.value.length >= LANDING_PAGE_CONSTANTS.VALIDATION.MAX_TAGS}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <FormDescription>
                      Press Enter or click Add to add tags (max {LANDING_PAGE_CONSTANTS.VALIDATION.MAX_TAGS})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Featured Image <span className="text-red-500">*</span>
                </label>
                <ImageUpload
                  value={featuredImageUrl ? [{ url: featuredImageUrl }] : []}
                  onChange={handleFeaturedImageChange}
                  maxFiles={LANDING_PAGE_CONSTANTS.IMAGE_UPLOAD.MAX_FILES}
                  maxSize={LANDING_PAGE_CONSTANTS.IMAGE_UPLOAD.MAX_FILE_SIZE}
                  accept={LANDING_PAGE_CONSTANTS.IMAGE_UPLOAD.ACCEPTED_MIME_TYPES}
                />
                <p className="text-sm text-muted-foreground">
                  Upload landing page featured image (optimal size: {LANDING_PAGE_CONSTANTS.IMAGE_UPLOAD.OPTIMAL_WIDTH}×{LANDING_PAGE_CONSTANTS.IMAGE_UPLOAD.OPTIMAL_HEIGHT}px for best display)
                </p>
                {form.formState.errors.featuredImage && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.featuredImage.message}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="featuredImageAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Alt Text <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Spring sale promotional banner"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>SEO-friendly description of the image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Landing Page Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Excerpt */}
              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief summary of the landing page (auto-generated from content if empty)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Short description for landing page preview{mode === 'create' ? ' (auto-generated if empty)' : ''}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content Editor */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Content <span className="text-red-500">*</span>
                </label>
                <TipTapEditor
                  content={form.watch('content')}
                  onChange={handleContentChange}
                  placeholder="Write your landing page content here... (minimum 100 characters)"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum {LANDING_PAGE_CONSTANTS.VALIDATION.CONTENT_MIN_LENGTH} characters
                </p>
                {form.formState.errors.content && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.content.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>Product Showcase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProductShowcaseSelector
                selectedProductIds={form.watch('featuredProductIds') || []}
                layout={form.watch('productShowcaseLayout') || 'GRID'}
                onChange={(productIds, layout) => {
                  form.setValue('featuredProductIds', productIds);
                  form.setValue('productShowcaseLayout', layout);
                }}
              />
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="metaTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SEO title (defaults to landing page title)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Leave empty to use landing page title</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metaDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="SEO description (max 300 characters)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Search engine description (max {LANDING_PAGE_CONSTANTS.VALIDATION.META_DESCRIPTION_MAX_LENGTH} chars)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  mode === 'create' ? (
                    'Creating landing page...'
                  ) : (
                    'Updating landing page...'
                  )
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create Landing Page' : 'Update Landing Page'}
                  </>
                )}
              </Button>

              {mode === 'edit' && form.watch('slug') && (
                <Link
                  href={`/landing/${form.watch('slug')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Live View Landing Page
                  </Button>
                </Link>
              )}

              {mode === 'edit' && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Landing Page
                </Button>
              )}

              <Link href="/admin/landing-pages" className="w-full block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </Link>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Landing Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this landing page? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
