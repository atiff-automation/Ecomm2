/**
 * Metrics Cards Component
 * Reusable metrics display following DRY principles
 */

'use client';

import React from 'react';
import {
  MessageCircle,
  Users,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { MetricsCardProps, ChatMetrics } from '@/types/chat';
import { cn } from '@/utils/chat';

interface MetricCardData {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  description?: string;
}

const MetricsCards: React.FC<MetricsCardProps> = ({
  metrics,
  loading = false,
  variant = 'default',
}) => {
  if (loading) {
    return <MetricsCardsSkeleton variant={variant} />;
  }

  if (!metrics) {
    return <MetricsCardsError />;
  }

  // @CLAUDE.md - Clear, descriptive metric cards with proper time range indication
  const timeRangeLabel = (metrics as any).timeRangeLabel || 'Last 24 Hours';
  const isAllTime = (metrics as any).isAllTime || false;

  const metricCards: MetricCardData[] = [
    {
      title: isAllTime ? 'Total Sessions (All Time)' : `Sessions (${timeRangeLabel})`,
      value: metrics.totalSessions.toLocaleString(),
      icon: MessageCircle,
      iconColor: 'text-blue-600',
      trend: {
        value: metrics.todaysSessions,
        isPositive: true,
        label: 'created today',
      },
      description: isAllTime
        ? `${(metrics as any).totalSessionsAllTime?.toLocaleString() || '0'} total sessions ever`
        : `${(metrics as any).totalSessionsAllTime?.toLocaleString() || '0'} total all time`,
    },
    {
      title: 'Active Now',
      value: metrics.activeSessions.toLocaleString(),
      icon: Users,
      iconColor: 'text-green-600',
      description: 'Currently active sessions',
    },
    {
      title: isAllTime ? 'Total Messages (All Time)' : `Messages (${timeRangeLabel})`,
      value: metrics.totalMessages.toLocaleString(),
      icon: Activity,
      iconColor: 'text-purple-600',
      description: isAllTime
        ? 'All messages ever sent'
        : `${(metrics as any).totalMessagesAllTime?.toLocaleString() || '0'} total all time`,
    },
    {
      title: 'Avg Duration',
      value: metrics.averageSessionDuration > 0
        ? `${Math.round(metrics.averageSessionDuration / 60)}m`
        : 'N/A',
      icon: Clock,
      iconColor: 'text-yellow-600',
      description: (metrics as any).completedSessionsCount > 0
        ? `From ${(metrics as any).completedSessionsCount} completed sessions`
        : 'No completed sessions',
    },
  ];

  const isCompact = variant === 'compact';

  return (
    <div className={cn(
      'grid',
      isCompact ? 'grid-cols-1 gap-3 h-full' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'
    )}>
      {metricCards.map((card, index) => (
        <MetricCard
          key={card.title}
          data={card}
          compact={isCompact}
          index={index}
        />
      ))}
    </div>
  );
};

interface MetricCardProps {
  data: MetricCardData;
  compact: boolean;
  index: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ data, compact, index }) => {
  const { title, value, icon: Icon, iconColor, trend, description } = data;

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.isPositive) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    if (trend.isPositive && trend.value > 0) return 'text-green-600';
    if (trend.value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <Card className={cn(
      'border border-gray-200 hover:shadow-md transition-shadow duration-200',
      compact && 'p-2'
    )}>
      <CardContent className={cn(
        'flex items-center justify-between',
        compact ? 'p-0' : 'p-6'
      )}>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className={cn(
              'font-medium text-gray-600',
              compact ? 'text-xs' : 'text-sm'
            )}>
              {title}
            </p>
            <div className={cn(
              'rounded-lg flex items-center justify-center',
              compact ? 'h-6 w-6' : 'h-12 w-12',
              iconColor.includes('blue') && 'bg-blue-100',
              iconColor.includes('green') && 'bg-green-100',
              iconColor.includes('purple') && 'bg-purple-100',
              iconColor.includes('yellow') && 'bg-yellow-100'
            )}>
              <Icon className={cn(
                iconColor,
                compact ? 'h-3 w-3' : 'h-6 w-6'
              )} />
            </div>
          </div>

          <div className={cn('mt-1', compact && 'mt-0.5')}>
            <p className={cn(
              'font-bold text-gray-900',
              compact ? 'text-base' : 'text-3xl'
            )}>
              {value}
            </p>

            {(trend || description) && (
              <div className={cn('flex items-center justify-between', compact ? 'mt-0' : 'mt-1')}>
                {trend && (
                  <div className={cn(
                    'flex items-center space-x-1',
                    getTrendColor(),
                    'text-xs'
                  )}>
                    {getTrendIcon()}
                    <span>+{trend.value} {trend.label}</span>
                  </div>
                )}

                {description && !trend && (
                  <p className={cn(
                    'text-gray-500',
                    'text-xs'
                  )}>
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MetricsCardsSkeleton: React.FC<{ variant?: 'default' | 'compact' }> = ({
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';

  return (
    <div className={cn(
      'grid gap-4',
      isCompact ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    )}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="border border-gray-200">
          <CardContent className={cn(
            'flex items-center justify-between',
            isCompact ? 'p-3' : 'p-6'
          )}>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className={cn(
                  'h-4',
                  isCompact ? 'w-16' : 'w-20'
                )} />
                <Skeleton className={cn(
                  'rounded-lg',
                  isCompact ? 'h-8 w-8' : 'h-12 w-12'
                )} />
              </div>
              <Skeleton className={cn(
                'h-8',
                isCompact ? 'w-12' : 'w-16'
              )} />
              <Skeleton className={cn(
                'h-3',
                isCompact ? 'w-12' : 'w-20'
              )} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const MetricsCardsError: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-24">
              <div className="text-center">
                <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Unable to load</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Enhanced metrics display for detailed analytics
export const DetailedMetricsCards: React.FC<{
  metrics: ChatMetrics & {
    yesterdaySessions?: number;
    weeklyGrowth?: number;
    monthlyGrowth?: number;
  };
  loading?: boolean;
}> = ({ metrics, loading = false }) => {
  if (loading) {
    return <MetricsCardsSkeleton />;
  }

  const calculateGrowth = (current: number, previous: number): {
    value: number;
    isPositive: boolean;
    percentage: number;
  } => {
    const difference = current - previous;
    const percentage = previous > 0 ? (difference / previous) * 100 : 0;
    return {
      value: Math.abs(difference),
      isPositive: difference >= 0,
      percentage: Math.abs(percentage),
    };
  };

  const todayGrowth = metrics.yesterdaySessions
    ? calculateGrowth(metrics.todaysSessions, metrics.yesterdaySessions)
    : null;

  const metricCards: MetricCardData[] = [
    {
      title: 'Total Sessions',
      value: metrics.totalSessions.toLocaleString(),
      icon: MessageCircle,
      iconColor: 'text-blue-600',
      trend: todayGrowth ? {
        value: todayGrowth.value,
        isPositive: todayGrowth.isPositive,
        label: `vs yesterday (${todayGrowth.percentage.toFixed(1)}%)`,
      } : undefined,
    },
    {
      title: 'Active Now',
      value: metrics.activeSessions.toLocaleString(),
      icon: Users,
      iconColor: 'text-green-600',
      description: 'Currently active',
    },
    {
      title: 'Messages Today',
      value: metrics.totalMessages.toLocaleString(),
      icon: Activity,
      iconColor: 'text-purple-600',
      description: 'Total messages',
    },
    {
      title: 'Response Time',
      value: `${metrics.responseTime || 0}ms`,
      icon: Clock,
      iconColor: 'text-yellow-600',
      description: 'Average response',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((card, index) => (
        <MetricCard
          key={card.title}
          data={card}
          compact={false}
          index={index}
        />
      ))}
    </div>
  );
};

export default MetricsCards;