/**
 * Monitoring Circuit Breaker - Malaysian E-commerce Platform
 * Systematic failure protection to prevent cascade failures
 * Following @CLAUDE.md principles: configurable, centralized, systematic
 */

import { getCircuitBreakerConfig } from './monitoring-config';

enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit tripped, blocking calls
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  successCount: number;
}

/**
 * Centralized circuit breaker system
 * Prevents monitoring death spiral through systematic failure protection
 */
export class CircuitBreaker {
  private circuits: Map<string, CircuitBreakerState> = new Map();
  private readonly MAX_CIRCUITS = 100; // Prevent unbounded memory growth

  /**
   * Check if circuit allows calls - Systematic protection
   */
  canProceed(feature: string): boolean {
    const config = getCircuitBreakerConfig(feature);

    if (!config.enabled) {
      return true;
    }

    const circuit = this.getOrCreateCircuit(feature);
    const now = Date.now();

    switch (circuit.state) {
      case CircuitState.CLOSED:
        // Normal operation
        return true;

      case CircuitState.OPEN:
        // Check if enough time has passed to try again
        if (now >= circuit.nextAttemptTime) {
          circuit.state = CircuitState.HALF_OPEN;
          circuit.successCount = 0;
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        // Allow limited testing calls
        return true;

      default:
        return false;
    }
  }

  /**
   * Record successful call - Systematic success tracking
   */
  recordSuccess(feature: string): void {
    const circuit = this.getOrCreateCircuit(feature);

    switch (circuit.state) {
      case CircuitState.HALF_OPEN:
        circuit.successCount++;
        // If enough successes, close circuit
        if (circuit.successCount >= 3) {
          circuit.state = CircuitState.CLOSED;
          circuit.failureCount = 0;
          console.log(`✅ Circuit breaker for ${feature} restored to CLOSED`);
        }
        break;

      case CircuitState.CLOSED:
        // Reset failure count on success
        circuit.failureCount = 0;
        break;
    }
  }

  /**
   * Record failed call - Systematic failure tracking
   */
  recordFailure(feature: string): void {
    const config = getCircuitBreakerConfig(feature);
    const circuit = this.getOrCreateCircuit(feature);
    const now = Date.now();

    circuit.failureCount++;
    circuit.lastFailureTime = now;

    switch (circuit.state) {
      case CircuitState.CLOSED:
        if (circuit.failureCount >= config.maxFailures) {
          circuit.state = CircuitState.OPEN;
          circuit.nextAttemptTime = now + config.resetTimeoutMs;
          console.warn(
            `🚨 Circuit breaker for ${feature} OPENED after ${circuit.failureCount} failures`
          );
        }
        break;

      case CircuitState.HALF_OPEN:
        // Failure during testing - back to open
        circuit.state = CircuitState.OPEN;
        circuit.nextAttemptTime = now + config.resetTimeoutMs;
        console.warn(
          `🚨 Circuit breaker for ${feature} returned to OPEN after test failure`
        );
        break;
    }
  }

  /**
   * Get circuit status - Systematic monitoring
   */
  getStatus(feature: string): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextAttemptIn?: number;
  } {
    const circuit = this.getOrCreateCircuit(feature);
    const now = Date.now();

    const status = {
      state: circuit.state,
      failureCount: circuit.failureCount,
      successCount: circuit.successCount,
    };

    if (circuit.state === CircuitState.OPEN && circuit.nextAttemptTime > now) {
      return {
        ...status,
        nextAttemptIn: circuit.nextAttemptTime - now,
      };
    }

    return status;
  }

  /**
   * Force open circuit - Emergency control
   */
  forceOpen(feature: string): void {
    const config = getCircuitBreakerConfig(feature);
    const circuit = this.getOrCreateCircuit(feature);

    circuit.state = CircuitState.OPEN;
    circuit.nextAttemptTime = Date.now() + config.resetTimeoutMs;

    console.warn(`🚨 Circuit breaker for ${feature} FORCE OPENED`);
  }

  /**
   * Force close circuit - Emergency control
   */
  forceClose(feature: string): void {
    const circuit = this.getOrCreateCircuit(feature);

    circuit.state = CircuitState.CLOSED;
    circuit.failureCount = 0;
    circuit.successCount = 0;

    console.log(`✅ Circuit breaker for ${feature} FORCE CLOSED`);
  }

  /**
   * Reset circuit to initial state - Emergency control
   */
  reset(feature?: string): void {
    if (feature) {
      this.circuits.delete(feature);
      console.log(`🔄 Circuit breaker for ${feature} RESET`);
    } else {
      this.circuits.clear();
      console.log('🔄 All circuit breakers RESET');
    }
  }

  /**
   * Get all circuit states - Monitoring dashboard
   */
  getAllStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [feature] of this.circuits.entries()) {
      status[feature] = this.getStatus(feature);
    }

    return status;
  }

  /**
   * Check if any circuits are open - System health
   */
  hasOpenCircuits(): boolean {
    for (const [, circuit] of this.circuits.entries()) {
      if (circuit.state === CircuitState.OPEN) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get metrics for monitoring - Quality assurance
   */
  getMetrics(): {
    totalCircuits: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
    totalFailures: number;
  } {
    let openCount = 0;
    let halfOpenCount = 0;
    let closedCount = 0;
    let totalFailures = 0;

    for (const [, circuit] of this.circuits.entries()) {
      totalFailures += circuit.failureCount;

      switch (circuit.state) {
        case CircuitState.OPEN:
          openCount++;
          break;
        case CircuitState.HALF_OPEN:
          halfOpenCount++;
          break;
        case CircuitState.CLOSED:
          closedCount++;
          break;
      }
    }

    return {
      totalCircuits: this.circuits.size,
      openCircuits: openCount,
      halfOpenCircuits: halfOpenCount,
      closedCircuits: closedCount,
      totalFailures,
    };
  }

  /**
   * Private: Get or create circuit state
   */
  private getOrCreateCircuit(feature: string): CircuitBreakerState {
    let circuit = this.circuits.get(feature);
    if (!circuit) {
      // Prevent unbounded Map growth (memory leak protection)
      if (this.circuits.size >= this.MAX_CIRCUITS) {
        console.warn(`⚠️ Circuit breaker max circuits reached (${this.MAX_CIRCUITS}), removing oldest`);
        const firstKey = this.circuits.keys().next().value;
        this.circuits.delete(firstKey);
      }

      circuit = {
        state: CircuitState.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        successCount: 0,
      };
      this.circuits.set(feature, circuit);
    }
    return circuit;
  }
}

// Singleton instance - Centralized control
export const circuitBreaker = new CircuitBreaker();

// Export types for systematic usage
export { CircuitState };
export type { CircuitBreakerState };
