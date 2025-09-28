/**
 * Form Step Container Component
 * Generic wrapper for individual form steps
 * Following CLAUDE.md principles: Reusable container pattern
 */

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormStepContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  isFirst?: boolean;
  isLast?: boolean;
  isLoading?: boolean;
  isValid?: boolean;
  className?: string;
}

export function FormStepContainer({
  title,
  subtitle,
  children,
  onNext,
  onPrevious,
  nextLabel = 'Next',
  previousLabel = 'Back',
  isFirst = false,
  isLast = false,
  isLoading = false,
  isValid = true,
  className
}: FormStepContainerProps) {
  const handleNext = () => {
    if (!isLoading && isValid && onNext) {
      onNext();
    }
  };

  const handlePrevious = () => {
    if (!isLoading && onPrevious) {
      onPrevious();
    }
  };

  return (
    <Card className={cn('w-full max-w-4xl mx-auto', className)}>
      <CardHeader className="text-center pb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-gray-600 mt-2">{subtitle}</p>
        )}
      </CardHeader>

      <CardContent className="px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center px-6 py-6 border-t bg-gray-50">
        {/* Previous Button */}
        <div className="flex-1">
          {!isFirst && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{previousLabel}</span>
            </Button>
          )}
        </div>

        {/* Progress Indicator (Mobile) */}
        <div className="flex-1 flex justify-center md:hidden">
          <div className="flex space-x-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full',
                  index <= 2 ? 'bg-green-600' : 'bg-gray-300' // This would be dynamic
                )}
              />
            ))}
          </div>
        </div>

        {/* Next Button */}
        <div className="flex-1 flex justify-end">
          <Button
            type="button"
            onClick={handleNext}
            disabled={isLoading || !isValid}
            className={cn(
              'flex items-center space-x-2',
              {
                'bg-green-600 hover:bg-green-700': isLast,
                'bg-blue-600 hover:bg-blue-700': !isLast
              }
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{isLast ? 'Submit Application' : nextLabel}</span>
                {!isLast && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}