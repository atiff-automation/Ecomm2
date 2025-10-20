/**
 * Centralized Retry Handler with Exponential Backoff
 * SINGLE SOURCE OF TRUTH for all retry logic across the application
 * NO HARDCODE - All retry configurations centralized and environment-driven
 */

// CENTRALIZED CONFIGURATION - Single source of truth
const RETRY_CONFIG = {
  DEFAULT: {
    MAX_ATTEMPTS: parseInt(process.env.RETRY_MAX_ATTEMPTS || '3'),
    BASE_DELAY: parseInt(process.env.RETRY_BASE_DELAY || '1000'),
    MAX_DELAY: parseInt(process.env.RETRY_MAX_DELAY || '30000'),
    JITTER: process.env.RETRY_JITTER !== 'false',
  },
  TELEGRAM: {
    MAX_ATTEMPTS: parseInt(process.env.TELEGRAM_RETRY_MAX_ATTEMPTS || '5'),
    BASE_DELAY: parseInt(process.env.TELEGRAM_RETRY_BASE_DELAY || '2000'),
    MAX_DELAY: parseInt(process.env.TELEGRAM_RETRY_MAX_DELAY || '60000'),
    JITTER: true,
  },
  DATABASE: {
    MAX_ATTEMPTS: parseInt(process.env.DATABASE_RETRY_MAX_ATTEMPTS || '3'),
    BASE_DELAY: parseInt(process.env.DATABASE_RETRY_BASE_DELAY || '500'),
    MAX_DELAY: parseInt(process.env.DATABASE_RETRY_MAX_DELAY || '10000'),
    JITTER: true,
  },
  EMAIL: {
    MAX_ATTEMPTS: parseInt(process.env.EMAIL_RETRY_MAX_ATTEMPTS || '4'),
    BASE_DELAY: parseInt(process.env.EMAIL_RETRY_BASE_DELAY || '1500'),
    MAX_DELAY: parseInt(process.env.EMAIL_RETRY_MAX_DELAY || '20000'),
    JITTER: true,
  },
  NOTIFICATION: {
    MAX_ATTEMPTS: parseInt(process.env.NOTIFICATION_RETRY_MAX_ATTEMPTS || '3'),
    BASE_DELAY: parseInt(process.env.NOTIFICATION_RETRY_BASE_DELAY || '1000'),
    MAX_DELAY: parseInt(process.env.NOTIFICATION_RETRY_MAX_DELAY || '15000'),
    JITTER: true,
  },
} as const;

type RetryConfigType = keyof typeof RETRY_CONFIG;

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  jitter?: boolean;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
  onFinalFailure?: (error: Error, attempts: number) => void;
}

interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

interface RetryableError extends Error {
  retryable?: boolean;
  retryAfter?: number;
}

/**
 * CENTRALIZED Retry Handler Class - Single Source of Truth
 */
export class RetryHandler {
  /**
   * SYSTEMATIC retry with exponential backoff - NO HARDCODE
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    configType: RetryConfigType = 'DEFAULT',
    options: RetryOptions = {}
  ): Promise<T> {
    const config = RETRY_CONFIG[configType];
    const startTime = Date.now();

    const maxAttempts = options.maxAttempts ?? config.MAX_ATTEMPTS;
    const baseDelay = options.baseDelay ?? config.BASE_DELAY;
    const maxDelay = options.maxDelay ?? config.MAX_DELAY;
    const jitter = options.jitter ?? config.JITTER;

    let lastError: Error;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const result = await operation();

        // SYSTEMATIC success logging
        if (attempt > 1) {
          console.log(
            `✅ Operation succeeded on attempt ${attempt}/${maxAttempts} after ${Date.now() - startTime}ms`
          );
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        // CENTRALIZED retry condition check
        if (
          !this.shouldRetry(
            lastError,
            attempt,
            maxAttempts,
            options.retryCondition
          )
        ) {
          break;
        }

        // SYSTEMATIC retry callback
        if (options.onRetry) {
          options.onRetry(attempt, lastError);
        }

        // CENTRALIZED delay calculation with exponential backoff
        const delay = this.calculateDelay(
          attempt,
          baseDelay,
          maxDelay,
          jitter,
          lastError
        );

        console.warn(
          `⚠️ Operation failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms:`,
          lastError.message
        );

        // SYSTEMATIC delay implementation
        await this.sleep(delay);
      }
    }

    // SYSTEMATIC final failure handling
    const totalDuration = Date.now() - startTime;
    console.error(
      `❌ Operation failed after ${maxAttempts} attempts over ${totalDuration}ms:`,
      lastError.message
    );

    if (options.onFinalFailure) {
      options.onFinalFailure(lastError, attempt);
    }

    throw new RetryableError(
      `Operation failed after ${maxAttempts} attempts: ${lastError.message}`,
      { cause: lastError }
    );
  }

  /**
   * CENTRALIZED retry condition logic - Single source of truth
   */
  private static shouldRetry(
    error: Error,
    attempt: number,
    maxAttempts: number,
    customCondition?: (error: Error) => boolean
  ): boolean {
    // Don't retry if max attempts reached
    if (attempt >= maxAttempts) {
      return false;
    }

    // Apply custom retry condition if provided
    if (customCondition) {
      return customCondition(error);
    }

    // SYSTEMATIC default retry conditions
    const retryableError = error as RetryableError;

    // Check if error is explicitly marked as non-retryable
    if (retryableError.retryable === false) {
      return false;
    }

    // CENTRALIZED error type-based retry logic
    const nonRetryablePatterns = [
      /authentication/i,
      /authorization/i,
      /permission/i,
      /forbidden/i,
      /not found/i,
      /validation/i,
      /malformed/i,
      /invalid.*format/i,
    ];

    const errorMessage = error.message.toLowerCase();
    const isNonRetryable = nonRetryablePatterns.some(pattern =>
      pattern.test(errorMessage)
    );

    if (isNonRetryable) {
      return false;
    }

    // SYSTEMATIC retryable conditions
    const retryablePatterns = [
      /timeout/i,
      /connection/i,
      /network/i,
      /rate.?limit/i,
      /too.many.requests/i,
      /service.unavailable/i,
      /internal.server.error/i,
      /temporary/i,
    ];

    const isRetryable = retryablePatterns.some(pattern =>
      pattern.test(errorMessage)
    );

    // Default to retry for unknown errors
    return isRetryable || !isNonRetryable;
  }

