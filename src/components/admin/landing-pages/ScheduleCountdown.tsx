/**
 * Schedule Countdown Component
 * Displays countdown timer for scheduled landing pages
 */

'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import type { LandingPageStatus } from '@/types/landing-page.types';

interface ScheduleCountdownProps {
  status: LandingPageStatus;
  scheduledPublishAt?: Date | null;
  scheduledUnpublishAt?: Date | null;
  className?: string;
}

/**
 * Calculate time until next scheduled action
 */
function getTimeUntilNextAction(
  scheduledPublishAt: Date | null,
  scheduledUnpublishAt: Date | null,
  status: string
): number | null {
  const now = new Date();

  if (status === 'SCHEDULED' && scheduledPublishAt) {
    const diff = scheduledPublishAt.getTime() - now.getTime();
    return diff > 0 ? diff : null;
  }

  if (status === 'PUBLISHED' && scheduledUnpublishAt) {
    const diff = scheduledUnpublishAt.getTime() - now.getTime();
    return diff > 0 ? diff : null;
  }

  return null;
}

/**
 * Format countdown timer for display
 */
function formatCountdown(milliseconds: number | null): string {
  if (milliseconds === null || milliseconds <= 0) {
    return 'Ready';
  }

  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(' ') : 'Less than 1m';
}

export function ScheduleCountdown({
  status,
  scheduledPublishAt,
  scheduledUnpublishAt,
  className,
}: ScheduleCountdownProps) {
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    // Calculate initial countdown
    const updateCountdown = () => {
      const timeUntil = getTimeUntilNextAction(
        scheduledPublishAt || null,
        scheduledUnpublishAt || null,
        status
      );
      setCountdown(formatCountdown(timeUntil));
    };

    updateCountdown();

    // Update countdown every minute
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [status, scheduledPublishAt, scheduledUnpublishAt]);

  // Don't show anything if no scheduled dates
  if (!scheduledPublishAt && !scheduledUnpublishAt) {
    return null;
  }

  // Determine action text
  const getActionText = () => {
    if (status === 'SCHEDULED') {
      return 'Publishes in';
    }
    if (status === 'PUBLISHED' && scheduledUnpublishAt) {
      return 'Unpublishes in';
    }
    return null;
  };

  const actionText = getActionText();

  if (!actionText) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className || ''}`}>
      <Clock className="w-3 h-3" />
      <span>
        {actionText}: <span className="font-medium text-foreground">{countdown}</span>
      </span>
    </div>
  );
}
