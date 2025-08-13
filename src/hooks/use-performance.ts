/**
 * Performance Monitoring Hooks - Malaysian E-commerce Platform
 * Hooks for tracking component performance, page load times, and user metrics
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Performance metrics types
export interface PerformanceMetrics {
  componentName?: string;
  renderTime: number;
  mountTime: number;
  updateCount: number;
  errorCount: number;
  lastRenderTimestamp: number;
}

export interface PageLoadMetrics {
  pageLoadTime: number;
  domContentLoadedTime: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

export interface UserInteractionMetrics {
  clickCount: number;
  scrollDepth: number;
  timeOnPage: number;
  bounceRate?: number;
}

// Hook for monitoring component render performance
export function useRenderPerformance(
  componentName?: string
): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    componentName,
    renderTime: 0,
    mountTime: 0,
    updateCount: 0,
    errorCount: 0,
    lastRenderTimestamp: Date.now(),
  });

  const mountTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);

  // Track mount time
  useEffect(() => {
    mountTimeRef.current = Date.now();
    setMetrics(prev => ({
      ...prev,
      mountTime: Date.now() - mountTimeRef.current,
    }));
  }, []);

  // Track render performance
  useEffect(() => {
    const renderEnd = Date.now();
    const renderTime = renderEnd - renderStartRef.current;
    updateCountRef.current += 1;

    setMetrics(prev => ({
      ...prev,
      renderTime,
      updateCount: updateCountRef.current,
      lastRenderTimestamp: renderEnd,
    }));

    // Log performance warnings
    if (renderTime > 16) {
      // Over 16ms might cause frame drops
      console.warn(`Slow render detected in ${componentName || 'Component'}:`, {
        renderTime,
        updateCount: updateCountRef.current,
      });
    }
  });

  // Set render start time before each render
  renderStartRef.current = Date.now();

  // Function to report errors
  const reportError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1,
    }));
  }, []);

  // Enhanced metrics with error reporting
  return {
    ...metrics,
    reportError,
  } as PerformanceMetrics & { reportError: () => void };
}

// Hook for monitoring page load performance
export function usePageLoadPerformance(): PageLoadMetrics & {
  isLoading: boolean;
} {
  const [metrics, setMetrics] = useState<PageLoadMetrics>({
    pageLoadTime: 0,
    domContentLoadedTime: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const measurePageLoad = () => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          const pageLoadTime =
            navigation.loadEventEnd - navigation.navigationStart;
          const domContentLoadedTime =
            navigation.domContentLoadedEventEnd - navigation.navigationStart;

          setMetrics(prev => ({
            ...prev,
            pageLoadTime,
            domContentLoadedTime,
          }));
        }

        // Get Web Vitals if available
        if ('web-vitals' in window || window.PerformanceObserver) {
          // First Contentful Paint
          const fcpObserver = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                setMetrics(prev => ({
                  ...prev,
                  firstContentfulPaint: entry.startTime,
                }));
              }
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });

          // Largest Contentful Paint
          const lcpObserver = new PerformanceObserver(list => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            setMetrics(prev => ({
              ...prev,
              largestContentfulPaint: lastEntry.startTime,
            }));
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // Cumulative Layout Shift
          const clsObserver = new PerformanceObserver(list => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
            setMetrics(prev => ({
              ...prev,
              cumulativeLayoutShift: clsValue,
            }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error measuring page load performance:', error);
        setIsLoading(false);
      }
    };

    // Wait for page to fully load
    if (document.readyState === 'complete') {
      measurePageLoad();
    } else {
      window.addEventListener('load', measurePageLoad);
      return () => window.removeEventListener('load', measurePageLoad);
    }
  }, []);

  return { ...metrics, isLoading };
}

// Hook for monitoring user interaction metrics
export function useUserInteractionMetrics(): UserInteractionMetrics & {
  trackClick: () => void;
  trackScroll: () => void;
  reset: () => void;
} {
  const [metrics, setMetrics] = useState<UserInteractionMetrics>({
    clickCount: 0,
    scrollDepth: 0,
    timeOnPage: 0,
  });

  const startTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);

  // Track time on page
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        timeOnPage: Date.now() - startTimeRef.current,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollDepth = Math.round(
        (scrollTop / (documentHeight - windowHeight)) * 100
      );

      if (scrollDepth > maxScrollRef.current) {
        maxScrollRef.current = scrollDepth;
        setMetrics(prev => ({
          ...prev,
          scrollDepth: Math.min(scrollDepth, 100),
        }));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const trackClick = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      clickCount: prev.clickCount + 1,
    }));
  }, []);

  const trackScroll = useCallback(() => {
    // Manual scroll tracking if needed
  }, []);

  const reset = useCallback(() => {
    startTimeRef.current = Date.now();
    maxScrollRef.current = 0;
    setMetrics({
      clickCount: 0,
      scrollDepth: 0,
      timeOnPage: 0,
    });
  }, []);

  return {
    ...metrics,
    trackClick,
    trackScroll,
    reset,
  };
}

// Hook for monitoring API performance
export function useAPIPerformance() {
  const [apiMetrics, setApiMetrics] = useState<{
    requests: Array<{
      url: string;
      method: string;
      duration: number;
      status: number;
      timestamp: number;
    }>;
    averageResponseTime: number;
    errorRate: number;
  }>({
    requests: [],
    averageResponseTime: 0,
    errorRate: 0,
  });

  const trackAPICall = useCallback(
    (url: string, method: string, duration: number, status: number) => {
      const timestamp = Date.now();

      setApiMetrics(prev => {
        const newRequests = [
          ...prev.requests,
          { url, method, duration, status, timestamp },
        ];

        // Keep only last 100 requests
        if (newRequests.length > 100) {
          newRequests.shift();
        }

        const totalDuration = newRequests.reduce(
          (sum, req) => sum + req.duration,
          0
        );
        const averageResponseTime = totalDuration / newRequests.length;

        const errorCount = newRequests.filter(req => req.status >= 400).length;
        const errorRate = (errorCount / newRequests.length) * 100;

        return {
          requests: newRequests,
          averageResponseTime,
          errorRate,
        };
      });
    },
    []
  );

  return {
    ...apiMetrics,
    trackAPICall,
  };
}

// Hook for memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryMetrics, setMemoryMetrics] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    memoryUsagePercentage: number;
  }>({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    memoryUsagePercentage: 0,
  });

  useEffect(() => {
    const measureMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsagePercentage =
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        setMemoryMetrics({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          memoryUsagePercentage,
        });

        // Warn if memory usage is high
        if (memoryUsagePercentage > 90) {
          console.warn('High memory usage detected:', {
            usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            limitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
            percentage: memoryUsagePercentage.toFixed(2),
          });
        }
      }
    };

    measureMemory();
    const interval = setInterval(measureMemory, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryMetrics;
}

// Comprehensive performance monitoring hook
export function usePerformanceMonitoring(componentName?: string) {
  const renderMetrics = useRenderPerformance(componentName);
  const pageLoadMetrics = usePageLoadPerformance();
  const userMetrics = useUserInteractionMetrics();
  const apiMetrics = useAPIPerformance();
  const memoryMetrics = useMemoryMonitoring();

  // Function to get a complete performance report
  const getPerformanceReport = useCallback(() => {
    return {
      component: renderMetrics,
      pageLoad: pageLoadMetrics,
      userInteraction: userMetrics,
      api: apiMetrics,
      memory: memoryMetrics,
      timestamp: Date.now(),
    };
  }, [renderMetrics, pageLoadMetrics, userMetrics, apiMetrics, memoryMetrics]);

  // Function to send performance data to analytics
  const sendPerformanceData = useCallback(async () => {
    const report = getPerformanceReport();

    try {
      // Send to analytics service
      // Example: analytics.track('performance_metrics', report);
      console.log('Performance Report:', report);

      // In production, send to actual analytics service
      if (process.env.NODE_ENV === 'production') {
        // await fetch('/api/analytics/performance', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(report)
        // });
      }
    } catch (error) {
      console.error('Failed to send performance data:', error);
    }
  }, [getPerformanceReport]);

  return {
    renderMetrics,
    pageLoadMetrics,
    userMetrics,
    apiMetrics,
    memoryMetrics,
    getPerformanceReport,
    sendPerformanceData,
  };
}
