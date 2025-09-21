/**
 * Time and Date Utilities
 * Centralized time calculations following DRY principles
 * @CLAUDE.md - Systematic approach with consistent time handling
 */

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
  key: string;
}

export interface DateBoundaries {
  start: Date;
  end: Date;
  previous?: {
    start: Date;
    end: Date;
  };
}

/**
 * Centralized time utilities for consistent date/time operations
 * Following performance-utils pattern for reusability
 */
export class TimeUtils {
  /**
   * Standard time range configurations - centralized definitions
   * @CLAUDE.md - No hardcoded values, single source of truth
   */
  static readonly TIME_RANGES = {
    '1h': { hours: 1, label: 'Last Hour', unit: 'hour' },
    '24h': { hours: 24, label: 'Last 24 Hours', unit: 'hour' },
    '7d': { days: 7, label: 'Last 7 Days', unit: 'day' },
    '30d': { days: 30, label: 'Last 30 Days', unit: 'day' },
    '90d': { days: 90, label: 'Last 90 Days', unit: 'week' },
    'all': { days: 365 * 10, label: 'All Time', unit: 'month' }, // 10 years as "all"
  } as const;

  /**
   * Get time range boundaries for analytics and filtering
   * Centralized time range calculation
   */
  static getTimeRangeBoundaries(
    timeRange: string, 
    referenceDate: Date = new Date()
  ): DateBoundaries {
    const config = this.TIME_RANGES[timeRange as keyof typeof this.TIME_RANGES];
    
    if (!config) {
      throw new Error(`Invalid time range: ${timeRange}`);
    }

    const end = new Date(referenceDate);
    const start = new Date(referenceDate);

    // Calculate start date based on configuration
    if ('hours' in config) {
      start.setHours(start.getHours() - config.hours);
    } else if ('days' in config) {
      start.setDate(start.getDate() - config.days);
    }

    // Calculate previous period for comparison
    const previousEnd = new Date(start);
    const previousStart = new Date(start);
    
    if ('hours' in config) {
      previousStart.setHours(previousStart.getHours() - config.hours);
    } else if ('days' in config) {
      previousStart.setDate(previousStart.getDate() - config.days);
    }

    return {
      start,
      end,
      previous: timeRange !== 'all' ? {
        start: previousStart,
        end: previousEnd,
      } : undefined,
    };
  }

  /**
   * Get available time ranges for UI selection
   * Centralized time range options
   */
  static getAvailableTimeRanges(): TimeRange[] {
    const now = new Date();
    
    return Object.entries(this.TIME_RANGES).map(([key, config]) => {
      const boundaries = this.getTimeRangeBoundaries(key, now);
      
      return {
        start: boundaries.start,
        end: boundaries.end,
        label: config.label,
        key,
      };
    });
  }

  /**
   * Format duration in seconds to human-readable format
   * Consistent duration formatting across the application
   */
  static formatDuration(seconds: number): string {
    if (seconds < 0) return '0s';
    
    const units = [
      { name: 'd', value: 86400 },
      { name: 'h', value: 3600 },
      { name: 'm', value: 60 },
      { name: 's', value: 1 },
    ];

    const parts: string[] = [];
    let remaining = Math.floor(seconds);

    for (const unit of units) {
      if (remaining >= unit.value || (unit.name === 's' && parts.length === 0)) {
        const count = Math.floor(remaining / unit.value);
        if (count > 0 || unit.name === 's') {
          parts.push(`${count}${unit.name}`);
          remaining %= unit.value;
        }
      }
      
      // Limit to 2 most significant units
      if (parts.length >= 2) break;
    }

    return parts.join(' ') || '0s';
  }

  /**
   * Format timestamp to relative time (e.g., "2 hours ago")
   * Consistent relative time formatting
   */
  static formatRelativeTime(date: Date | string, referenceDate: Date = new Date()): string {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = referenceDate.getTime() - targetDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 0) {
      return 'in the future';
    }

