/**
 * Loading Components - Malaysian E-commerce Platform
 * Comprehensive loading states and skeleton components
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, ShoppingCart, Package, Search } from 'lucide-react';

// Base loading spinner
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2
      className={cn('animate-spin text-primary', sizeClasses[size], className)}
    />
  );
}

// Contextual loading indicators
export interface LoadingIndicatorProps {
  type?: 'default' | 'cart' | 'product' | 'search';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function LoadingIndicator({
  type = 'default',
  size = 'md',
  message,
  className,
}: LoadingIndicatorProps) {
  const getIcon = () => {
    switch (type) {
      case 'cart':
        return <ShoppingCart className="animate-pulse" />;
      case 'product':
        return <Package className="animate-pulse" />;
      case 'search':
        return <Search className="animate-pulse" />;
      default:
        return <LoadingSpinner size={size} />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'cart':
        return 'Updating cart...';
      case 'product':
        return 'Loading products...';
      case 'search':
        return 'Searching...';
      default:
        return 'Loading...';
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'flex items-center space-x-2 text-muted-foreground',
        className
      )}
    >
      <div className={sizeClasses[size]}>{getIcon()}</div>
      {message !== false && (
        <span className="text-sm">{message || getDefaultMessage()}</span>
      )}
    </div>
  );
}

// Full page loading
export interface PageLoadingProps {
  message?: string;
  showLogo?: boolean;
}

export function PageLoading({
  message = 'Loading...',
  showLogo = true,
}: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {showLogo && (
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
        )}
        <LoadingSpinner size="lg" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Section loading overlay
export interface SectionLoadingProps {
  message?: string;
  className?: string;
  transparent?: boolean;
}

export function SectionLoading({
  message = 'Loading...',
  className,
  transparent = false,
}: SectionLoadingProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex items-center justify-center z-10',
        transparent ? 'bg-background/50' : 'bg-background/80',
        'backdrop-blur-sm',
        className
      )}
    >
      <div className="text-center space-y-2">
        <LoadingSpinner size="md" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Button loading state
export interface ButtonLoadingProps {
  children: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  className?: string;
  [key: string]: any;
}

export function ButtonLoading({
  children,
  loading = false,
  loadingText,
  className,
  ...props
}: ButtonLoadingProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center space-x-2',
        loading && 'opacity-70 cursor-not-allowed',
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}
