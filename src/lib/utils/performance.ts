/**
 * Performance Utilities - Malaysian E-commerce Platform
 * Tools for measuring, optimizing, and monitoring performance
 */

import config from '@/lib/config/app-config';

/**
 * Performance timer for measuring execution time
 */
export class PerformanceTimer {
  private startTime: number;
  private endTime?: number;
  private label: string;

  constructor(label: string = 'Operation') {
    this.label = label;
    this.startTime = performance.now();
  }

  /**
   * Stop the timer and return elapsed time
   */
  stop(): number {
    this.endTime = performance.now();
    const elapsed = this.endTime - this.startTime;

    if (config.development.debug.showPerformance) {
      console.log(`⏱️ ${this.label}: ${elapsed.toFixed(2)}ms`);
    }

    return elapsed;
  }

  /**
   * Get elapsed time without stopping
   */
  getElapsed(): number {
    const now = this.endTime || performance.now();
    return now - this.startTime;
  }
}

/**
 * Measure async function performance
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const timer = new PerformanceTimer(label);

  try {
    const result = await fn();
    const duration = timer.stop();
    return { result, duration };
  } catch (error) {
    timer.stop();
    throw error;
  }
}

/**
 * Measure sync function performance
 */
export function measureSync<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const timer = new PerformanceTimer(label);

  try {
    const result = fn();
    const duration = timer.stop();
    return { result, duration };
  } catch (error) {
    timer.stop();
    throw error;
  }
}

/**
 * Debounce function to limit rapid calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number = config.ui.loading.debounceMs
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function to limit call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Memoize function results to improve performance
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
}

/**
 * LRU Cache implementation for better memory management
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }

    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing key
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Lazy loading utility for expensive operations
 */
export function lazy<T>(factory: () => T): () => T {
  let cached: T;
  let initialized = false;

  return () => {
    if (!initialized) {
      cached = factory();
      initialized = true;
    }
    return cached;
  };
}

/**
 * Batch multiple operations to reduce calls
 */
export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private processor: (items: T[]) => Promise<R[]>;
  private delay: number;
  private maxBatchSize: number;
  private pendingPromises: Array<{
    resolve: (value: R) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(
    processor: (items: T[]) => Promise<R[]>,
    options: {
      delay?: number;
      maxBatchSize?: number;
    } = {}
  ) {
    this.processor = processor;
    this.delay = options.delay || 50;
    this.maxBatchSize = options.maxBatchSize || 10;
  }

  add(item: T): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.batch.push(item);
      this.pendingPromises.push({ resolve, reject });

      if (this.batch.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.delay);
      }
    });
  }

  private async flush(): Promise<void> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.batch.length === 0) {
      return;
    }

    const currentBatch = this.batch.splice(0);
    const currentPromises = this.pendingPromises.splice(0);

    try {
      const results = await this.processor(currentBatch);

      results.forEach((result, index) => {
        currentPromises[index]?.resolve(result);
      });
    } catch (error) {
      currentPromises.forEach(({ reject }) => reject(error));
    }
  }
}

/**
 * Monitor Core Web Vitals
 */
export interface WebVitals {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
}

export function measureWebVitals(): Promise<WebVitals> {
  return new Promise(resolve => {
    const vitals: WebVitals = {};

    // This would be implemented with real web vitals measurement
    // For now, we'll use Performance API
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    if (navigation) {
      vitals.TTFB = navigation.responseStart - navigation.requestStart;
      vitals.FCP = navigation.loadEventEnd - navigation.fetchStart;
    }

    resolve(vitals);
  });
}

/**
 * Resource preloader for better performance
 */
export class ResourcePreloader {
  private static preloadedResources = new Set<string>();

  static preloadImage(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  static preloadFont(fontFamily: string, src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    const font = new FontFace(fontFamily, `url(${src})`);
    return font.load().then(() => {
      document.fonts.add(font);
      this.preloadedResources.add(src);
    });
  }

  static preloadScript(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      script.onerror = reject;
      script.src = src;
      document.head.appendChild(script);
    });
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: Math.round(
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      ),
    };
  }

  return null;
}