    const intervals = [
      { name: 'year', seconds: 31536000 },
      { name: 'month', seconds: 2592000 },
      { name: 'week', seconds: 604800 },
      { name: 'day', seconds: 86400 },
      { name: 'hour', seconds: 3600 },
      { name: 'minute', seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(diffSeconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.name}${count > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }

  /**
   * Format timestamp for display
   * Consistent timestamp formatting with timezone handling
   */
  static formatTimestamp(
    date: Date | string,
    options: {
      format?: 'short' | 'medium' | 'long' | 'full';
      includeTime?: boolean;
      includeSeconds?: boolean;
      timezone?: string;
    } = {}
  ): string {
    const {
      format = 'medium',
      includeTime = true,
      includeSeconds = false,
      timezone,
    } = options;

    const targetDate = typeof date === 'string' ? new Date(date) : date;

    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
    };

    // Configure date format
    switch (format) {
      case 'short':
        formatOptions.month = 'numeric';
        formatOptions.day = 'numeric';
        formatOptions.year = '2-digit';
        break;
      case 'medium':
        formatOptions.month = 'short';
        formatOptions.day = 'numeric';
        formatOptions.year = 'numeric';
        break;
      case 'long':
        formatOptions.month = 'long';
        formatOptions.day = 'numeric';
        formatOptions.year = 'numeric';
        formatOptions.weekday = 'short';
        break;
      case 'full':
        formatOptions.month = 'long';
        formatOptions.day = 'numeric';
        formatOptions.year = 'numeric';
        formatOptions.weekday = 'long';
        break;
    }

    // Configure time format
    if (includeTime) {
      formatOptions.hour = 'numeric';
      formatOptions.minute = '2-digit';
      formatOptions.hour12 = true;
      
      if (includeSeconds) {
        formatOptions.second = '2-digit';
      }
    }

    return targetDate.toLocaleString('en-US', formatOptions);
  }

  /**
   * Get business hours boundaries
   * Helper for business hours calculations
   */
  static getBusinessHours(
    date: Date = new Date(),
    options: {
      startHour?: number;
      endHour?: number;
      timezone?: string;
    } = {}
  ): { start: Date; end: Date; isBusinessHour: boolean } {
    const { startHour = 9, endHour = 17, timezone } = options;
    
    const start = new Date(date);
    start.setHours(startHour, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(endHour, 0, 0, 0);
    
    const currentHour = date.getHours();
    const isBusinessHour = currentHour >= startHour && currentHour < endHour;

    return { start, end, isBusinessHour };
  }

  /**
   * Calculate time zone offset
   * Helper for timezone-aware calculations
   */
  static getTimezoneOffset(timezone?: string): number {
    if (!timezone) {
      return new Date().getTimezoneOffset();
    }

    try {
      const now = new Date();
      const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
      
      return (utc.getTime() - target.getTime()) / 60000;
    } catch (error) {
      console.warn(`Invalid timezone: ${timezone}, using local timezone`);
      return new Date().getTimezoneOffset();
    }
  }

  /**
   * Generate time series data points
   * Helper for creating chart data with consistent intervals
   */
  static generateTimeSeriesPoints(
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week' | 'month'
  ): Date[] {
    const points: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      points.push(new Date(current));
      
      switch (interval) {
        case 'hour':
          current.setHours(current.getHours() + 1);
          break;
        case 'day':
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          current.setMonth(current.getMonth() + 1);
          break;
      }
    }

    return points;
  }

  /**
   * Round time to nearest interval
   * Helper for consistent time bucketing
   */
  static roundToInterval(
    date: Date,
    interval: 'hour' | 'day' | 'week' | 'month',
    direction: 'floor' | 'ceil' = 'floor'
  ): Date {
    const result = new Date(date);

    switch (interval) {
      case 'hour':
        result.setMinutes(0, 0, 0);
        if (direction === 'ceil' && (date.getMinutes() > 0 || date.getSeconds() > 0)) {
          result.setHours(result.getHours() + 1);
        }
        break;
      case 'day':
        result.setHours(0, 0, 0, 0);
        if (direction === 'ceil' && (date.getHours() > 0 || date.getMinutes() > 0 || date.getSeconds() > 0)) {
          result.setDate(result.getDate() + 1);
        }
        break;
      case 'week':
        // Round to Monday
        const dayOfWeek = result.getDay() || 7; // Convert Sunday (0) to 7
        result.setDate(result.getDate() - dayOfWeek + 1);
        result.setHours(0, 0, 0, 0);
        if (direction === 'ceil' && date > result) {
          result.setDate(result.getDate() + 7);
        }
        break;
      case 'month':
        result.setDate(1);
        result.setHours(0, 0, 0, 0);
        if (direction === 'ceil' && date.getDate() > 1) {
          result.setMonth(result.getMonth() + 1);
        }
        break;
    }

    return result;
  }

  /**
   * Check if date is within range
   * Helper for date range validation
   */
  static isWithinRange(
    date: Date,
    start: Date,
    end: Date,
    inclusive: boolean = true
  ): boolean {
    if (inclusive) {
      return date >= start && date <= end;
    } else {
      return date > start && date < end;
    }
  }

  /**
   * Get date range overlap
   * Helper for calculating overlapping periods
   */
  static getDateRangeOverlap(
    range1: { start: Date; end: Date },
    range2: { start: Date; end: Date }
  ): { start: Date; end: Date; overlapMs: number } | null {
    const start = new Date(Math.max(range1.start.getTime(), range2.start.getTime()));
    const end = new Date(Math.min(range1.end.getTime(), range2.end.getTime()));

    if (start >= end) {
      return null; // No overlap
    }

    return {
      start,
      end,
      overlapMs: end.getTime() - start.getTime(),
    };
  }

  /**
   * Calculate business days between dates
   * Helper for business day calculations
   */
  static getBusinessDaysBetween(
    startDate: Date,
    endDate: Date,
    excludeWeekends: boolean = true
  ): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;

    while (start <= end) {
      const dayOfWeek = start.getDay();
      if (!excludeWeekends || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
        count++;
      }
      start.setDate(start.getDate() + 1);
    }

    return count;
  }

  /**
   * Format time range for display
   * Consistent time range labeling
   */
  static formatTimeRangeLabel(
    start: Date,
    end: Date,
    options: {
      format?: 'short' | 'medium' | 'long';
      showTime?: boolean;
    } = {}
  ): string {
    const { format = 'medium', showTime = false } = options;
    
    const startStr = this.formatTimestamp(start, { 
      format, 
      includeTime: showTime,
      includeSeconds: false 
    });
    
    const endStr = this.formatTimestamp(end, { 
      format, 
      includeTime: showTime,
      includeSeconds: false 
    });

    // If same day, show date once
    if (start.toDateString() === end.toDateString()) {
      if (showTime) {
        const startTime = start.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        const endTime = end.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        return `${startStr.split(',')[0]}, ${startTime} - ${endTime}`;
      } else {
        return startStr;
      }
    }

    return `${startStr} - ${endStr}`;
  }
}