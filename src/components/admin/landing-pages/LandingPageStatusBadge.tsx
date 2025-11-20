/**
 * Landing Page Status Badge Component
 * Displays status with appropriate color and icon
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import type { LandingPageStatus } from '@/types/landing-page.types';

interface LandingPageStatusBadgeProps {
  status: LandingPageStatus;
  className?: string;
}

export function LandingPageStatusBadge({ status, className }: LandingPageStatusBadgeProps) {
  if (status === 'PUBLISHED') {
    return (
      <Badge variant="default" className={`bg-green-600 ${className || ''}`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Published
      </Badge>
    );
  }

  if (status === 'SCHEDULED') {
    return (
      <Badge variant="default" className={`bg-blue-600 ${className || ''}`}>
        <Clock className="w-3 h-3 mr-1" />
        Scheduled
      </Badge>
    );
  }

  // DRAFT
  return (
    <Badge variant="secondary" className={className}>
      <XCircle className="w-3 h-3 mr-1" />
      Draft
    </Badge>
  );
}
