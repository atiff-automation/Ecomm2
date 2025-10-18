/**
 * Tab Status Icon Component - JRM E-commerce Platform
 * Small status indicator for form tabs
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabStatusIconProps {
  status: 'complete' | 'error' | 'incomplete';
  className?: string;
}

export function TabStatusIcon({ status, className }: TabStatusIconProps) {
  const getIcon = () => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'incomplete':
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  return <div className={cn('flex-shrink-0', className)}>{getIcon()}</div>;
}

export default TabStatusIcon;
