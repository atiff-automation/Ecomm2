/**
 * Centralized API Client Service - Malaysian E-commerce Platform
 * Single source of truth for ALL API operations with comprehensive error handling
 *
 * This service consolidates all API calls that were previously
 * scattered across 50+ components into one maintainable location.
 */

import {
  APIResponse,
  APIError,
  APIErrorCode,
  APIRequestConfig,
  APIClientConfig,
  CacheManager,
  CacheItem,
  APIMetrics,
  APIEvent,
  APIEventPayload,
  APIEventListener,
} from '@/lib/types/api';

export class APIClient {
  private static instance: APIClient;
  private config: APIClientConfig;
  private cache: CacheManager;
  private metrics: APIMetrics;
  private eventListeners: Map<APIEvent, Set<APIEventListener>>;

  private constructor() {
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_API_URL || '',
      timeout: 30000, // 30 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
      enableCache: true,
      defaultCacheTTL: 5 * 60 * 1000, // 5 minutes
      enableLogging: process.env.NODE_ENV === 'development',
      enableMetrics: true,
    };

    this.cache = this.createCacheManager();
    this.metrics = this.initializeMetrics();
    this.eventListeners = new Map();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  /**
   * Main request method with comprehensive error handling
   */
  async request<T>(
    endpoint: string,
    config: APIRequestConfig = {}
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();
    const method = config.method || 'GET';
    const url = `${this.config.baseURL}${endpoint}`;

    this.emitEvent('REQUEST_START', { url, method });

    // Check cache for GET requests
    if (method === 'GET' && config.cache !== false && this.config.enableCache) {
      const cacheKey = this.generateCacheKey(url, config);
      const cachedData = this.cache.get<APIResponse<T>>(cacheKey);

      if (cachedData) {
        this.emitEvent('CACHE_HIT', { url, method, cacheKey });
        this.metrics.totalRequests++;
        return cachedData;
      }

      this.emitEvent('CACHE_MISS', { url, method, cacheKey });
    }

    let lastError: APIError | null = null;
    const maxRetries = config.retries ?? this.config.retries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.emitEvent('RETRY_ATTEMPT', { url, method, retryCount: attempt });
          await this.delay(
            config.retryDelay ?? this.config.retryDelay * attempt
          );
        }

        const response = await this.executeRequest<T>(url, config);
        const duration = Date.now() - startTime;

        // Cache successful GET responses
        if (
          method === 'GET' &&
          config.cache !== false &&
          this.config.enableCache
        ) {
          const cacheKey = this.generateCacheKey(url, config);
          const cacheTTL = config.cacheTTL ?? this.config.defaultCacheTTL;
          this.cache.set(cacheKey, response, cacheTTL);
        }

        this.updateMetrics(true, duration, url);
        this.emitEvent('REQUEST_SUCCESS', { url, method, duration });

