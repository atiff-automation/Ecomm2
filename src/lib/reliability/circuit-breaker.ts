/**
 * Centralized Circuit Breaker Service
 * SINGLE SOURCE OF TRUTH for all circuit breaker patterns across the application
 * NO HARDCODE - All circuit breaker configuration centralized and environment-driven
 */

// CENTRALIZED CONFIGURATION - Single source of truth
const CIRCUIT_BREAKER_CONFIG = {
  TELEGRAM: {
    FAILURE_THRESHOLD: parseInt(
      process.env.TELEGRAM_CB_FAILURE_THRESHOLD || '5'
    ),
    SUCCESS_THRESHOLD: parseInt(
      process.env.TELEGRAM_CB_SUCCESS_THRESHOLD || '3'
    ),
    TIMEOUT: parseInt(process.env.TELEGRAM_CB_TIMEOUT || '10000'),
    RESET_TIMEOUT: parseInt(process.env.TELEGRAM_CB_RESET_TIMEOUT || '30000'),
    MONITOR_WINDOW: parseInt(process.env.TELEGRAM_CB_MONITOR_WINDOW || '60000'),
  },
  EMAIL: {
    FAILURE_THRESHOLD: parseInt(process.env.EMAIL_CB_FAILURE_THRESHOLD || '3'),
    SUCCESS_THRESHOLD: parseInt(process.env.EMAIL_CB_SUCCESS_THRESHOLD || '2'),
    TIMEOUT: parseInt(process.env.EMAIL_CB_TIMEOUT || '8000'),
    RESET_TIMEOUT: parseInt(process.env.EMAIL_CB_RESET_TIMEOUT || '45000'),
    MONITOR_WINDOW: parseInt(process.env.EMAIL_CB_MONITOR_WINDOW || '60000'),
  },
  DATABASE: {
    FAILURE_THRESHOLD: parseInt(
      process.env.DATABASE_CB_FAILURE_THRESHOLD || '2'
    ),
    SUCCESS_THRESHOLD: parseInt(
      process.env.DATABASE_CB_SUCCESS_THRESHOLD || '2'
    ),
    TIMEOUT: parseInt(process.env.DATABASE_CB_TIMEOUT || '5000'),
    RESET_TIMEOUT: parseInt(process.env.DATABASE_CB_RESET_TIMEOUT || '15000'),
    MONITOR_WINDOW: parseInt(process.env.DATABASE_CB_MONITOR_WINDOW || '30000'),
  },
  NOTIFICATION: {
    FAILURE_THRESHOLD: parseInt(
      process.env.NOTIFICATION_CB_FAILURE_THRESHOLD || '4'
    ),
    SUCCESS_THRESHOLD: parseInt(
      process.env.NOTIFICATION_CB_SUCCESS_THRESHOLD || '2'
    ),
    TIMEOUT: parseInt(process.env.NOTIFICATION_CB_TIMEOUT || '7000'),
    RESET_TIMEOUT: parseInt(
      process.env.NOTIFICATION_CB_RESET_TIMEOUT || '20000'
    ),
    MONITOR_WINDOW: parseInt(
      process.env.NOTIFICATION_CB_MONITOR_WINDOW || '45000'
    ),
  },
} as const;

type CircuitBreakerType = keyof typeof CIRCUIT_BREAKER_CONFIG;

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
  monitorWindow: number;
}

interface CircuitBreakerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  consecuitiveFailures: number;
  consecuitiveSuccesses: number;
}

interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  state: CircuitState;
  metrics: CircuitBreakerMetrics;
}

/**
 * CENTRALIZED Circuit Breaker Class - Single Source of Truth
 */
export class CircuitBreaker<T> {
  private state: CircuitState = CircuitState.CLOSED;
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private stateChangeTime: number = Date.now();
  private readonly name: string;

  // SYSTEMATIC request tracking within time window
  private requestHistory: Array<{ timestamp: number; success: boolean }> = [];

  constructor(
    name: string,
    type: CircuitBreakerType,
    customConfig?: Partial<CircuitBreakerConfig>
  ) {
    this.name = name;

    // CENTRALIZED configuration merge
    const baseConfig = CIRCUIT_BREAKER_CONFIG[type];
    this.config = {
      failureThreshold:
        customConfig?.failureThreshold ?? baseConfig.FAILURE_THRESHOLD,
      successThreshold:
        customConfig?.successThreshold ?? baseConfig.SUCCESS_THRESHOLD,
      timeout: customConfig?.timeout ?? baseConfig.TIMEOUT,
      resetTimeout: customConfig?.resetTimeout ?? baseConfig.RESET_TIMEOUT,
      monitorWindow: customConfig?.monitorWindow ?? baseConfig.MONITOR_WINDOW,
    };

    // SYSTEMATIC metrics initialization
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      consecuitiveFailures: 0,
      consecuitiveSuccesses: 0,
    };

