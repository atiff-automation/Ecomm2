/**
 * Error Monitoring System - Malaysian E-commerce Platform
 * Comprehensive error tracking and performance monitoring
 */

export interface ErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  retryCount: number;
  environment: string;
  buildId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  breadcrumbs: string[];
  user?: {
    id: string;
    role: string;
    isMember: boolean;
  } | null;
  performance?: {
    loadTime?: number;
    renderTime?: number;
    memory?: number;
  };
  context?: Record<string, any>;
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export interface MonitoringConfig {
  enableErrorReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableUserTracking: boolean;
  sampleRate: number;
  endpoints: {
    errors: string;
    performance: string;
    events: string;
  };
  maxBreadcrumbs: number;
  ignoredErrors: (string | RegExp)[];
}

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private config: MonitoringConfig;
  private breadcrumbs: Array<{ timestamp: string; message: string; level: string }> = [];
  private performanceObserver?: PerformanceObserver;
  private errorCount = 0;
  private lastErrorTime = 0;

  private constructor() {
    this.config = {
      enableErrorReporting: process.env.NODE_ENV === 'production',
      enablePerformanceMonitoring: true,
      enableUserTracking: true,
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      endpoints: {
        errors: '/api/monitoring/errors',
        performance: '/api/monitoring/performance',
        events: '/api/monitoring/events',
      },
      maxBreadcrumbs: 50,
      ignoredErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'ChunkLoadError',
        /^Non-Error promise rejection captured/,
        /Loading chunk \d+ failed/,
        /Script error/,
      ],
    };

    this.initialize();
  }

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
    this.setupUserInteractionTracking();
    this.addBreadcrumb('Monitor initialized', 'info');
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      const error = new Error(event.message);
      error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
      
      this.reportError(error, {
        type: 'javascript-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.reportError(error, {
        type: 'promise-rejection',
        reason: event.reason,
      });
    });

    // Catch React error boundary errors (this is handled by the boundary itself)
    // But we can add additional context here if needed
  }

  private setupPerformanceMonitoring() {
    if (!this.config.enablePerformanceMonitoring) return;

    // Core Web Vitals monitoring
    this.observePerformanceMetrics();

    // Page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.collectPagePerformanceMetrics();
      }, 0);
    });

    // Resource performance
    this.monitorResourcePerformance();
  }

  private observePerformanceMetrics() {
    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.reportPerformanceMetric('lcp', lastEntry.startTime, {
          element: lastEntry.element?.tagName,
          url: lastEntry.url,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const firstEntry = list.getEntries()[0];
        
        this.reportPerformanceMetric('fid', firstEntry.processingStart - firstEntry.startTime, {
          eventType: firstEntry.name,
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        
        if (clsValue > 0) {
          this.reportPerformanceMetric('cls', clsValue);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }
  }

  private collectPagePerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return;

    const metrics: PerformanceMetrics = {
      pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0,
      timeToInteractive: 0,
    };

    // Get paint metrics
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaint = entry.startTime;
      }
    });

    this.reportPerformanceMetrics(metrics);
  }

  private monitorResourcePerformance() {
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const resourceEntry = entry as PerformanceResourceTiming;
        
        // Report slow resources
        if (resourceEntry.duration > 1000) { // > 1 second
          this.reportSlowResource({
            name: resourceEntry.name,
            type: resourceEntry.initiatorType,
            duration: resourceEntry.duration,
            size: resourceEntry.transferSize,
          });
        }
      });
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
  }

  private setupUserInteractionTracking() {
    if (!this.config.enableUserTracking) return;

    // Track page navigation
    window.addEventListener('popstate', () => {
      this.addBreadcrumb(`Navigation to ${window.location.pathname}`, 'navigation');
    });

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      
      // Track clicks on buttons, links, and interactive elements
      if (target.matches('button, a, [role="button"], [onclick]')) {
        const text = target.textContent?.trim().slice(0, 50) || 'Unknown';
        const id = target.id || target.className || 'unknown';
        
        this.addBreadcrumb(`Click: ${text} (${id})`, 'user');
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formId = form.id || form.action || 'unknown-form';
      
      this.addBreadcrumb(`Form submit: ${formId}`, 'user');
    });
  }

  public addBreadcrumb(message: string, level: 'info' | 'warn' | 'error' | 'user' | 'navigation' = 'info') {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      message,
      level,
    });

    // Limit breadcrumb history
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  public reportError(error: Error, context?: Record<string, any>) {
    // Rate limiting
    const now = Date.now();
    if (now - this.lastErrorTime < 1000) { // Max 1 error per second
      return;
    }
    this.lastErrorTime = now;

    // Check if error should be ignored
    if (this.shouldIgnoreError(error)) {
      return;
    }

    // Sampling
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    this.errorCount++;
    
    const errorReport: ErrorReport = {
      errorId: this.generateErrorId(),
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      retryCount: 0,
      environment: process.env.NODE_ENV || 'development',
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
      severity: this.categorizeError(error),
      breadcrumbs: this.breadcrumbs.map(b => b.message),
      user: this.getUserContext(),
      performance: this.getPerformanceContext(),
      context,
    };

    this.addBreadcrumb(`Error: ${error.message}`, 'error');

    // Send to monitoring service
    this.sendErrorReport(errorReport);
  }

  private shouldIgnoreError(error: Error): boolean {
    const message = error.message;
    
    return this.config.ignoredErrors.some(ignored => {
      if (ignored instanceof RegExp) {
        return ignored.test(message);
      }
      return message.includes(ignored);
    });
  }

  private categorizeError(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Critical: Payment, security, data loss
    if (
      stack.includes('payment') ||
      stack.includes('checkout') ||
      stack.includes('auth') ||
      message.includes('security') ||
      message.includes('unauthorized')
    ) {
      return 'critical';
    }

    // High: Network, API, core functionality
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('api') ||
      message.includes('timeout') ||
      stack.includes('cart') ||
      stack.includes('order')
    ) {
      return 'high';
    }

    // Medium: UI, validation, non-critical features
    if (
      message.includes('validation') ||
      message.includes('form') ||
      stack.includes('form') ||
      stack.includes('modal')
    ) {
      return 'medium';
    }

    return 'low';
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserContext() {
    try {
      const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          id: user.id,
          role: user.role,
          isMember: user.isMember,
        };
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  private getPerformanceContext() {
    return {
      memory: (performance as any).memory?.usedJSHeapSize,
      loadTime: performance.now(),
    };
  }

  private reportPerformanceMetric(
    metric: string, 
    value: number, 
    context?: Record<string, any>
  ) {
    if (!this.config.enablePerformanceMonitoring) return;

    this.sendToEndpoint(this.config.endpoints.performance, {
      metric,
      value,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      context,
    });
  }

  private reportPerformanceMetrics(metrics: PerformanceMetrics) {
    if (!this.config.enablePerformanceMonitoring) return;

    this.sendToEndpoint(this.config.endpoints.performance, {
      type: 'page-performance',
      metrics,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  }

  private reportSlowResource(resource: {
    name: string;
    type: string;
    duration: number;
    size?: number;
  }) {
    this.addBreadcrumb(`Slow resource: ${resource.name} (${resource.duration}ms)`, 'warn');
    
    this.sendToEndpoint(this.config.endpoints.performance, {
      type: 'slow-resource',
      resource,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  }

  private async sendErrorReport(errorReport: ErrorReport) {
    if (!this.config.enableErrorReporting) {
      console.warn('Error reporting disabled:', errorReport);
      return;
    }

    try {
      await this.sendToEndpoint(this.config.endpoints.errors, errorReport);
    } catch (error) {
      console.error('Failed to send error report:', error);
    }
  }

  private async sendToEndpoint(endpoint: string, data: any) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(`Failed to send data to ${endpoint}:`, error);
    }
  }

  public getStats() {
    return {
      errorCount: this.errorCount,
      breadcrumbCount: this.breadcrumbs.length,
      lastBreadcrumb: this.breadcrumbs[this.breadcrumbs.length - 1],
      config: this.config,
    };
  }

  public updateConfig(newConfig: Partial<MonitoringConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public clearBreadcrumbs() {
    this.breadcrumbs = [];
  }

  public getBreadcrumbs() {
    return [...this.breadcrumbs];
  }
}

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance();

// Export hook for React components
export function useErrorMonitor() {
  return {
    reportError: (error: Error, context?: Record<string, any>) => {
      errorMonitor.reportError(error, context);
    },
    addBreadcrumb: (message: string, level?: 'info' | 'warn' | 'error' | 'user' | 'navigation') => {
      errorMonitor.addBreadcrumb(message, level);
    },
    getStats: () => errorMonitor.getStats(),
  };
}