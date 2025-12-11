/**
 * Monitoring Throttler - Malaysian E-commerce Platform
 * Systematic rate limiting for monitoring calls
 * Following @CLAUDE.md principles: configurable, centralized, DRY
 */

import { getThrottlingConfig } from './monitoring-config';

interface ThrottleState {
  callCount: number;
  lastReset: number;
  queue: any[];
  isProcessingQueue: boolean;
}

/**
 * Centralized throttling system
 * Prevents monitoring death spiral through systematic rate limiting
 */
export class Throttler {
  private state: Map<string, ThrottleState> = new Map();
  private readonly MAX_FEATURES = 100; // Prevent unbounded memory growth
  private readonly MAX_QUEUE_SIZE = 1000; // Limit queue size per feature

  /**
   * Check if a call can proceed - Systematic rate limiting
   */
  canProceed(feature: string): boolean {
    const config = getThrottlingConfig(feature);
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    let state = this.state.get(feature);
    if (!state) {
      state = {
        callCount: 0,
        lastReset: now,
        queue: [],
        isProcessingQueue: false,
      };
      this.state.set(feature, state);
    }

    // Reset window if expired
    if (now - state.lastReset >= windowMs) {
      state.callCount = 0;
      state.lastReset = now;
    }

    // Check rate limit
    if (state.callCount >= config.maxCallsPerMinute) {
      return false;
    }

    state.callCount++;
    return true;
  }

  /**
   * Add item to batch queue - DRY batching pattern
   */
  addToBatch(feature: string, item: any): void {
    const state = this.getOrCreateState(feature);

    // Prevent queue from growing unbounded (memory leak protection)
    if (state.queue.length >= this.MAX_QUEUE_SIZE) {
      console.warn(`⚠️ Throttler queue for ${feature} at max size, dropping oldest items`);
      state.queue = state.queue.slice(-this.MAX_QUEUE_SIZE + 100); // Keep last 900 items
    }

    state.queue.push({
      ...item,
      timestamp: Date.now(),
    });

    // Process queue if batch size reached or debounce time passed
    this.maybeProcessQueue(feature);
  }

  /**
   * Get current throttle status - Systematic monitoring
   */
  getStatus(feature: string): {
    callCount: number;
    remainingCalls: number;
    queueSize: number;
    nextResetIn: number;
  } {
    const config = getThrottlingConfig(feature);
    const state = this.getOrCreateState(feature);
    const now = Date.now();
    const windowMs = 60 * 1000;

    return {
      callCount: state.callCount,
      remainingCalls: Math.max(0, config.maxCallsPerMinute - state.callCount),
      queueSize: state.queue.length,
      nextResetIn: Math.max(0, windowMs - (now - state.lastReset)),
    };
  }

  /**
   * Force process queue - Manual control
   */
  async processQueue(feature: string): Promise<void> {
    const state = this.getOrCreateState(feature);
    const config = getThrottlingConfig(feature);

    if (state.isProcessingQueue || state.queue.length === 0) {
      return;
    }

    state.isProcessingQueue = true;

    try {
      // Process in batches
      while (state.queue.length > 0) {
        const batch = state.queue.splice(0, config.batchSize);

        if (batch.length > 0) {
          await this.processBatch(feature, batch);
        }

        // Respect rate limits
        if (!this.canProceed(feature)) {
          // Put remaining items back in queue
          state.queue.unshift(...state.queue.splice(0));
          break;
        }
      }
    } finally {
      state.isProcessingQueue = false;
    }
  }

  /**
   * Reset throttle state - Emergency control
   */
  reset(feature?: string): void {
    if (feature) {
      this.state.delete(feature);
    } else {
      this.state.clear();
    }
  }

  /**
   * Get all throttle states - Monitoring dashboard
   */
  getAllStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [feature, state] of this.state.entries()) {
      status[feature] = this.getStatus(feature);
    }

    return status;
  }

  /**
   * Private: Get or create state
   */
  private getOrCreateState(feature: string): ThrottleState {
    let state = this.state.get(feature);
    if (!state) {
      // Prevent unbounded Map growth (memory leak protection)
      if (this.state.size >= this.MAX_FEATURES) {
        console.warn(`⚠️ Throttler max features reached (${this.MAX_FEATURES}), removing oldest`);
        const firstKey = this.state.keys().next().value;
        this.state.delete(firstKey);
      }

      state = {
        callCount: 0,
        lastReset: Date.now(),
        queue: [],
        isProcessingQueue: false,
      };
      this.state.set(feature, state);
    }
    return state;
  }

  /**
   * Private: Maybe process queue based on conditions
   */
  private maybeProcessQueue(feature: string): void {
    const config = getThrottlingConfig(feature);
    const state = this.getOrCreateState(feature);

    // Process if batch size reached
    if (state.queue.length >= config.batchSize) {
      setTimeout(() => this.processQueue(feature), 0);
      return;
    }

    // Process after debounce time
    setTimeout(() => {
      if (state.queue.length > 0) {
        this.processQueue(feature);
      }
    }, config.debounceMs);
  }

  /**
   * Private: Process a batch of items
   */
  private async processBatch(feature: string, batch: any[]): Promise<void> {
    try {
      // This would be implemented by the monitoring service
      console.log(`Processing batch of ${batch.length} items for ${feature}`);

      // In real implementation, this would make API calls
      // await monitoringService.sendBatch(feature, batch);
    } catch (error) {
      console.error(`Failed to process batch for ${feature}:`, error);

      // Re-queue failed items for retry
      const state = this.getOrCreateState(feature);
      state.queue.unshift(...batch);
    }
  }
}

// Singleton instance - Centralized control
export const throttler = new Throttler();