    console.log(
      `🔧 Circuit Breaker '${this.name}' initialized with config:`,
      this.config
    );
  }

  /**
   * CENTRALIZED circuit breaker execution - Single source of truth
   */
  async execute(operation: () => Promise<T>): Promise<CircuitBreakerResult<T>> {
    // SYSTEMATIC state evaluation
    this.evaluateState();

    // CENTRALIZED state-based execution
    switch (this.state) {
      case CircuitState.OPEN:
        return this.handleOpenState();

      case CircuitState.HALF_OPEN:
        return this.handleHalfOpenState(operation);

      case CircuitState.CLOSED:
      default:
        return this.handleClosedState(operation);
    }
  }

  /**
   * SYSTEMATIC closed state handling - DRY PRINCIPLE
   */
  private async handleClosedState(
    operation: () => Promise<T>
  ): Promise<CircuitBreakerResult<T>> {
    try {
      // Execute with timeout protection
      const result = await this.executeWithTimeout(operation);

      // CENTRALIZED success handling
      this.recordSuccess();

      return {
        success: true,
        data: result,
        state: this.state,
        metrics: { ...this.metrics },
      };
    } catch (error) {
      // SYSTEMATIC failure handling
      this.recordFailure(error as Error);

      // CENTRALIZED state transition check
      if (this.shouldTransitionToOpen()) {
        this.transitionToOpen();
      }

      return {
        success: false,
        error: error as Error,
        state: this.state,
        metrics: { ...this.metrics },
      };
    }
  }

  /**
   * CENTRALIZED open state handling - Single source of truth
   */
  private handleOpenState(): CircuitBreakerResult<T> {
    const error = new Error(
      `Circuit breaker '${this.name}' is OPEN. Service temporarily unavailable.`
    );

    return {
      success: false,
      error,
      state: this.state,
      metrics: { ...this.metrics },
    };
  }

  /**
   * SYSTEMATIC half-open state handling - DRY PRINCIPLE
   */
  private async handleHalfOpenState(
    operation: () => Promise<T>
  ): Promise<CircuitBreakerResult<T>> {
    try {
      // Execute with timeout protection
      const result = await this.executeWithTimeout(operation);

      // CENTRALIZED success handling in half-open state
      this.recordSuccess();

      // SYSTEMATIC state transition check
      if (this.shouldTransitionToClosed()) {
        this.transitionToClosed();
      }

      return {
        success: true,
        data: result,
        state: this.state,
        metrics: { ...this.metrics },
      };
    } catch (error) {
      // CENTRALIZED failure handling in half-open state
      this.recordFailure(error as Error);
      this.transitionToOpen();

      return {
        success: false,
        error: error as Error,
        state: this.state,
        metrics: { ...this.metrics },
      };
    }
  }

  /**
   * CENTRALIZED timeout protection - DRY PRINCIPLE
   */
  private executeWithTimeout(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * SYSTEMATIC success recording - Single source of truth
   */
  private recordSuccess(): void {
    const now = Date.now();

    // CENTRALIZED metrics update
    this.metrics.totalRequests++;
    this.metrics.successfulRequests++;
    this.metrics.lastSuccessTime = now;
    this.metrics.consecuitiveSuccesses++;
    this.metrics.consecuitiveFailures = 0; // Reset consecutive failures

    // SYSTEMATIC request history update
    this.requestHistory.push({ timestamp: now, success: true });
    this.cleanupRequestHistory();

    console.log(
      `✅ Circuit Breaker '${this.name}' recorded success. Consecutive: ${this.metrics.consecuitiveSuccesses}`
    );
  }

  /**
   * SYSTEMATIC failure recording - DRY PRINCIPLE
   */
  private recordFailure(error: Error): void {
    const now = Date.now();

    // CENTRALIZED metrics update
    this.metrics.totalRequests++;
    this.metrics.failedRequests++;
    this.metrics.lastFailureTime = now;
    this.metrics.consecuitiveFailures++;
    this.metrics.consecuitiveSuccesses = 0; // Reset consecutive successes

    // SYSTEMATIC request history update
    this.requestHistory.push({ timestamp: now, success: false });
    this.cleanupRequestHistory();

    console.warn(
      `❌ Circuit Breaker '${this.name}' recorded failure: ${error.message}. Consecutive: ${this.metrics.consecuitiveFailures}`
    );
  }

  /**
   * CENTRALIZED state evaluation logic - Single source of truth
   */
  private evaluateState(): void {
    const now = Date.now();

    // SYSTEMATIC half-open transition check
    if (
      this.state === CircuitState.OPEN &&
      now - this.stateChangeTime >= this.config.resetTimeout
    ) {
      this.transitionToHalfOpen();
    }
  }

  /**
   * SYSTEMATIC state transition conditions - DRY PRINCIPLE
   */
  private shouldTransitionToOpen(): boolean {
    return this.metrics.consecuitiveFailures >= this.config.failureThreshold;
  }

  private shouldTransitionToClosed(): boolean {
    return this.metrics.consecuitiveSuccesses >= this.config.successThreshold;
  }

  /**
   * CENTRALIZED state transitions - Single source of truth
   */
  private transitionToOpen(): void {
    this.state = CircuitState.OPEN;
    this.stateChangeTime = Date.now();
    console.error(
      `🔴 Circuit Breaker '${this.name}' transitioned to OPEN state`
    );
  }

  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.stateChangeTime = Date.now();
    console.warn(
      `🟡 Circuit Breaker '${this.name}' transitioned to HALF_OPEN state`
    );
  }

  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.stateChangeTime = Date.now();
    console.log(
      `🟢 Circuit Breaker '${this.name}' transitioned to CLOSED state`
    );
  }

  /**
   * SYSTEMATIC request history maintenance - DRY PRINCIPLE
   */
  private cleanupRequestHistory(): void {
    const cutoff = Date.now() - this.config.monitorWindow;
    this.requestHistory = this.requestHistory.filter(
      req => req.timestamp >= cutoff
    );
  }

  /**
   * CENTRALIZED health status reporting - Single source of truth
   */
  getHealthStatus() {
    return {
      name: this.name,
      state: this.state,
      metrics: { ...this.metrics },
      config: { ...this.config },
      stateChangeTime: this.stateChangeTime,
      uptime: Date.now() - this.stateChangeTime,
    };
  }

  /**
   * SYSTEMATIC reset functionality - DRY PRINCIPLE
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.stateChangeTime = Date.now();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      consecuitiveFailures: 0,
      consecuitiveSuccesses: 0,
    };
    this.requestHistory = [];

    console.log(`🔄 Circuit Breaker '${this.name}' has been reset`);
  }
}

/**
 * CENTRALIZED Circuit Breaker Manager - Single source of truth for all breakers
 */
