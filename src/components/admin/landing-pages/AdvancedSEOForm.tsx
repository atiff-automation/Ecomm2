/**
 * Advanced SEO Form Component
 * Provides fields for advanced SEO configuration and analytics tracking
 * Used within LandingPageForm
 */

'use client';

import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X, Info } from 'lucide-react';
import type { LandingPageFormData } from '@/types/landing-page.types';

interface AdvancedSEOFormProps {
  form: UseFormReturn<LandingPageFormData>;
}

export function AdvancedSEOForm({ form }: AdvancedSEOFormProps) {
  const [headScript, setHeadScript] = useState('');
  const [bodyScript, setBodyScript] = useState('');

  // Get current custom scripts
  const customScripts = form.watch('customScripts') || { head: [], body: [] };

  // Add head script
  const handleAddHeadScript = () => {
    if (headScript.trim()) {
      const current = form.getValues('customScripts') || { head: [], body: [] };
      form.setValue('customScripts', {
        ...current,
        head: [...current.head, headScript.trim()],
      });
      setHeadScript('');
    }
  };

  // Add body script
  const handleAddBodyScript = () => {
    if (bodyScript.trim()) {
      const current = form.getValues('customScripts') || { head: [], body: [] };
      form.setValue('customScripts', {
        ...current,
        body: [...current.body, bodyScript.trim()],
      });
      setBodyScript('');
    }
  };

  // Remove head script
  const handleRemoveHeadScript = (index: number) => {
    const current = form.getValues('customScripts') || { head: [], body: [] };
    form.setValue('customScripts', {
      ...current,
      head: current.head.filter((_, i) => i !== index),
    });
  };

  // Remove body script
  const handleRemoveBodyScript = (index: number) => {
    const current = form.getValues('customScripts') || { head: [], body: [] };
    form.setValue('customScripts', {
      ...current,
      body: current.body.filter((_, i) => i !== index),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced SEO & Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="social" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="social">Social Sharing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="scripts">Custom Scripts</TabsTrigger>
          </TabsList>

          {/* Social Sharing Tab */}
          <TabsContent value="social" className="space-y-4 mt-4">
            {/* Open Graph Image */}
            <FormField
              control={form.control}
              name="ogImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Open Graph Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/og-image.jpg"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Custom image for Facebook, LinkedIn sharing (1200×630px recommended)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Twitter Card Image */}
            <FormField
              control={form.control}
              name="twitterImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter Card Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/twitter-image.jpg"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Falls back to OG image if not set (1200×600px recommended)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Canonical URL */}
            <FormField
              control={form.control}
              name="canonicalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canonical URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/landing/slug"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Specify the preferred URL for search engines (prevents duplicate content issues)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* No Index */}
            <FormField
              control={form.control}
              name="noIndex"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Prevent Search Indexing</FormLabel>
                    <FormDescription>
                      Add noindex meta tag to prevent search engines from indexing this page
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            {/* Facebook Pixel ID */}
            <FormField
              control={form.control}
              name="fbPixelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facebook Pixel ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="123456789012345"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    15-20 digit numeric ID (e.g., 123456789012345)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Google Analytics Tracking ID */}
            <FormField
              control={form.control}
              name="gaTrackingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Analytics Tracking ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="G-XXXXXXXXXX or UA-XXXXX-Y"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    GA4 (G-XXXXXXXXXX) or Universal Analytics (UA-XXXXX-Y) format
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Google Tag Manager Container ID */}
            <FormField
              control={form.control}
              name="gtmContainerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Tag Manager Container ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="GTM-XXXXXX"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Format: GTM-XXXXXX (6+ alphanumeric characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 flex gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                These tracking codes will be automatically injected into the landing page when published
              </p>
            </div>
          </TabsContent>

          {/* Custom Scripts Tab */}
          <TabsContent value="scripts" className="space-y-4 mt-4">
            {/* Head Scripts */}
            <div className="space-y-2">
              <FormLabel>Custom Head Scripts</FormLabel>
              <FormDescription>
                Add custom JavaScript or meta tags to the {'<head>'} section
              </FormDescription>

              {customScripts.head.length > 0 && (
                <div className="space-y-2 mt-2">
                  {customScripts.head.map((script, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-muted rounded-md"
                    >
                      <code className="flex-1 text-xs break-all">{script}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHeadScript(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  placeholder='<script src="https://example.com/script.js"></script>'
                  value={headScript}
                  onChange={(e) => setHeadScript(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddHeadScript}
                  disabled={!headScript.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Body Scripts */}
            <div className="space-y-2">
              <FormLabel>Custom Body Scripts</FormLabel>
              <FormDescription>
                Add custom JavaScript to the end of the {'<body>'} section
              </FormDescription>

              {customScripts.body.length > 0 && (
                <div className="space-y-2 mt-2">
                  {customScripts.body.map((script, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-muted rounded-md"
                    >
                      <code className="flex-1 text-xs break-all">{script}</code>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBodyScript(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Textarea
                  placeholder='<script>console.log("Custom script");</script>'
                  value={bodyScript}
                  onChange={(e) => setBodyScript(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddBodyScript}
                  disabled={!bodyScript.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 flex gap-2">
              <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                Caution: Only add trusted scripts. Malicious scripts can compromise security.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
