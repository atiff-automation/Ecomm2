/**
 * Analytics Metrics Overview Component
 * Following @CLAUDE.md DRY principles - extends existing MetricsCards pattern
 * Displays comprehensive analytics metrics in card format
 */

'use client';

import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  Activity,
  Target,
  Zap,
  BarChart3
} from 'lucide-react';
import type { AnalyticsData } from '@/types/chat';

interface MetricsOverviewProps {
  metrics: AnalyticsData['sessionMetrics'] & AnalyticsData['messageMetrics'] & AnalyticsData['performanceMetrics'];
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  loading?: boolean;
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, loading }: MetricCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp 
                className={`h-3 w-3 mr-1 ${
                  trend.positive !== false ? 'text-green-500' : 'text-red-500'
                }`} 
              />
              <span 
                className={`text-xs font-medium ${
                  trend.positive !== false ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.positive !== false ? '+' : ''}{trend.value}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );
}

export function MetricsOverview({ metrics, loading }: MetricsOverviewProps) {
  // Format duration helper
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600 * 10) / 10}h`;
  };

  // Format percentage helper
  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  // Format response time helper
  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${Math.round(ms / 1000 * 10) / 10}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Session Metrics */}
      <MetricCard
        title="Total Sessions"
        value={metrics.totalSessions || 0}
        subtitle="All time sessions"
        icon={Users}
        trend={metrics.sessionGrowth ? {
          value: Math.round(metrics.sessionGrowth * 100) / 100,
          label: "vs previous period",
          positive: metrics.sessionGrowth > 0
        } : undefined}
        loading={loading}
      />

      <MetricCard
        title="Active Sessions"
        value={metrics.activeSessions || 0}
        subtitle="Currently active"
        icon={Activity}
        loading={loading}
      />

      <MetricCard
        title="Avg Session Duration"
        value={formatDuration(metrics.averageSessionDuration || 0)}
        subtitle="Per session average"
        icon={Clock}
        loading={loading}
      />

      <MetricCard
        title="Ended Sessions"
        value={metrics.endedSessions || 0}
        subtitle="Completed sessions"
        icon={Target}
        loading={loading}
      />

      {/* Message Metrics */}
      <MetricCard
        title="Total Messages"
        value={metrics.totalMessages || 0}
        subtitle="All messages sent"
        icon={MessageSquare}
        trend={metrics.messageGrowth ? {
          value: Math.round(metrics.messageGrowth * 100) / 100,
          label: "vs previous period",
          positive: metrics.messageGrowth > 0
        } : undefined}
        loading={loading}
      />

      <MetricCard
        title="Messages Per Session"
        value={Math.round((metrics.messagesPerSession || 0) * 10) / 10}
        subtitle="Average per session"
        icon={BarChart3}
        loading={loading}
      />

      <MetricCard
        title="Bot Messages"
        value={metrics.botMessages || 0}
        subtitle="Automated responses"
        icon={Zap}
        loading={loading}
      />

      <MetricCard
        title="User Messages"
        value={metrics.userMessages || 0}
        subtitle="User interactions"
        icon={Users}
        loading={loading}
      />

      {/* Performance Metrics */}
      <MetricCard
        title="Response Time"
        value={formatResponseTime(metrics.averageResponseTime || 0)}
        subtitle="Average response time"
        icon={Zap}
        loading={loading}
      />

      <MetricCard
        title="Success Rate"
        value={formatPercentage(metrics.successRate || 0)}
        subtitle="Request success rate"
        icon={Target}
        loading={loading}
      />

      <MetricCard
        title="Queue Processing"
        value={formatResponseTime(metrics.queueProcessingTime || 0)}
        subtitle="Average queue time"
        icon={Activity}
        loading={loading}
      />

      <MetricCard
        title="Error Rate"
        value={formatPercentage(metrics.errorRate || 0)}
        subtitle="Request error rate"
        icon={TrendingUp}
        trend={metrics.errorRate ? {
          value: Math.round(metrics.errorRate * 100 * 100) / 100,
          label: "error rate",
          positive: false
        } : undefined}
        loading={loading}
      />
    </div>
  );
}

export default MetricsOverview;