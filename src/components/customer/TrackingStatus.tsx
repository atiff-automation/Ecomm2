/**
 * TrackingStatus Component
 * Reusable tracking status badge component
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle,
  AlertCircle,
  MapPin,
  Loader2
} from 'lucide-react';
import { getTrackingStatusInfo } from '@/lib/config/tracking';

export type TrackingStatusType = 
  | 'pending'
  | 'created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'failed'
  | 'cancelled';

interface TrackingStatusProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

/**
 * Get status configuration including color, icon, and display text
 * Uses centralized status mapping with fallback to local mapping
 */
const getStatusConfig = (status: string) => {
  // Try centralized config first
  const centralizedConfig = getTrackingStatusInfo(status);
  if (centralizedConfig.key !== 'UNKNOWN') {
    // Map icon name to actual icon component
    const iconMap: Record<string, any> = {
      CheckCircle,
      Truck,
      Package,
      Clock,
      AlertCircle,
      MapPin,
      Loader2,
    };
    
    return {
      color: centralizedConfig.color,
      icon: iconMap[centralizedConfig.icon] || Package,
      text: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
      description: `Status: ${status}`
    };
  }
  
  // Fallback to local mapping for specific cases
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');

  switch (normalizedStatus) {
    case 'delivered':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        text: 'Delivered',
        description: 'Package has been delivered'
      };
    
    case 'out_for_delivery':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Truck,
        text: 'Out for Delivery',
        description: 'Package is out for delivery'
      };
    
    case 'in_transit':
      return {
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: Truck,
        text: 'In Transit',
        description: 'Package is on its way'
      };
    
    case 'picked_up':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Package,
        text: 'Picked Up',
        description: 'Package has been collected'
      };
    
    case 'processing':
    case 'pending':
    case 'created':
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
        text: 'Processing',
        description: 'Order is being prepared'
      };
    
    case 'exception':
    case 'failed':
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertCircle,
        text: 'Exception',
        description: 'Delivery issue detected'
      };
    
    case 'cancelled':
      return {
        color: 'bg-gray-100 text-gray-600 border-gray-200',
        icon: AlertCircle,
        text: 'Cancelled',
        description: 'Shipment cancelled'
      };
    
    case 'at_depot':
    case 'at_hub':
      return {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: MapPin,
        text: 'At Depot',
        description: 'Package at sorting facility'
      };
    
    case 'loading':
    case 'updating':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Loader2,
        text: 'Updating',
        description: 'Status being updated'
      };
    
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Package,
        text: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
        description: `Status: ${status}`
      };
  }
};

/**
 * Get size-specific classes
 */
const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        badge: 'text-xs px-2 py-1',
        icon: 'h-3 w-3'
      };
    case 'lg':
      return {
        badge: 'text-base px-4 py-2',
        icon: 'h-5 w-5'
      };
    default: // md
      return {
        badge: 'text-sm px-3 py-1',
        icon: 'h-4 w-4'
      };
  }
};

export default function TrackingStatus({ 
  status, 
  size = 'md', 
  showIcon = true,
  variant = 'outline',
  className = ''
}: TrackingStatusProps) {
  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);
  const StatusIcon = config.icon;

  const badgeClassName = variant === 'outline' 
    ? `${config.color} ${sizeClasses.badge} ${className}`
    : `${sizeClasses.badge} ${className}`;

  return (
    <Badge 
      variant={variant}
      className={badgeClassName}
      title={config.description}
    >
      {showIcon && (
        <StatusIcon 
          className={`${sizeClasses.icon} mr-1 ${
            config.text === 'Updating' ? 'animate-spin' : ''
          }`} 
        />
      )}
      {config.text}
    </Badge>
  );
}

/**
 * TrackingStatusList Component
 * Displays multiple status badges in a row
 */
interface TrackingStatusListProps {
  statuses: Array<{
    status: string;
    label?: string;
    timestamp?: string;
  }>;
  size?: 'sm' | 'md' | 'lg';
  showIcons?: boolean;
  className?: string;
}

export function TrackingStatusList({ 
  statuses, 
  size = 'sm', 
  showIcons = true,
  className = ''
}: TrackingStatusListProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {statuses.map((item, index) => (
        <div key={index} className="flex flex-col items-start gap-1">
          <TrackingStatus 
            status={item.status}
            size={size}
            showIcon={showIcons}
          />
          {item.label && (
            <span className="text-xs text-gray-500">{item.label}</span>
          )}
          {item.timestamp && (
            <span className="text-xs text-gray-400">
              {new Date(item.timestamp).toLocaleDateString('en-MY')}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Helper function to determine if status is terminal (final state)
 */
export function isTerminalStatus(status: string): boolean {
  const terminalStatuses = ['delivered', 'cancelled', 'failed', 'exception'];
  return terminalStatuses.includes(status.toLowerCase());
}

/**
 * Helper function to determine if status indicates active shipping
 */
export function isActiveShipping(status: string): boolean {
  const activeStatuses = ['picked_up', 'in_transit', 'out_for_delivery', 'at_depot', 'at_hub'];
  return activeStatuses.includes(status.toLowerCase().replace(/\s+/g, '_'));
}

/**
 * Helper function to get status priority for sorting
 */
export function getStatusPriority(status: string): number {
  const priorities: Record<string, number> = {
    'delivered': 10,
    'out_for_delivery': 9,
    'in_transit': 8,
    'picked_up': 7,
    'at_depot': 6,
    'at_hub': 5,
    'created': 4,
    'pending': 3,
    'processing': 2,
    'exception': 1,
    'failed': 1,
    'cancelled': 0
  };
  
  return priorities[status.toLowerCase().replace(/\s+/g, '_')] || 2;
}