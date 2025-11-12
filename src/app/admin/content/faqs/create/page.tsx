/**
 * Admin FAQ Create Page
 * /admin/content/faqs/create
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
import { FAQ_CONSTANTS } from '@/lib/constants/faq-constants';
import { faqCreateSchema } from '@/lib/validations/faq-validation';
import type { FAQFormData } from '@/types/faq.types';
import type { FAQCategoryPublic } from '@/types/faq-category.types';

export default function AdminFAQCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<FAQCategoryPublic[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/faq-categories?isActive=true');
        if (!response.ok) throw new Error('Failed to fetch categories');

        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Form setup
  const form = useForm<FAQFormData>({
    resolver: zodResolver(faqCreateSchema),
    defaultValues: {
      question: '',
      answer: '',
      categoryId: '',
      sortOrder: 0,
      status: 'ACTIVE',
    },
  });

  // Submit handler
  const onSubmit = async (data: FAQFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(FAQ_CONSTANTS.API_ROUTES.ADMIN_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create FAQ');
      }

      toast.success('FAQ created successfully');

      router.push('/admin/content/faqs');
      router.refresh();
    } catch (error) {
      console.error('Error creating FAQ:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create FAQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Link href="/admin/content/faqs">
          <Button variant="ghost" size="sm" className="mb-3 md:mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to FAQs
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Create New FAQ</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Add a new frequently asked question
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl">FAQ Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
              {/* Question */}
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Question <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apa itu JRM HOLISTIK?"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs md:text-sm">
                      The question that customers ask (10-500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Answer */}
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Answer <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="JRM HOLISTIK adalah..."
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs md:text-sm">
                      The detailed answer (20-5000 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      defaultValue={field.value}
                      disabled={loadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select category"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}{cat.description ? ` - ${cat.description}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs md:text-sm">
                      Group this FAQ under a category
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
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(FAQ_CONSTANTS.STATUS).map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs md:text-sm">
                      Active FAQs are visible on the website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
            <Link href="/admin/content/faqs" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create FAQ'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
