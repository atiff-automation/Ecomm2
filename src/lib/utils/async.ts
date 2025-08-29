/**
 * Async Utilities - Malaysian E-commerce Platform
 * Async operations, promises, and concurrency utilities
 */

/**
 * Wait for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async operation with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoffFactor?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoffFactor = 2,
    maxDelay = 30000,
    shouldRetry = () => true,
  } = options;

  let attempt = 1;
  let currentDelay = delay;

  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      await sleep(Math.min(currentDelay, maxDelay));
      currentDelay *= backoffFactor;
      attempt++;
    }
  }

  throw new Error('Retry failed'); // This should never be reached
}

/**
 * Timeout a promise
 */
export function timeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage || `Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

/**
 * Run promises in parallel with concurrency limit
 */
export async function parallel<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 5
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  const executing: Promise<void>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const execute = async () => {
      results[i] = await tasks[i]();
    };

    const promise = execute();
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      const index = executing.findIndex(
        p => (p as any)._resolved || (p as any)._rejected
      );
      if (index !== -1) {
        executing.splice(index, 1);
      }
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Run promises sequentially
 */
export async function sequence<T>(tasks: (() => Promise<T>)[]): Promise<T[]> {
  const results: T[] = [];

  for (const task of tasks) {
    results.push(await task());
  }

  return results;
}

/**
 * All settled with typed results
 */
export async function allSettled<T>(promises: Promise<T>[]): Promise<
  Array<{
    status: 'fulfilled' | 'rejected';
    value?: T;
    reason?: any;
  }>
> {
  return Promise.allSettled(promises).then(results =>
    results.map(result => ({
      status: result.status,
      ...(result.status === 'fulfilled'
        ? { value: result.value }
        : { reason: result.reason }),
    }))
  );
}

/**
 * Race with timeout
 */
export async function raceWithTimeout<T>(
  promises: Promise<T>[],
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    ...promises,
    timeout(new Promise<never>(() => {}), timeoutMs, 'Race timeout'),
  ]);
}

/**
 * Debounced async function
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  let latestResolve: Function;
  let latestReject: Function;

  return ((...args: Parameters<T>) => {
    return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
      clearTimeout(timeoutId);
      latestResolve = resolve;
      latestReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          latestResolve(result);
        } catch (error) {
          latestReject(error);
        }
      }, delay);
    });
  }) as T;
}

/**
 * Throttled async function
 */
export function throttleAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  let lastPromise: Promise<Awaited<ReturnType<T>>> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      lastPromise = fn(...args);
      return lastPromise;
    }

    return lastPromise || Promise.reject(new Error('Throttled'));
  }) as T;
}

/**
 * Cache async function results
 */
export function cacheAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    ttl?: number;
    maxSize?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
  } = {}
): T {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes
    maxSize = 100,
    keyGenerator = (...args) => JSON.stringify(args),
  } = options;

  const cache = new Map<
    string,
    {
      value: Awaited<ReturnType<T>>;
      timestamp: number;
      promise?: Promise<Awaited<ReturnType<T>>>;
    }
  >();

  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    // Return cached value if still valid
    if (cached && Date.now() - cached.timestamp < ttl) {
      return Promise.resolve(cached.value);
    }

    // Return ongoing promise if exists
    if (cached?.promise) {
      return cached.promise;
    }

    // Create new promise
    const promise = fn(...args)
      .then(result => {
        // Clean up old entries if cache is full
        if (cache.size >= maxSize) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey !== undefined) {
            cache.delete(oldestKey);
          }
        }

        cache.set(key, {
          value: result,
          timestamp: Date.now(),
        });

        return result;
      })
      .catch(error => {
        // Remove failed promise from cache
        cache.delete(key);
        throw error;
      });

    // Store promise temporarily
    cache.set(key, {
      value: undefined as any,
      timestamp: Date.now(),
      promise,
    });

    return promise;
  }) as T;
}

/**
 * Circuit breaker for async operations
 */
export class CircuitBreaker<T extends (...args: any[]) => Promise<any>> {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private fn: T,
    private options: {
      failureThreshold?: number;
      timeout?: number;
      resetTimeout?: number;
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      timeout: 10000,
      resetTimeout: 60000,
      ...options,
    };
  }

  async execute(...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout!) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await timeout(this.fn(...args), this.options.timeout!);

      if (this.state === 'half-open') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.options.failureThreshold!) {
      this.state = 'open';
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  getState(): { state: string; failureCount: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
    };
  }
}

/**
 * Queue for sequential async operations
 */
export class AsyncQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }

    this.processing = false;
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

/**
 * Async event emitter
 */
export class AsyncEventEmitter<T extends Record<string, any[]>> {
  private listeners = new Map<
    keyof T,
    Set<(...args: any[]) => Promise<void> | void>
  >();

  on<K extends keyof T>(
    event: K,
    listener: (...args: T[K]) => Promise<void> | void
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off<K extends keyof T>(
    event: K,
    listener: (...args: T[K]) => Promise<void> | void
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  async emit<K extends keyof T>(event: K, ...args: T[K]): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return;
    }

    const promises = Array.from(eventListeners).map(listener =>
      Promise.resolve(listener(...args))
    );

    await Promise.all(promises);
  }

  removeAllListeners<K extends keyof T>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * Create a cancelable promise
 */
export function cancelable<T>(promise: Promise<T>): {
  promise: Promise<T>;
  cancel: () => void;
  isCanceled: () => boolean;
} {
  let canceled = false;

  const cancelablePromise = new Promise<T>((resolve, reject) => {
    promise
      .then(value => {
        if (!canceled) {
          resolve(value);
        }
      })
      .catch(error => {
        if (!canceled) {
          reject(error);
        }
      });
  });

  return {
    promise: cancelablePromise,
    cancel: () => {
      canceled = true;
    },
    isCanceled: () => canceled,
  };
}
