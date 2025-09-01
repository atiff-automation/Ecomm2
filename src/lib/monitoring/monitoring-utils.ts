/**
 * Monitoring Utilities - Malaysian E-commerce Platform
 * Helper functions for monitoring and analytics
 * Refactored to use centralized monitoring service - Phase 3 DRY Implementation
 */

import { errorMonitor } from './error-monitor';
import { monitoringService, MonitoringType } from './monitoring-service';
import { isFeatureEnabled } from './monitoring-config';

/**
 * Create performance observer for monitoring
 */
export function createPerformanceObserver(
  callback: (entries: PerformanceEntry[]) => void,
  entryTypes: string[] = ['measure', 'mark']
): PerformanceObserver | null {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return null;
  }

  try {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      callback(entries);
    });

    observer.observe({ entryTypes });
    return observer;
  } catch (error) {
    console.warn('Failed to create performance observer:', error);
    return null;
  }
}

/**
 * Track user action with automatic error handling
 * DRY: Refactored to use centralized monitoring service
 */
export async function trackUserAction(
  action: string,
  properties: Record<string, any> = {}
): Promise<void> {
  try {
    // Early exit if feature disabled
    if (!isFeatureEnabled('userTracking')) {
      return;
    }

    // Add breadcrumb for legacy compatibility
    errorMonitor.addBreadcrumb(`User action: ${action}`, 'user');

    // Use centralized monitoring service - eliminates duplicate API call logic
    await monitoringService.trackUserAction(action, properties);
  } catch (error) {
    console.error('Error tracking user action:', error);
    // Report error through centralized service
    await monitoringService.trackError(
      error instanceof Error ? error : new Error('User action tracking failed'),
      { action, properties }
    );
  }
}

/**
 * Create performance mark
 */
export function mark(name: string): void {
  if (typeof window !== 'undefined' && window.performance?.mark) {
    try {
      window.performance.mark(name);
    } catch (error) {
      console.warn(`Failed to create performance mark: ${name}`, error);
    }
  }
}

/**
 * Create performance measure
 */
export function measure(
  name: string,
  startMark?: string,
  endMark?: string
): number | null {
  if (typeof window === 'undefined' || !window.performance?.measure) {
    return null;
  }

  try {
    window.performance.measure(name, startMark, endMark);

    // Get the duration
    const entries = window.performance.getEntriesByName(name, 'measure');
    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];
      return lastEntry.duration;
    }
  } catch (error) {
    console.warn(`Failed to create performance measure: ${name}`, error);
  }

  return null;
}

/**
 * Track page load performance
 * DRY: Refactored to use centralized monitoring service
 */
export function trackPageLoadPerformance(): void {
  if (typeof window === 'undefined' || !isFeatureEnabled('performance')) {
    return;
  }

  window.addEventListener('load', () => {
    // Wait a bit for everything to settle
    setTimeout(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        const metrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded:
            navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          firstInputDelay: 0,
          cumulativeLayoutShift: 0,
          timeToInteractive:
            navigation.domInteractive - navigation.navigationStart,
        };

        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });

        // Use centralized monitoring service - eliminates duplicate API call logic
        monitoringService.trackPerformance(metrics).catch(error => {
          console.warn('Failed to send performance data:', error);
        });
      }
    }, 0);
  });
}

/**
 * Track Core Web Vitals
 * DRY: Refactored to use centralized monitoring service
 */
export function trackCoreWebVitals(): void {
  if (typeof window === 'undefined' || !isFeatureEnabled('performance')) {
    return;
  }

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      if (lastEntry.startTime > 2500) {
        // Threshold for poor LCP
        errorMonitor.addBreadcrumb(
          `Poor LCP detected: ${lastEntry.startTime}ms`,
          'warn'
        );
      }

      // Use centralized monitoring service - eliminates duplicate API call logic
      monitoringService.track(MonitoringType.PERFORMANCE, {
        type: 'lcp',
        metric: 'lcp',
        value: lastEntry.startTime,
      }).catch(() => {});
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.warn('Failed to observe LCP:', error);
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver(list => {
      const firstEntry = list.getEntries()[0];
      const fid = firstEntry.processingStart - firstEntry.startTime;

      if (fid > 100) {
        // Threshold for poor FID
        errorMonitor.addBreadcrumb(`Poor FID detected: ${fid}ms`, 'warn');
      }

      // Use centralized monitoring service - eliminates duplicate API call logic
      monitoringService.track(MonitoringType.PERFORMANCE, {
        type: 'fid',
        metric: 'fid',
        value: fid,
      }).catch(() => {});
    });

    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.warn('Failed to observe FID:', error);
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;

    const clsObserver = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }

      if (clsValue > 0.1) {
        // Threshold for poor CLS
        errorMonitor.addBreadcrumb(`Poor CLS detected: ${clsValue}`, 'warn');
      }

      // Use centralized monitoring service - eliminates duplicate API call logic
      monitoringService.track(MonitoringType.PERFORMANCE, {
        type: 'cls',
        metric: 'cls',
        value: clsValue,
      }).catch(() => {});
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.warn('Failed to observe CLS:', error);
  }
}

/**
 * Track click events
 */
export function trackClickEvents(): void {
  if (typeof window === 'undefined') {
    return;
  }

  document.addEventListener('click', event => {
    const target = event.target as HTMLElement;

    // Only track meaningful clicks
    if (
      target.matches(
        'button, a, [role="button"], [onclick], input[type="submit"]'
      )
    ) {
      const text = target.textContent?.trim().slice(0, 50) || 'Unknown';
      const id = target.id || target.className || 'unknown';

          trackUserAction('click', {
        element: target.tagName.toLowerCase(),
        text,
        id,
        url: window.location.href,
      });
    }
  });
}

/**
 * Track form submissions
 */
export function trackFormSubmissions(): void {
  if (typeof window === 'undefined') {
    return;
  }

  document.addEventListener('submit', event => {
    const form = event.target as HTMLFormElement;
    const formId = form.id || form.action || 'unknown-form';
    const formData = new FormData(form);
    const fieldCount = Array.from(formData.keys()).length;

    trackUserAction('form_submit', {
      formId,
      fieldCount,
      action: form.action,
      method: form.method,
      url: window.location.href,
    });
  });
}

/**
 * Get or generate session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr';
  }

  let sessionId = sessionStorage.getItem('monitoring_session_id');

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('monitoring_session_id', sessionId);
  }

  return sessionId;
}

/**
 * Get user ID from storage
 */
function getUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const userStr =
      sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || null;
    }
  } catch {
    // Ignore errors
  }

  return null;
}

/**
 * Initialize all monitoring utilities
 */
export function initializeMonitoringUtils(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Track page load performance
  trackPageLoadPerformance();

  // Track Core Web Vitals
  trackCoreWebVitals();

  // Track user interactions
  trackClickEvents();
  trackFormSubmissions();

  // Track page navigation
  window.addEventListener('popstate', () => {
    errorMonitor.addBreadcrumb(
      `Navigation to ${window.location.pathname}`,
      'navigation'
    );
    trackUserAction('navigation', {
      url: window.location.href,
      pathname: window.location.pathname,
    });
  });

  console.log('✅ Monitoring utilities initialized');
}
