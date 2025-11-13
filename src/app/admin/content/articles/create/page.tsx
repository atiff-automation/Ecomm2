/**
 * Admin Article Create Page
 * /admin/content/articles/create
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { articleCreateSchema } from '@/lib/validations/article-validation';
import type { ArticleFormData, ArticleCategory } from '@/types/article.types';
import TipTapEditor from '@/components/admin/TipTapEditor';
import { calculateReadingTime, ARTICLE_CONSTANTS } from '@/lib/constants/article-constants';
import ImageUpload, { type UploadedImage } from '@/components/ui/image-upload';

export default function AdminArticleCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');

  // Form setup
  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleCreateSchema),
    defaultValues: {
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
    },
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/article-categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories.filter((c: ArticleCategory) => c.isActive));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    form.setValue('title', value);
    if (!form.formState.dirtyFields.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      form.setValue('slug', slug);
    }
    // Auto-generate meta title if empty
    if (!form.formState.dirtyFields.metaTitle) {
      form.setValue('metaTitle', value);
    }
  };

  // Handle tag addition
  const handleAddTag = () => {
    const tags = form.getValues('tags');
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 10) {
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

  // Auto-generate excerpt from content if empty
  const handleContentChange = (html: string) => {
    form.setValue('content', html);

    // Auto-generate excerpt if not manually set
    if (!form.formState.dirtyFields.excerpt) {
      const text = html.replace(/<[^>]*>/g, '').substring(0, 157);
      form.setValue('excerpt', text + (text.length === 157 ? '...' : ''));
    }
  };

  // Submit handler
  const onSubmit = async (data: ArticleFormData) => {
    console.log('📝 Form submission started', data);
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

      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create article');
      }

      toast.success('Article created successfully');
      router.push('/admin/content/articles');
      router.refresh();
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create article'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-2xl md:text-3xl font-bold">Create New Article</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Write and publish a new article for your website
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            onSubmit,
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
                    <FormDescription>10-200 characters</FormDescription>
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
                    <FormDescription>URL-friendly identifier (auto-generated)</FormDescription>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                          disabled={field.value.length >= 10}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                    <FormDescription>
                      Press Enter or click Add to add tags (max 10)
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
                      Short description for article preview (auto-generated if empty)
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
                <p className="text-sm text-muted-foreground">Minimum 100 characters</p>
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
                    <FormDescription>Search engine description (max 300 chars)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Link href="/admin/content/articles" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Article'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
