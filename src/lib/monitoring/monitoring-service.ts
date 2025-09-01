/**
 * Unified Monitoring Service - Malaysian E-commerce Platform
 * Single point of control for all monitoring operations
 * Following @CLAUDE.md principles: DRY, centralized, systematic
 */

'use client';

import { getMonitoringConfig, isFeatureEnabled, getSamplingRate } from './monitoring-config';
import { throttler } from './throttler';
import { circuitBreaker } from './circuit-breaker';

export enum MonitoringType {
  PERFORMANCE = 'performance',
  ERROR = 'errors',
  EVENT = 'events',
  USER_ACTION = 'userAction',
}

interface MonitoringData {
  type: MonitoringType;
  timestamp: string;
  url: string;
  sessionId?: string;
  userId?: string;
  data: any;
}

interface SendDataOptions {
  force?: boolean;
  batch?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Unified monitoring service - Single source of truth for all monitoring
 * Prevents death spiral through systematic controls
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private initialized = false;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get singleton instance - Centralized access
   */
  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }
  
  /**
   * Initialize monitoring service - Systematic setup
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }
    
    // Validate configuration
    const config = getMonitoringConfig();
    console.log('📊 Monitoring service initialized with config:', {
      features: config.features,
      samplingRate: getSamplingRate(),
      emergencyDisabled: process.env.MONITORING_EMERGENCY_DISABLE === 'true',
    });
    
    this.initialized = true;
  }
  
  /**
   * Track monitoring data - Single entry point for all monitoring
   */
  async track(
    type: MonitoringType,
    data: any,
    options: SendDataOptions = {}
  ): Promise<boolean> {
    try {
      // Early exit checks - Systematic validation
      if (!this.initialized) {
        this.initialize();
      }
      
      // Check if feature is enabled
      if (!options.force && !isFeatureEnabled(type)) {
        return false;
      }
      
      // Check sampling rate
      if (!options.force && !this.shouldSample()) {
        return false;
      }
      
      // Check circuit breaker
      if (!circuitBreaker.canProceed(type)) {
        return false;
      }
      
      // Check throttling
      if (!options.force && !throttler.canProceed(type)) {
        if (options.batch !== false) {
          // Add to batch queue instead of dropping
          throttler.addToBatch(type, this.createMonitoringData(type, data));
        }
        return false;
      }
      
      // Create monitoring data
      const monitoringData = this.createMonitoringData(type, data);
      
      // Send data
      const success = await this.sendData(monitoringData, options);
      
      // Record circuit breaker result
      if (success) {
        circuitBreaker.recordSuccess(type);
      } else {
        circuitBreaker.recordFailure(type);
      }
      
      return success;
    } catch (error) {
      console.warn(`Monitoring tracking failed for ${type}:`, error);
      circuitBreaker.recordFailure(type);
      return false;
    }
  }
  
  /**
   * Track performance metrics - Specific interface
   */
  async trackPerformance(metrics: any): Promise<boolean> {
    return this.track(MonitoringType.PERFORMANCE, {
      type: 'page-performance',
      metrics,
    });
  }
  
  /**
   * Track slow resource - Specific interface
   */
  async trackSlowResource(resource: any): Promise<boolean> {
    return this.track(MonitoringType.PERFORMANCE, {
      type: 'slow-resource',
      resource,
    });
  }
  
  /**
   * Track error - Specific interface
   */
  async trackError(error: Error, context?: any): Promise<boolean> {
    return this.track(MonitoringType.ERROR, {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
    });
  }
  
  /**
   * Track user action - Specific interface
   */
  async trackUserAction(action: string, properties?: any): Promise<boolean> {
    return this.track(MonitoringType.USER_ACTION, {
      action,
      properties,
    });
  }
  
  /**
   * Track custom event - Specific interface
   */
  async trackEvent(eventType: string, eventData: any): Promise<boolean> {
    return this.track(MonitoringType.EVENT, {
      eventType,
      eventData,
    });
  }
  
  /**
   * Batch send queued items - Systematic processing
   */
  async processQueues(): Promise<void> {
    try {
      await Promise.all([
        throttler.processQueue(MonitoringType.PERFORMANCE),
        throttler.processQueue(MonitoringType.ERROR),
        throttler.processQueue(MonitoringType.EVENT),
      ]);
    } catch (error) {
      console.warn('Failed to process monitoring queues:', error);
    }
  }
  
  /**
   * Get service health status - Systematic monitoring
   */
  getHealthStatus(): {
    initialized: boolean;
    featuresEnabled: Record<string, boolean>;
    throttling: Record<string, any>;
    circuitBreakers: Record<string, any>;
    samplingRate: number;
  } {
    const config = getMonitoringConfig();
    
    return {
      initialized: this.initialized,
      featuresEnabled: config.features,
      throttling: throttler.getAllStatus(),
      circuitBreakers: circuitBreaker.getAllStatus(),
      samplingRate: getSamplingRate(),
    };
  }
  
  /**
   * Emergency disable all monitoring - Emergency control
   */
  emergencyDisable(): void {
    // Reset all systems
    throttler.reset();
    circuitBreaker.reset();
    
    // Force open all circuit breakers
    Object.keys(getMonitoringConfig().features).forEach(feature => {
      circuitBreaker.forceOpen(feature);
    });
    
    console.warn('🚨 EMERGENCY: Monitoring service disabled');
  }
  
  /**
   * Private: Create standardized monitoring data
   */
  private createMonitoringData(type: MonitoringType, data: any): MonitoringData {
    return {
      type,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'ssr',
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      data,
    };
  }
  
  /**
   * Private: Send data to monitoring API
   */
  private async sendData(
    monitoringData: MonitoringData,
    options: SendDataOptions
  ): Promise<boolean> {
    const config = getMonitoringConfig();
    const endpoint = this.getEndpointForType(monitoringData.type);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(monitoringData.data),
      });
      
      return response.ok;
    } catch (error) {
      console.warn(`Failed to send monitoring data to ${endpoint}:`, error);
      return false;
    }
  }
  
  /**
   * Private: Get API endpoint for monitoring type
   */
  private getEndpointForType(type: MonitoringType): string {
    const config = getMonitoringConfig();
    
    switch (type) {
      case MonitoringType.PERFORMANCE:
        return config.endpoints.performance;
      case MonitoringType.ERROR:
        return config.endpoints.errors;
      case MonitoringType.EVENT:
      case MonitoringType.USER_ACTION:
        return config.endpoints.events;
      default:
        return config.endpoints.performance;
    }
  }
  
  /**
   * Private: Check if should sample this request
   */
  private shouldSample(): boolean {
    const samplingRate = getSamplingRate();
    return Math.random() < samplingRate;
  }
  
  /**
   * Private: Get session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'ssr';
    }
    
    let sessionId = sessionStorage.getItem('monitoring_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('monitoring_session_id', sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * Private: Get user ID
   */
  private getUserId(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || null;
      }
    } catch {
      // Ignore errors
    }
    
    return null;
  }
}

// Export singleton instance - Centralized access
export const monitoringService = MonitoringService.getInstance();

// Export types for systematic usage
export type { MonitoringData, SendDataOptions };