/**
 * Admin FAQ Edit Page
 * /admin/content/faqs/[id]/edit
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
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { FAQ_CONSTANTS } from '@/lib/constants/faq-constants';
import { faqUpdateSchema } from '@/lib/validations/faq-validation';
import type { FAQFormData } from '@/types/faq.types';

export default function AdminFAQEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form setup
  const form = useForm<FAQFormData>({
    resolver: zodResolver(faqUpdateSchema),
    defaultValues: {
      question: '',
      answer: '',
      category: 'ABOUT_US',
      sortOrder: 0,
      status: 'ACTIVE',
    },
  });

  // Fetch existing FAQ
  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${FAQ_CONSTANTS.API_ROUTES.ADMIN_BASE}/${params.id}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch FAQ');
        }

        const data = await response.json();
        const faq = data.faq;

        // Populate form with existing data
        form.reset({
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          sortOrder: faq.sortOrder,
          status: faq.status,
        });
      } catch (error) {
        console.error('Error fetching FAQ:', error);
        toast({
          title: 'Error',
          description: 'Failed to load FAQ',
          variant: 'destructive',
        });
        router.push('/admin/content/faqs');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQ();
  }, [params.id, form, router, toast]);

  // Submit handler
  const onSubmit = async (data: FAQFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${FAQ_CONSTANTS.API_ROUTES.ADMIN_BASE}/${params.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update FAQ');
      }

      toast({
        title: 'Success',
        description: 'FAQ updated successfully',
      });

      router.push('/admin/content/faqs');
      router.refresh();
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update FAQ',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/content/faqs">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to FAQs
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Edit FAQ</h1>
        <p className="text-muted-foreground">
          Update FAQ details
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>FAQ Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Question */}
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Question (Bahasa Malaysia) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apa itu JRM HOLISTIK?"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
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
                      Answer (Bahasa Malaysia) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="JRM HOLISTIK adalah..."
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The detailed answer (20-5000 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(FAQ_CONSTANTS.CATEGORIES).map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label} - {cat.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Group this FAQ under a category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sort Order */}
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first (0 = top)
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
                      value={field.value}
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
                    <FormDescription>
                      Active FAQs are visible on the website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/admin/content/faqs">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Updating...' : 'Update FAQ'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
