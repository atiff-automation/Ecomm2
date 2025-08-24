/**
 * Monitoring Utilities - Malaysian E-commerce Platform
 * Helper functions for monitoring and analytics
 */

import { errorMonitor } from './error-monitor';

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
    const observer = new PerformanceObserver((list) => {
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
 */
export async function trackUserAction(
  action: string,
  properties: Record<string, any> = {}
): Promise<void> {
  try {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const eventData = {
      eventId,
      eventType: 'custom' as const,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'ssr',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'ssr',
      sessionId: getSessionId(),
      userId: getUserId(),
      properties: {
        action,
        ...properties,
      },
    };

    // Add breadcrumb
    errorMonitor.addBreadcrumb(`User action: ${action}`, 'user');

    // Send to events API (fire and forget)
    if (typeof window !== 'undefined') {
      fetch('/api/monitoring/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }).catch(error => {
        console.warn('Failed to track user action:', error);
      });
    }

  } catch (error) {
    console.error('Error tracking user action:', error);
    errorMonitor.reportError(
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
 */
export function trackPageLoadPerformance(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    // Wait a bit for everything to settle
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstContentfulPaint: 0,
          largestContentfulPaint: 0,
          firstInputDelay: 0,
          cumulativeLayoutShift: 0,
          timeToInteractive: navigation.domInteractive - navigation.navigationStart,
        };

        // Get paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });

        // Send performance data
        fetch('/api/monitoring/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'page-performance',
            timestamp: new Date().toISOString(),
            url: window.location.href,
            metrics,
          }),
        }).catch(error => {
          console.warn('Failed to send performance data:', error);
        });
      }
    }, 0);
  });
}

/**
 * Track Core Web Vitals
 */
export function trackCoreWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry.startTime > 2500) { // Threshold for poor LCP
        errorMonitor.addBreadcrumb(`Poor LCP detected: ${lastEntry.startTime}ms`, 'warn');
      }

      fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'lcp',
          metric: 'lcp',
          value: lastEntry.startTime,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      }).catch(() => {});
    });
    
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.warn('Failed to observe LCP:', error);
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const firstEntry = list.getEntries()[0];
      const fid = firstEntry.processingStart - firstEntry.startTime;
      
      if (fid > 100) { // Threshold for poor FID
        errorMonitor.addBreadcrumb(`Poor FID detected: ${fid}ms`, 'warn');
      }

      fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'fid',
          metric: 'fid',
          value: fid,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
      }).catch(() => {});
    });
    
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.warn('Failed to observe FID:', error);
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      
      if (clsValue > 0.1) { // Threshold for poor CLS
        errorMonitor.addBreadcrumb(`Poor CLS detected: ${clsValue}`, 'warn');
      }

      fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cls',
          metric: 'cls',
          value: clsValue,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        }),
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
  if (typeof window === 'undefined') return;

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Only track meaningful clicks
    if (target.matches('button, a, [role="button"], [onclick], input[type="submit"]')) {
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
  if (typeof window === 'undefined') return;

  document.addEventListener('submit', (event) => {
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
  if (typeof window === 'undefined') return 'ssr';
  
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
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
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
  if (typeof window === 'undefined') return;

  // Track page load performance
  trackPageLoadPerformance();
  
  // Track Core Web Vitals
  trackCoreWebVitals();
  
  // Track user interactions
  trackClickEvents();
  trackFormSubmissions();
  
  // Track page navigation
  window.addEventListener('popstate', () => {
    errorMonitor.addBreadcrumb(`Navigation to ${window.location.pathname}`, 'navigation');
    trackUserAction('navigation', {
      url: window.location.href,
      pathname: window.location.pathname,
    });
  });

  console.log('✅ Monitoring utilities initialized');
}