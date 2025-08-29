/**
 * Monitoring System Index - Malaysian E-commerce Platform
 * Central export for all monitoring functionality
 */

// Core monitoring
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

// Integration helpers
export { MonitoringProvider, useMonitoring } from './monitoring-provider';
export { initializeMonitoring, getMonitoringHealth } from './monitoring-init';

// Monitoring utilities
export { createPerformanceObserver, trackUserAction } from './monitoring-utils';
