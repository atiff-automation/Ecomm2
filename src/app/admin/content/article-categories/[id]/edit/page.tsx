/**
 * Admin Article Category Edit Page
 * /admin/content/article-categories/[id]/edit
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { articleCategoryUpdateSchema } from '@/lib/validations/article-validation';
import type { ArticleCategoryUpdateInput } from '@/types/article.types';

const ICON_OPTIONS = [
  { value: 'FileText', label: 'File Text (📄)' },
  { value: 'BookOpen', label: 'Book Open (📖)' },
  { value: 'Newspaper', label: 'Newspaper (📰)' },
  { value: 'Lightbulb', label: 'Lightbulb (💡)' },
  { value: 'Heart', label: 'Heart (❤️)' },
  { value: 'Star', label: 'Star (⭐)' },
  { value: 'Sparkles', label: 'Sparkles (✨)' },
  { value: 'Zap', label: 'Zap (⚡)' },
  { value: 'Trophy', label: 'Trophy (🏆)' },
  { value: 'Target', label: 'Target (🎯)' },
];

const COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#6366F1', label: 'Indigo' },
];

export default function AdminArticleCategoryEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form setup
  const form = useForm<ArticleCategoryUpdateInput>({
    resolver: zodResolver(articleCategoryUpdateSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      icon: 'FileText',
      color: '#3B82F6',
      sortOrder: 0,
      isActive: true,
    },
  });

  // Fetch existing category
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/article-categories/${params.id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch category');
        }

        const data = await response.json();
        const category = data.category;

        // Populate form
        form.reset({
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          icon: category.icon || 'FileText',
          color: category.color || '#3B82F6',
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        });
      } catch (error) {
        console.error('Error fetching category:', error);
        toast.error('Failed to load category');
        router.push('/admin/content/article-categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [params.id, form, router]);

  // Submit handler
  const onSubmit = async (data: ArticleCategoryUpdateInput) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/article-categories/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }

      toast.success('Article category updated successfully');

      router.push('/admin/content/article-categories');
      router.refresh();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update category'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 md:py-8 px-4 max-w-4xl">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Link href="/admin/content/article-categories">
          <Button variant="ghost" size="sm" className="mb-3 md:mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Article Category</h1>
        <p className="text-sm md:text-base text-muted-foreground">Update category details</p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              {/* Category Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Health Tips"
                        {...field}
                      />
                    </FormControl>
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
                        placeholder="health-tips"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs md:text-sm">
                      URL-friendly identifier (changing this may break existing links)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Articles about health and wellness tips"
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs md:text-sm">
                      Brief description for admin reference (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Icon and Color Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Icon */}
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ICON_OPTIONS.map((icon) => (
                            <SelectItem key={icon.value} value={icon.value}>
                              {icon.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs md:text-sm">
                        Icon to display with the category
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Color */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COLOR_OPTIONS.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs md:text-sm">
                        Badge color for category display
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 md:p-4 gap-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm md:text-base">Active Status</FormLabel>
                      <FormDescription className="text-xs md:text-sm">
                        Active categories are visible on the public articles page
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
            <Link href="/admin/content/article-categories" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Updating...' : 'Update Category'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
