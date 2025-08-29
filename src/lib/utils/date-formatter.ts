/**
 * Date Formatting Utilities
 * Centralized date formatting for tracking system
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

import { TRACKING_CONFIG } from '../config/tracking';

interface FormattedDate {
  full: string;
  short: string;
  time: string;
  relative: string;
  iso: string;
}

/**
 * Format date for Malaysian locale display
 */
export const formatTrackingDate = (dateString: string): FormattedDate => {
  const date = new Date(dateString);
  const locale = TRACKING_CONFIG.LOCALIZATION.DATE_FORMAT;
  const timezone = TRACKING_CONFIG.LOCALIZATION.TIMEZONE;

  return {
    full: date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    }),
    short: date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone,
    }),
    time: date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    }),
    relative: getRelativeTime(date),
    iso: date.toISOString(),
  };
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString(TRACKING_CONFIG.LOCALIZATION.DATE_FORMAT, {
      timeZone: TRACKING_CONFIG.LOCALIZATION.TIMEZONE,
    });
  }
};

/**
 * Check if a date is in the past
 */
export const isDateInPast = (dateString: string): boolean => {
  return new Date(dateString) < new Date();
};

/**
 * Check if a date is today
 */
export const isDateToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();

  return date.toDateString() === today.toDateString();
};

/**
 * Format estimated delivery with relative context
 */
export const formatEstimatedDelivery = (estimatedDelivery?: string): string => {
  if (!estimatedDelivery) {
    return 'Not available';
  }

  const date = new Date(estimatedDelivery);
  const now = new Date();
  const diffInDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays < 0) {
    return 'Overdue';
  } else if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Tomorrow';
  } else if (diffInDays <= 7) {
    return `In ${diffInDays} days`;
  } else {
    return formatTrackingDate(estimatedDelivery).short;
  }
};

/**
 * Sort tracking events by timestamp (newest first)
 */
export const sortTrackingEventsByDate = <T extends { timestamp: string }>(
  events: T[]
): T[] => {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
