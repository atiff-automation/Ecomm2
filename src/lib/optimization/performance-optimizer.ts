/**
 * Performance Optimizer - Malaysian E-commerce Platform
 * Runtime performance optimization utilities
 */

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  static async preloadCriticalImages(imageUrls: string[]): Promise<void> {
    const preloadPromises = imageUrls.map(url => {
      return new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Failed to preload ${url}`));
        document.head.appendChild(link);
      });
    });

    try {
      await Promise.all(preloadPromises);
      console.log('✅ Critical images preloaded successfully');
    } catch (error) {
      console.warn('⚠️ Some images failed to preload:', error);
    }
  }

  static createOptimizedImageUrl(
    originalUrl: string,
    width: number,
    quality: number = 75
  ): string {
    if (originalUrl.startsWith('/')) {
      // Use Next.js image optimization
      return `/_next/image?url=${encodeURIComponent(originalUrl)}&w=${width}&q=${quality}`;
    }
    return originalUrl;
  }

  static async loadImageLazily(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

/**
 * Script loading optimization
 */
export class ScriptOptimizer {
  private static loadedScripts = new Set<string>();

  static async loadScript(
    src: string,
    options: {
      async?: boolean;
      defer?: boolean;
      integrity?: string;
      crossOrigin?: string;
    } = {}
  ): Promise<void> {
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async || false;
      script.defer = options.defer || false;

      if (options.integrity) {
        script.integrity = options.integrity;
      }

      if (options.crossOrigin) {
        script.crossOrigin = options.crossOrigin;
      }

      script.onload = () => {
        this.loadedScripts.add(src);
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });
  }

  static preloadScript(src: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
  }
}

/**
 * CSS optimization utilities
 */
export class CSSOptimizer {
  static async loadCSSLazily(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
      document.head.appendChild(link);
    });
  }

  static preloadCSS(href: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  }

  static inlineCriticalCSS(css: string): void {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}

/**
 * Memory management utilities
 */
export class MemoryOptimizer {
  private static observers = new Map<string, IntersectionObserver>();
  private static timers = new Map<string, NodeJS.Timeout>();

  static createIntersectionObserver(
    id: string,
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    if (this.observers.has(id)) {
      return this.observers.get(id)!;
    }

    const observer = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });

    this.observers.set(id, observer);
    return observer;
  }

  static cleanup(id: string): void {
    // Clean up observers
    const observer = this.observers.get(id);
    if (observer) {
      observer.disconnect();
      this.observers.delete(id);
    }

    // Clean up timers
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  static scheduleCleanup(id: string, delay: number = 30000): void {
    const timer = setTimeout(() => {
      this.cleanup(id);
    }, delay);

    this.timers.set(id, timer);
  }

  static getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } {
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

    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }
}

/**
 * Network optimization utilities
 */
export class NetworkOptimizer {
  static async preconnect(origins: string[]): Promise<void> {
    origins.forEach(origin => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      document.head.appendChild(link);
    });
  }

  static async prefetchRoute(route: string): Promise<void> {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }
  }

  static createServiceWorkerCache(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration);
        })
        .catch(error => {
          console.warn('⚠️ Service Worker registration failed:', error);
        });
    }
  }

  static async measureConnectionSpeed(): Promise<{
    effectiveType: string;
    downlink: number;
    rtt: number;
  }> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }

    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
    };
  }
}

/**
 * Database query optimization
 */
export class QueryOptimizer {
  private static queryCache = new Map<
    string,
    { data: any; timestamp: number }
  >();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.CACHE_TTL
  ): Promise<T> {
    const cached = this.queryCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await queryFn();
    this.queryCache.set(key, { data, timestamp: now });
    return data;
  }

  static clearQueryCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.queryCache.keys()) {
        if (regex.test(key)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  static getQueryCacheStats(): {
    size: number;
    entries: string[];
    memoryUsage: string;
  } {
    const entries = Array.from(this.queryCache.keys());
    const memoryUsage = JSON.stringify(
      Array.from(this.queryCache.values())
    ).length;

    return {
      size: this.queryCache.size,
      entries,
      memoryUsage: `${Math.round(memoryUsage / 1024)} KB`,
    };
  }
}

/**
 * Main performance optimizer class
 */
export class PerformanceOptimizer {
  static async initialize(): Promise<void> {
    console.log('🚀 Initializing performance optimizations...');

    // Preconnect to common domains
    await NetworkOptimizer.preconnect([
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
    ]);

    // Measure connection speed
    const connection = await NetworkOptimizer.measureConnectionSpeed();
    console.log('🌐 Connection info:', connection);

    // Initialize service worker for caching
    NetworkOptimizer.createServiceWorkerCache();

    // Monitor memory usage
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const memory = MemoryOptimizer.getMemoryUsage();
        if (memory.percentage > 80) {
          console.warn('⚠️ High memory usage detected:', memory);
        }
      }, 30000);
    }

    console.log('✅ Performance optimizations initialized');
  }

  static async optimizeForRoute(route: string): Promise<void> {
    // Route-specific optimizations
    if (route.startsWith('/admin')) {
      // Preload admin assets
      await this.preloadAdminAssets();
    } else if (route.startsWith('/products')) {
      // Preload product images
      await this.preloadProductAssets();
    }
  }

  private static async preloadAdminAssets(): Promise<void> {
    // Preload critical admin scripts and styles
    ScriptOptimizer.preloadScript('/admin/dashboard.js');
    CSSOptimizer.preloadCSS('/admin/styles.css');
  }

  private static async preloadProductAssets(): Promise<void> {
    // Preload product-related assets
    const criticalImages = [
      '/images/placeholder-product.jpg',
      '/images/loading-spinner.svg',
    ];
    await ImageOptimizer.preloadCriticalImages(criticalImages);
  }

  static getPerformanceReport(): {
    memoryUsage: any;
    queryCache: any;
    loadedScripts: number;
    observers: number;
    suggestions: string[];
  } {
    const memory = MemoryOptimizer.getMemoryUsage();
    const queryCache = QueryOptimizer.getQueryCacheStats();

    const suggestions: string[] = [];

    if (memory.percentage > 70) {
      suggestions.push(
        'High memory usage detected - consider implementing lazy loading'
      );
    }

    if (queryCache.size > 100) {
      suggestions.push(
        'Large query cache - consider implementing cache cleanup'
      );
    }

    return {
      memoryUsage: memory,
      queryCache,
      loadedScripts: (ScriptOptimizer as any).loadedScripts.size,
      observers: (MemoryOptimizer as any).observers.size,
      suggestions,
    };
  }
}