        return response;
      } catch (error) {
        lastError = this.normalizeError(error, url, method);

        if (!this.shouldRetry(lastError, attempt, maxRetries)) {
          break;
        }
      }
    }

    // Request failed after all retries
    const duration = Date.now() - startTime;
    this.updateMetrics(false, duration, url, lastError!.code as APIErrorCode);
    this.emitEvent('REQUEST_ERROR', {
      url,
      method,
      duration,
      error: lastError!,
    });

    throw lastError;
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(
    url: string,
    config: APIRequestConfig
  ): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeout = config.timeout ?? this.config.timeout;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // CSRF TOKEN INJECTION - Auto-inject CSRF token for mutation requests
      const csrfHeaders = await this.getCsrfHeaders(config.method || 'GET');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...csrfHeaders, // Include CSRF token if needed
        ...config.headers, // Allow override if needed
      };

      const fetchConfig: RequestInit = {
        method: config.method || 'GET',
        headers,
        signal: controller.signal,
      };

      if (config.body && config.method !== 'GET') {
        fetchConfig.body =
          typeof config.body === 'string'
            ? config.body
            : JSON.stringify(config.body);
      }

      // Resolve URL for server-side execution
      const resolvedUrl = APIClient.resolveUrl(url);
      const response = await fetch(resolvedUrl, fetchConfig);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.createHTTPError(response, url, config.method || 'GET');
      }

      const data = await response.json();

      // Ensure response follows our API format
      return this.normalizeResponse<T>(data);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Normalize response to our standard format
   */
  private normalizeResponse<T>(data: any): APIResponse<T> {
    // If already in our format, return as is
    if (data && typeof data.success === 'boolean') {
      return {
        timestamp: new Date().toISOString(),
        ...data,
      };
    }

    // Transform legacy API responses
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create standardized HTTP error
   */
  private async createHTTPError(
    response: Response,
    url: string,
    method: string
  ): Promise<APIError> {
    let errorData: any = {};

    try {
      errorData = await response.json();
    } catch {
      // Response is not JSON
    }

    const code = this.mapHTTPStatusToErrorCode(response.status);

    return {
      code,
      message:
        errorData.message ||
        errorData.error ||
        response.statusText ||
        'Request failed',
      details: errorData,
      timestamp: new Date().toISOString(),
      path: url,
      method,
    };
  }

  /**
   * Map HTTP status codes to our error codes
   */
  private mapHTTPStatusToErrorCode(status: number): APIErrorCode {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'AUTHENTICATION_ERROR';
      case 403:
        return 'AUTHORIZATION_ERROR';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Normalize various error types to our standard format
   */
  private normalizeError(error: any, url: string, method: string): APIError {
    if (error.name === 'AbortError') {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Request timed out',
        timestamp: new Date().toISOString(),
        path: url,
        method,
      };
    }

    if (error.code && error.message) {
      return error as APIError;
    }

    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network error occurred',
      details: error,
      timestamp: new Date().toISOString(),
      path: url,
      method,
    };
  }

  /**
   * Resolve URL for server-side and client-side execution
   */
  private static resolveUrl(url: string): string {
    // If URL is already absolute, return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // For server-side execution (no window object), convert relative URLs to absolute
    if (typeof window === 'undefined') {
      // In server-side context, construct absolute URL
      const protocol =
        process.env.NODE_ENV === 'production' ? 'https:' : 'http:';
      const host = process.env.VERCEL_URL
        ? `${protocol}//${process.env.VERCEL_URL}`
        : `${protocol}//localhost:${process.env.PORT || 3000}`;

      return `${host}${url}`;
    }

    // For client-side execution, relative URLs work fine
    return url;
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(
    error: APIError,
    attempt: number,
    maxRetries: number
  ): boolean {
    if (attempt >= maxRetries) {
      return false;
    }

    // Don't retry client errors (4xx)
    const retryableErrors: APIErrorCode[] = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR',
      'RATE_LIMIT_EXCEEDED',
    ];

    return retryableErrors.includes(error.code as APIErrorCode);
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * CENTRALIZED CSRF token injection - DRY PRINCIPLE
   * Auto-inject CSRF tokens for mutation requests (POST, PUT, PATCH, DELETE)
   */
  private async getCsrfHeaders(method: string): Promise<Record<string, string>> {
    // Only inject CSRF token for mutation requests - SYSTEMATIC SECURITY
    const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!mutationMethods.includes(method.toUpperCase())) {
      return {};
    }

    try {
      // Dynamically import to avoid circular dependencies and support both client/server
      if (typeof window !== 'undefined') {
        // Client-side: Use the CSRF token manager
        const { csrfTokenManager } = await import('@/hooks/use-csrf-token');

        // Initialize if not already initialized
        if (!csrfTokenManager.getToken()) {
          await csrfTokenManager.initialize();
        }

        const token = csrfTokenManager.getToken();
        const headerName = csrfTokenManager.getHeaderName();

        if (token) {
          return { [headerName]: token };
        }
      }

      // If no token available, return empty headers
      // The server will reject the request with 403, which is expected behavior
      return {};
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      // Don't throw - let the request proceed and server will reject if needed
      return {};
    }
  }

  /**
   * Generate cache key for requests
   */
  private generateCacheKey(url: string, config: APIRequestConfig): string {
    const key =
      config.cacheKey || `${url}:${JSON.stringify(config.body || {})}`;
    return btoa(key); // Base64 encode for safe cache keys
  }

  /**
   * Create cache manager
   */
  private createCacheManager(): CacheManager {
    const cache = new Map<string, CacheItem<any>>();

    return {
      get<T>(key: string): T | null {
        const item = cache.get(key);
        if (!item) {
          return null;
        }

        if (Date.now() > item.timestamp + item.ttl) {
          cache.delete(key);
          return null;
        }

        return item.data;
      },

      set<T>(
        key: string,
        data: T,
        ttl: number = this.config.defaultCacheTTL
      ): void {
        cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl,
          key,
        });
      },

      delete(key: string): void {
        cache.delete(key);
      },

      clear(): void {
        cache.clear();
      },

      has(key: string): boolean {
        return cache.has(key);
      },

      size(): number {
        return cache.size;
      },
    };
  }

  /**
   * Initialize metrics tracking
   */
  private initializeMetrics(): APIMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorsByCode: {} as Record<APIErrorCode, number>,
      requestsByEndpoint: {},
    };
  }

  /**
   * Update metrics
   */
  private updateMetrics(
    success: boolean,
    duration: number,
    url: string,
    errorCode?: APIErrorCode
  ): void {
    if (!this.config.enableMetrics) {
      return;
    }

    this.metrics.totalRequests++;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      if (errorCode) {
        this.metrics.errorsByCode[errorCode] =
          (this.metrics.errorsByCode[errorCode] || 0) + 1;
      }
    }

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) +
        duration) /
      this.metrics.totalRequests;

    // Track requests by endpoint
    try {
      // Handle both relative and absolute URLs
      const endpoint = url.startsWith('http')
        ? new URL(url).pathname
        : url.split('?')[0]; // For relative URLs, just get the path part before query params

      this.metrics.requestsByEndpoint[endpoint] =
        (this.metrics.requestsByEndpoint[endpoint] || 0) + 1;
    } catch (error) {
      // Fallback: use the URL as-is if URL parsing fails
      this.metrics.requestsByEndpoint[url] =
        (this.metrics.requestsByEndpoint[url] || 0) + 1;
    }
  }

  /**
   * Event management
   */
  private emitEvent(
    event: APIEvent,
    payload: Omit<APIEventPayload, 'event' | 'timestamp'>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const eventPayload: APIEventPayload = {
        ...payload,
        event,
        timestamp: new Date(),
      };
      listeners.forEach(listener => listener(eventPayload));
    }
  }

  /**
   * Public API methods
   */

  // HTTP method shortcuts
  async get<T>(
    endpoint: string,
    config?: Omit<APIRequestConfig, 'method'>
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config?: Omit<APIRequestConfig, 'method' | 'body'>
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config?: Omit<APIRequestConfig, 'method' | 'body'>
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    config?: Omit<APIRequestConfig, 'method' | 'body'>
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data,
    });
  }

  async delete<T>(
    endpoint: string,
    config?: Omit<APIRequestConfig, 'method'>
  ): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Event subscription
  addEventListener(event: APIEvent, listener: APIEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  // Utility methods
  getMetrics(): APIMetrics {
    return { ...this.metrics };
  }

  clearCache(): void {
    this.cache.clear();
  }

  updateConfig(newConfig: Partial<APIClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): APIClientConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const apiClient = APIClient.getInstance();
