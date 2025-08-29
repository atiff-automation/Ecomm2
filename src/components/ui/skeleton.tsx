/**
 * Skeleton Components - Malaysian E-commerce Platform
 * Reusable skeleton loading components for different content types
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from './card';
import { useReducedMotion } from '@/hooks/use-accessibility';

// Base skeleton component
export interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const prefersReducedMotion = useReducedMotion();
  const baseClasses = 'bg-muted';

  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  const animationClasses = {
    pulse: prefersReducedMotion ? '' : 'animate-pulse',
    wave: prefersReducedMotion ? '' : 'animate-pulse', // Could be enhanced with custom wave animation
    none: '',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      role="status"
      aria-label="Loading content"
      aria-busy="true"
    />
  );
}

// Product card skeleton
export interface ProductCardSkeletonProps {
  className?: string;
  showDescription?: boolean;
  showRating?: boolean;
}

export function ProductCardSkeleton({
  className,
  showDescription = true,
  showRating = true,
}: ProductCardSkeletonProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Card
      className={cn('overflow-hidden', className)}
      role="status"
      aria-label="Loading product information"
      aria-busy="true"
    >
      {/* Product image */}
      <div
        className={`aspect-square bg-muted ${prefersReducedMotion ? '' : 'animate-pulse'}`}
        aria-label="Loading product image"
      />

      <CardContent className="p-4 space-y-3">
        {/* Product name */}
        <Skeleton className="h-5 w-3/4" />

        {/* Rating */}
        {showRating && (
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} variant="circular" className="w-3 h-3" />
              ))}
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        )}

        {/* Description */}
        {showDescription && (
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        )}

        {/* Price */}
        <div className="space-y-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Add to cart button */}
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

// Product list skeleton
export interface ProductListSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4 | 6;
  className?: string;
}

export function ProductListSkeleton({
  count = 8,
  columns = 4,
  className,
}: ProductListSkeletonProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-6', gridClasses[columns], className)}>
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Category card skeleton
export function CategoryCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      className={cn(
        'hover:shadow-lg transition-shadow cursor-pointer',
        className
      )}
    >
      <CardContent className="p-6 text-center space-y-4">
        {/* Category icon */}
        <Skeleton variant="circular" className="w-16 h-16 mx-auto" />

        {/* Category name */}
        <Skeleton className="h-4 w-20 mx-auto" />

        {/* Product count */}
        <Skeleton className="h-3 w-16 mx-auto" />
      </CardContent>
    </Card>
  );
}

// Cart item skeleton
export function CartItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center space-x-4 p-4 border-b', className)}>
      {/* Product image */}
      <Skeleton className="w-16 h-16 rounded" />

      <div className="flex-1 space-y-2">
        {/* Product name */}
        <Skeleton className="h-4 w-3/4" />

        {/* Product price */}
        <Skeleton className="h-3 w-1/4" />
      </div>

      {/* Quantity controls */}
      <div className="flex items-center space-x-2">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-8 h-6" />
        <Skeleton className="w-8 h-8 rounded" />
      </div>

      {/* Remove button */}
      <Skeleton className="w-8 h-8 rounded" />
    </div>
  );
}

// Table skeleton
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  hasHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {hasHeader && (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      )}

      <div className="space-y-3">
        {[...Array(rows)].map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {[...Array(columns)].map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Text skeleton for various text content
export interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export function TextSkeleton({
  lines = 3,
  className,
  lastLineWidth = '75%',
}: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

// Page header skeleton
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 mb-8', className)}>
      {/* Title */}
      <Skeleton className="h-8 w-64" />

      {/* Subtitle */}
      <Skeleton className="h-4 w-96" />

      {/* Breadcrumb */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-1" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

// Stats/metrics skeleton
export function StatsSkeletonProps({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
        className
      )}
    >
      {[...Array(count)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-3">
            {/* Icon */}
            <Skeleton variant="circular" className="w-10 h-10" />

            {/* Value */}
            <Skeleton className="h-6 w-16" />

            {/* Label */}
            <Skeleton className="h-3 w-20" />

            {/* Change indicator */}
            <Skeleton className="h-3 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Form skeleton
export interface FormSkeletonProps {
  fields?: number;
  hasSubmitButton?: boolean;
  className?: string;
}

export function FormSkeleton({
  fields = 5,
  hasSubmitButton = true,
  className,
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          {/* Field label */}
          <Skeleton className="h-4 w-24" />

          {/* Field input */}
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}

      {hasSubmitButton && <Skeleton className="h-10 w-32 rounded-md" />}
    </div>
  );
}
