/**
 * Admin Article Edit Page
 * /admin/content/articles/[id]/edit
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
import { articleUpdateSchema } from '@/lib/validations/article-validation';
import type { ArticleFormData, ArticleCategory } from '@/types/article.types';
import TipTapEditor from '@/components/admin/TipTapEditor';
import { calculateReadingTime } from '@/lib/constants/article-constants';

export default function AdminArticleEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Form setup
  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleUpdateSchema),
    defaultValues: {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
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
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch existing article
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/articles/${params.id}`);

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
      } catch (error) {
        console.error('Error fetching article:', error);
        toast.error('Failed to load article');
        router.push('/admin/content/articles');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [params.id, form, router]);

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

  // Submit handler
  const onSubmit = async (data: ArticleFormData) => {
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

      const response = await fetch(`/api/admin/articles/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update article');
      }

      toast.success('Article updated successfully');
      router.push('/admin/content/articles');
      router.refresh();
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update article'
      );
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-2xl md:text-3xl font-bold">Edit Article</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Update article details and content
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <Input placeholder="Article title" {...field} />
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
                      <Input placeholder="article-slug" {...field} />
                    </FormControl>
                    <FormDescription>
                      URL-friendly identifier (changing this may break existing links)
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                          placeholder="Add tag"
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
              <FormField
                control={form.control}
                name="featuredImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Image URL <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Image URL" {...field} />
                    </FormControl>
                    <FormDescription>Full URL or path to featured image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featuredImageAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Alt Text <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Image description" {...field} />
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
                        placeholder="Brief summary of the article"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Short description for article preview</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content Editor */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Content <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <TipTapEditor
                        content={field.value}
                        onChange={(html) => form.setValue('content', html)}
                        placeholder="Write your article content here..."
                      />
                    </FormControl>
                    <FormDescription>Minimum 100 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
                      <Input placeholder="SEO title" {...field} />
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
              {isSubmitting ? 'Updating...' : 'Update Article'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
