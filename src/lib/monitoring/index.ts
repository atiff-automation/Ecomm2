/**
 * Monitoring System Index - Malaysian E-commerce Platform
 * Central export for all monitoring functionality
 * Following @CLAUDE.md: centralized, DRY, single source of truth
 */

// NEW CENTRALIZED ARCHITECTURE - Phase 2 Implementation
export {
  MONITORING_CONFIG,
  getMonitoringConfig,
  isFeatureEnabled,
  getSamplingRate,
  getThrottlingConfig,
  getCircuitBreakerConfig,
  updateMonitoringConfig,
  emergencyDisableMonitoring,
  validateMonitoringConfig,
} from './monitoring-config';

export {
  monitoringService,
  MonitoringService,
  MonitoringType,
} from './monitoring-service';

export { throttler, Throttler } from './throttler';
export {
  circuitBreaker,
  CircuitBreaker,
  CircuitState,
} from './circuit-breaker';

// Legacy monitoring (will be refactored in Phase 3)
export { errorMonitor, useErrorMonitor } from './error-monitor';
export {
  GlobalErrorBoundary,
  withErrorBoundary,
  useErrorReporter,
} from '@/components/error/GlobalErrorBoundary';

// Types
export type {
  ErrorReport,
  PerformanceMetrics,
  MonitoringConfig,
} from './error-monitor';

export type { MonitoringConfig as NewMonitoringConfig } from './monitoring-config';

export type { MonitoringData, SendDataOptions } from './monitoring-service';

export type { CircuitBreakerState } from './circuit-breaker';

// Integration helpers (will be updated in Phase 3)
export { MonitoringProvider, useMonitoring } from './monitoring-provider';
export { initializeMonitoring, getMonitoringHealth } from './monitoring-init';

// Monitoring utilities (will be refactored in Phase 3)
export { createPerformanceObserver, trackUserAction } from './monitoring-utils';
