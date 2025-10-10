'use client';

import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  SHIPMENT_STATUSES,
} from '@/lib/constants/order';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { OrderStatusBadgeProps } from './types';

/**
 * Status badge component with icon and color coding
 */
export function OrderStatusBadge({
  status,
  type,
  size = 'md',
  showIcon = true,
  className,
}: OrderStatusBadgeProps) {
  // Get status configuration
  const statusMap = {
    order: ORDER_STATUSES,
    payment: PAYMENT_STATUSES,
    shipment: SHIPMENT_STATUSES,
  }[type];

  const config = statusMap[status as keyof typeof statusMap] as
    | {
        value: string;
        label: string;
        color: string;
        icon: string;
        description: string;
      }
    | undefined;

  if (!config) {
    return (
      <Badge variant="secondary" className={className}>
        {status}
      </Badge>
    );
  }

  // Get icon component dynamically
  const IconComponent = showIcon
    ? (LucideIcons[
        config.icon as keyof typeof LucideIcons
      ] as React.ComponentType<{
        className?: string;
      }>)
    : null;

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  // Color classes
  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 border-gray-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-medium border',
        sizeClasses[size],
        colorClasses[config.color] || colorClasses.gray,
        className
      )}
      title={config.description}
    >
      {IconComponent && (
        <IconComponent
          className={cn('flex-shrink-0', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')}
        />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}