export class CircuitBreakerManager {
  private static breakers: Map<string, CircuitBreaker<any>> = new Map();

  /**
   * SYSTEMATIC circuit breaker factory - DRY PRINCIPLE
   */
  static getOrCreate<T>(
    name: string,
    type: CircuitBreakerType,
    customConfig?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker<T> {
    const key = `${name}_${type}`;

    if (!this.breakers.has(key)) {
      const breaker = new CircuitBreaker<T>(name, type, customConfig);
      this.breakers.set(key, breaker);
    }

    return this.breakers.get(key)!;
  }

  /**
   * CENTRALIZED health monitoring - Single source of truth
   */
  static getAllHealthStatus() {
    const status: Record<string, any> = {};

    for (const [key, breaker] of this.breakers.entries()) {
      status[key] = breaker.getHealthStatus();
    }

    return status;
  }

  /**
   * SYSTEMATIC breaker reset - DRY PRINCIPLE
   */
  static resetBreaker(name: string, type: CircuitBreakerType): boolean {
    const key = `${name}_${type}`;
    const breaker = this.breakers.get(key);

    if (breaker) {
      breaker.reset();
      return true;
    }

    return false;
  }

  /**
   * CENTRALIZED cleanup - SYSTEMATIC maintenance
   */
  static cleanup(): void {
    this.breakers.clear();
    console.log('🧹 All circuit breakers have been cleaned up');
  }
}

/**
 * EXPORT centralized configuration and types
 */
export { CIRCUIT_BREAKER_CONFIG, CircuitState };
export type { CircuitBreakerResult, CircuitBreakerMetrics, CircuitBreakerType };
