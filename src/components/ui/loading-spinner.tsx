import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingSpinnerWithText({
  size = 'md',
  text = 'Loading...',
  className,
}: LoadingSpinnerProps & { text?: string }) {
  return (
    <div className={cn('flex flex-col items-center space-y-2', className)}>
      <LoadingSpinner size={size} />
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}
