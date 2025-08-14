/**
 * Date Utilities - Malaysian E-commerce Platform
 * Consistent date formatting and calculations
 */

import config from '@/lib/config/app-config';

/**
 * Format date for Malaysian locale
 */
export function formatDate(
  date: Date | string,
  options: {
    locale?: string;
    format?: 'short' | 'medium' | 'long' | 'full';
    timeZone?: string;
  } = {}
): string {
  const {
    locale = 'en-MY',
    format = 'medium',
    timeZone = 'Asia/Kuala_Lumpur',
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone,
  };

  switch (format) {
    case 'short':
      formatOptions.dateStyle = 'short';
      break;
    case 'medium':
      formatOptions.dateStyle = 'medium';
      break;
    case 'long':
      formatOptions.dateStyle = 'long';
      break;
    case 'full':
      formatOptions.dateStyle = 'full';
      break;
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  options: {
    locale?: string;
    dateFormat?: 'short' | 'medium' | 'long';
    timeFormat?: 'short' | 'medium' | 'long';
    timeZone?: string;
  } = {}
): string {
  const {
    locale = 'en-MY',
    dateFormat = 'medium',
    timeFormat = 'short',
    timeZone = 'Asia/Kuala_Lumpur',
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: dateFormat,
    timeStyle: timeFormat,
    timeZone,
  }).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string,
  options: {
    locale?: string;
    numeric?: 'always' | 'auto';
  } = {}
): string {
  const {
    locale = 'en-MY',
    numeric = 'auto',
  } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const diffInSeconds = (now.getTime() - dateObj.getTime()) / 1000;
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric });

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(-Math.round(diffInSeconds), 'second');
  } else if (Math.abs(diffInSeconds) < 3600) {
    return rtf.format(-Math.round(diffInSeconds / 60), 'minute');
  } else if (Math.abs(diffInSeconds) < 86400) {
    return rtf.format(-Math.round(diffInSeconds / 3600), 'hour');
  } else if (Math.abs(diffInSeconds) < 2592000) {
    return rtf.format(-Math.round(diffInSeconds / 86400), 'day');
  } else if (Math.abs(diffInSeconds) < 31536000) {
    return rtf.format(-Math.round(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.round(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is within the last N days
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  return diffInDays >= 0 && diffInDays <= days;
}

/**
 * Add days to date
 */
export function addDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setDate(dateObj.getDate() + days);
  return dateObj;
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

/**
 * Check if date is expired
 */
export function isExpired(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getTime() < Date.now();
}

/**
 * Get business hours status
 */
export function getBusinessHoursStatus(
  openTime: string = '09:00',
  closeTime: string = '18:00',
  timeZone: string = 'Asia/Kuala_Lumpur'
): {
  isOpen: boolean;
  nextChange: Date;
  status: 'open' | 'closed' | 'opening_soon' | 'closing_soon';
} {
  const now = new Date();
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
  const today = new Date(now);
  const openToday = new Date(today);
  openToday.setHours(openHour, openMinute, 0, 0);
  
  const closeToday = new Date(today);
  closeToday.setHours(closeHour, closeMinute, 0, 0);
  
  const currentTime = now.getTime();
  const openTime_ts = openToday.getTime();
  const closeTime_ts = closeToday.getTime();
  
  const isOpen = currentTime >= openTime_ts && currentTime < closeTime_ts;
  
  let status: 'open' | 'closed' | 'opening_soon' | 'closing_soon';
  let nextChange: Date;
  
  if (isOpen) {
    const timeUntilClose = closeTime_ts - currentTime;
    status = timeUntilClose < 60 * 60 * 1000 ? 'closing_soon' : 'open'; // 1 hour
    nextChange = closeToday;
  } else {
    if (currentTime < openTime_ts) {
      const timeUntilOpen = openTime_ts - currentTime;
      status = timeUntilOpen < 60 * 60 * 1000 ? 'opening_soon' : 'closed'; // 1 hour
      nextChange = openToday;
    } else {
      // After closing, next opening is tomorrow
      const tomorrow = addDays(today, 1);
      tomorrow.setHours(openHour, openMinute, 0, 0);
      nextChange = tomorrow;
      status = 'closed';
    }
  }
  
  return { isOpen, nextChange, status };
}

/**
 * Parse ISO date string safely
 */
export function parseISODate(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Format duration in human readable format
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}