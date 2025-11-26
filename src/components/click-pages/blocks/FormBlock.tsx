'use client';

/**
 * Form Block Component
 * Lead capture and contact forms with validation
 * Supports multiple field types and form submission
 */

import type { FormBlock } from '@/types/click-page.types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BLOCK_WIDTH_DEFAULTS, getBlockWidthClasses } from '@/lib/constants/click-page-blocks';

interface FormBlockComponentProps {
  block: FormBlock;
  clickPageSlug?: string;
}

export function FormBlockComponent({ block, clickPageSlug }: FormBlockComponentProps) {
  const { settings } = block;
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate that we have the click page slug
      if (!clickPageSlug) {
        throw new Error('Click page slug is required');
      }

      // Submit form data to API
      const response = await fetch(`/api/public/click-pages/${clickPageSlug}/forms/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blockId: block.id,
          data: formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit form');
      }

      const result = await response.json();
      setIsSubmitted(true);

      // Redirect if URL is configured (either from settings or API response)
      const redirectUrl = result.redirectUrl || settings.redirectUrl;
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form. Please try again.');
      console.error('[FormBlock] Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  if (isSubmitted) {
    return (
      <div className={getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.FORM, settings.fullWidth)}>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
          <p className="text-green-800 dark:text-green-200 font-medium">
            {settings.successMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={getBlockWidthClasses(BLOCK_WIDTH_DEFAULTS.FORM, settings.fullWidth)}>
      {settings.title && (
        <h3 className="text-2xl font-bold mb-2">{settings.title}</h3>
      )}
      {settings.description && (
        <p className="text-gray-600 dark:text-gray-400 mb-6">{settings.description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {settings.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {field.type === 'text' && (
              <Input
                id={field.id}
                type="text"
                placeholder={field.placeholder}
                required={field.required}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                minLength={field.validation?.minLength}
                maxLength={field.validation?.maxLength}
                pattern={field.validation?.pattern}
              />
            )}

            {field.type === 'email' && (
              <Input
                id={field.id}
                type="email"
                placeholder={field.placeholder}
                required={field.required}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
            )}

            {field.type === 'phone' && (
              <Input
                id={field.id}
                type="tel"
                placeholder={field.placeholder}
                required={field.required}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                pattern={field.validation?.pattern}
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                required={field.required}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                minLength={field.validation?.minLength}
                maxLength={field.validation?.maxLength}
                rows={4}
              />
            )}

            {field.type === 'select' && (
              <Select onValueChange={(value) => handleFieldChange(field.id, value)} required={field.required}>
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || 'Select an option'} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === 'checkbox' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  required={field.required}
                  onCheckedChange={(checked) => handleFieldChange(field.id, checked as boolean)}
                />
                <label htmlFor={field.id} className="text-sm cursor-pointer">
                  {field.label}
                </label>
              </div>
            )}

            {field.type === 'radio' && (
              <RadioGroup
                onValueChange={(value) => handleFieldChange(field.id, value)}
                required={field.required}
              >
                {field.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                    <Label htmlFor={`${field.id}-${option}`} className="cursor-pointer font-normal">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        ))}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          variant={settings.submitButtonVariant}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : settings.submitButtonText}
        </Button>
      </form>
    </div>
  );
}

export default FormBlockComponent;