  /**
   * SYSTEMATIC delay calculation with exponential backoff - DRY PRINCIPLE
   */
  private static calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    jitter: boolean,
    error?: Error
  ): number {
    const retryableError = error as RetryableError;

    // CENTRALIZED respect for server-specified retry delay
    if (retryableError?.retryAfter) {
      return Math.min(retryableError.retryAfter * 1000, maxDelay);
    }

    // SYSTEMATIC exponential backoff calculation
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);

    // Apply maximum delay cap
    let delay = Math.min(exponentialDelay, maxDelay);

    // CENTRALIZED jitter application
    if (jitter) {
      // Add randomization to prevent thundering herd
      const jitterAmount = delay * 0.1; // 10% jitter
      const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay = Math.max(0, delay + randomJitter);
    }

    return Math.floor(delay);
  }

  /**
   * SYSTEMATIC promise-based sleep - DRY PRINCIPLE
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * CENTRALIZED retry with result tracking - Single source of truth
   */
  static async withRetryResult<T>(
    operation: () => Promise<T>,
    configType: RetryConfigType = 'DEFAULT',
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let attempts = 0;

    try {
      const result = await this.withRetry(operation, configType, {
        ...options,
        onRetry: (attempt, error) => {
          attempts = attempt;
          options.onRetry?.(attempt, error);
        },
      });

      return {
        success: true,
        result,
        attempts: Math.max(1, attempts),
        totalDuration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        attempts: Math.max(1, attempts),
        totalDuration: Date.now() - startTime,
      };
    }
  }

  /**
   * CENTRALIZED batch retry operations - DRY for multiple operations
   */
  static async retryBatch<T>(
    operations: Array<() => Promise<T>>,
    configType: RetryConfigType = 'DEFAULT',
    options: RetryOptions = {}
  ): Promise<Array<RetryResult<T>>> {
    const results = await Promise.allSettled(
      operations.map(operation =>
        this.withRetryResult(operation, configType, options)
      )
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason,
          attempts: 1,
          totalDuration: 0,
        };
      }
    });
  }

  /**
   * SYSTEMATIC circuit breaker integration - CENTRALIZED PATTERN
   */
  static async withCircuitBreaker<T>(
    operation: () => Promise<T>,
    circuitBreaker: any, // CircuitBreaker instance
    configType: RetryConfigType = 'DEFAULT',
    options: RetryOptions = {}
  ): Promise<T> {
    return this.withRetry(
      async () => {
        return await circuitBreaker.fire(operation);
      },
      configType,
      {
        ...options,
        retryCondition: error => {
          // Don't retry if circuit breaker is open
          if (error.message.includes('Circuit breaker is OPEN')) {
            return false;
          }
          return options.retryCondition ? options.retryCondition(error) : true;
        },
      }
    );
  }
}

/**
 * CENTRALIZED retry decorator for class methods - DRY PRINCIPLE
 */
export function withRetry(
  configType: RetryConfigType = 'DEFAULT',
  options: RetryOptions = {}
) {
  return function <T extends any[], R>(
    target: (...args: T) => Promise<R>,
    context: ClassMethodDecoratorContext
  ) {
    return async function (this: any, ...args: T): Promise<R> {
      return RetryHandler.withRetry(
        () => target.apply(this, args),
        configType,
        options
      );
    };
  };
}

/**
 * EXPORT centralized configuration and types
 */
export { RETRY_CONFIG };
export type { RetryOptions, RetryResult, RetryableError, RetryConfigType };
