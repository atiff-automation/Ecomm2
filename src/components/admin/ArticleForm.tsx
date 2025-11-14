/**
 * Unified Article Form Component - JRM E-commerce Platform
 * Single source of truth for article creation and editing forms
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
import { articleCreateSchema, articleUpdateSchema } from '@/lib/validations/article-validation';
import type { ArticleFormData, ArticleCategory } from '@/types/article.types';
import TipTapEditor from '@/components/admin/TipTapEditor';
import { calculateReadingTime, ARTICLE_CONSTANTS, generateExcerpt } from '@/lib/constants/article-constants';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ArticleFormProps {
  mode: 'create' | 'edit';
  articleId?: string;
  initialData?: Partial<ArticleFormData>;
  onSubmit?: (data: ArticleFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const initialFormData: ArticleFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '<p>Start writing your article...</p>',
  featuredImage: '',
  featuredImageAlt: '',
  categoryId: '',
  tags: [],
  status: 'DRAFT',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: [],
};

export function ArticleForm({
  mode,
  articleId,
  initialData,
  onSubmit,
  onDelete,
}: ArticleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode === 'edit');
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Choose validation schema based on mode
  const validationSchema = mode === 'create' ? articleCreateSchema : articleUpdateSchema;

  // Form setup
  const form = useForm<ArticleFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...initialFormData,
      ...initialData,
    },
  });

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch existing article data for edit mode
  useEffect(() => {
    if (mode === 'edit' && articleId) {
      fetchArticle();
    }
  }, [mode, articleId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/article-categories');
      if (response.ok) {
        const data = await response.json();
        const activeCategories = data.categories.filter((c: ArticleCategory) =>
          mode === 'create' ? c.isActive : true
        );
        setCategories(activeCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchArticle = async () => {
    if (!articleId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/articles/${articleId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      const data = await response.json();
      const article = data.article;

      // Populate form
      form.reset({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt || '',
        content: article.content,
        featuredImage: article.featuredImage,
        featuredImageAlt: article.featuredImageAlt,
        categoryId: article.categoryId,
        tags: article.tags.map((t: any) => t.tag.name),
        status: article.status,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined,
        metaTitle: article.metaTitle || '',
        metaDescription: article.metaDescription || '',
        metaKeywords: article.metaKeywords || [],
      });

      // Set featured image state for ImageUpload component
      setFeaturedImageUrl(article.featuredImage || '');
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Failed to load article');
      router.push('/admin/content/articles');
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
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < ARTICLE_CONSTANTS.VALIDATION.MAX_TAGS) {
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
  const handleSubmit = async (data: ArticleFormData) => {
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
          ? '/api/admin/articles'
          : `/api/admin/articles/${articleId}`;
        const method = mode === 'create' ? 'POST' : 'PUT';

        const response = await fetchWithCSRF(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to ${mode} article`);
        }

        toast.success(`Article ${mode === 'create' ? 'created' : 'updated'} successfully`);
        router.push('/admin/content/articles');
        router.refresh();
      }
    } catch (error) {
      console.error(`Error ${mode}ing article:`, error);
      toast.error(
        error instanceof Error ? error.message : `Failed to ${mode} article`
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
      toast.success('Article deleted successfully!');
      router.push('/admin/content/articles');
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article. Please try again.');
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
        <Link href="/admin/content/articles">
          <Button variant="ghost" size="sm" className="mb-3 md:mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">
          {mode === 'create' ? 'Create New Article' : 'Edit Article'}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {mode === 'create'
            ? 'Write and publish a new article for your website'
            : 'Update article details and content'}
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
                        placeholder="10 Health Benefits of Traditional Jamu"
                        {...field}
                        onChange={(e) => handleTitleChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      {ARTICLE_CONSTANTS.VALIDATION.TITLE_MIN_LENGTH}-{ARTICLE_CONSTANTS.VALIDATION.TITLE_MAX_LENGTH} characters
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

              {/* Category & Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Category <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          placeholder={ARTICLE_CONSTANTS.TAG_EXAMPLES}
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
                          disabled={field.value.length >= ARTICLE_CONSTANTS.VALIDATION.MAX_TAGS}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <FormDescription>
                      Press Enter or click Add to add tags (max {ARTICLE_CONSTANTS.VALIDATION.MAX_TAGS})
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
                  maxFiles={ARTICLE_CONSTANTS.IMAGE_UPLOAD.MAX_FILES}
                  maxSize={ARTICLE_CONSTANTS.IMAGE_UPLOAD.MAX_FILE_SIZE}
                  accept={ARTICLE_CONSTANTS.IMAGE_UPLOAD.ACCEPTED_MIME_TYPES}
                />
                <p className="text-sm text-muted-foreground">
                  Upload article featured image (optimal size: {ARTICLE_CONSTANTS.IMAGE_UPLOAD.OPTIMAL_WIDTH}×{ARTICLE_CONSTANTS.IMAGE_UPLOAD.OPTIMAL_HEIGHT}px for best display)
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
                        placeholder="Traditional jamu herbs and ingredients"
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
              <CardTitle>Article Content</CardTitle>
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
                        placeholder="Brief summary of the article (auto-generated from content if empty)"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Short description for article preview{mode === 'create' ? ' (auto-generated if empty)' : ''}
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
                  placeholder="Write your article content here... (minimum 100 characters)"
                />
                <p className="text-sm text-muted-foreground">
                  Minimum {ARTICLE_CONSTANTS.VALIDATION.CONTENT_MIN_LENGTH} characters
                </p>
                {form.formState.errors.content && (
                  <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.content.message}
                  </p>
                )}
              </div>
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
                        placeholder="SEO title (defaults to article title)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Leave empty to use article title</FormDescription>
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
                      Search engine description (max {ARTICLE_CONSTANTS.VALIDATION.META_DESCRIPTION_MAX_LENGTH} chars)
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
                    'Creating...'
                  ) : (
                    'Updating...'
                  )
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === 'create' ? 'Create Article' : 'Update Article'}
                  </>
                )}
              </Button>

              {mode === 'edit' && form.watch('slug') && (
                <Link
                  href={`/articles/${form.watch('slug')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Live View Article
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
                  Delete Article
                </Button>
              )}

              <Link href="/admin/content/articles" className="w-full block">
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
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
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

export default ArticleForm;
