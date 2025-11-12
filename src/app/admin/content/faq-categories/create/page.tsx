/**
 * Admin FAQ Category Create Page
 * /admin/content/faq-categories/create
 */

'use client';

import { useState } from 'react';
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
import { faqCategoryCreateSchema } from '@/lib/validations/faq-category-validation';
import type { FAQCategoryFormData } from '@/types/faq-category.types';

const ICON_OPTIONS = [
  { value: 'Info', label: 'Info (ℹ️)' },
  { value: 'Package', label: 'Package (📦)' },
  { value: 'Truck', label: 'Truck (🚚)' },
  { value: 'CreditCard', label: 'Credit Card (💳)' },
  { value: 'Users', label: 'Users (👥)' },
  { value: 'Shield', label: 'Shield (🛡️)' },
  { value: 'HelpCircle', label: 'Help Circle (❓)' },
  { value: 'Settings', label: 'Settings (⚙️)' },
  { value: 'FileText', label: 'File Text (📄)' },
  { value: 'MessageSquare', label: 'Message (💬)' },
];

export default function AdminFAQCategoryCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const form = useForm<FAQCategoryFormData>({
    resolver: zodResolver(faqCategoryCreateSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Info',
      sortOrder: 0,
      isActive: true,
    },
  });

  // Submit handler
  const onSubmit = async (data: FAQCategoryFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/admin/faq-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create category');
      }

      toast.success('FAQ category created successfully');

      router.push('/admin/content/faq-categories');
      router.refresh();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create category'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Link href="/admin/content/faq-categories">
          <Button variant="ghost" size="sm" className="mb-3 md:mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Create New FAQ Category</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Add a new category to organize FAQs
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">Category Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              {/* Category */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="About Us"
                        {...field}
                      />
                    </FormControl>
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
                        placeholder="Questions about company and brand"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs md:text-sm">
                      Brief description for admin reference (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Icon */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                      Icon to display with the category (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 md:p-4 gap-2">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm md:text-base">Active Status</FormLabel>
                      <FormDescription className="text-xs md:text-sm">
                        Active categories are visible on the public FAQ page
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
            <Link href="/admin/content/faq-categories" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
