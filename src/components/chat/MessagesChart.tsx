/**
 * Messages Chart Component
 * Interactive line chart showing message count over time
 * Following @CLAUDE.md DRY principles with shadcn/ui integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface ChartDataPoint {
  time: string;
  label: string;
  messages: number;
  date: string;
}

interface ChartMetadata {
  timeRange: string;
  totalMessages: number;
  peakMessages: number;
  averageMessages: number;
  dataPoints: number;
}

interface MessagesChartProps {
  timeRange: string;
  loading?: boolean;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: ChartDataPoint;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{data.label}</p>
        <p className="text-sm text-gray-600">{data.date}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span className="text-sm font-medium text-blue-600">
            {payload[0].value} messages
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function MessagesChart({
  timeRange,
  loading = false,
  className = '',
}: MessagesChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [metadata, setMetadata] = useState<ChartMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(loading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/admin/chat/analytics/messages?range=${timeRange}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setChartData(result.data || []);
          setMetadata(result.metadata || null);
        } else {
          throw new Error(result.error || 'Failed to fetch chart data');
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load chart data'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [timeRange]);

  const formatYAxisTick = (value: number) => {
    // Only show whole numbers for message counts
    if (value % 1 !== 0) {
      return '';
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const getTimeRangeLabel = (range: string): string => {
    const labels: Record<string, string> = {
      '1h': 'Last Hour',
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      all: 'All Time',
    };
    return labels[range] || 'Messages Over Time';
  };

  const getTrendInfo = () => {
    if (!chartData || chartData.length < 2) return null;

    const recent = chartData
      .slice(-3)
      .reduce((sum, item) => sum + item.messages, 0);
    const previous = chartData
      .slice(-6, -3)
      .reduce((sum, item) => sum + item.messages, 0);

    if (previous === 0) return null;

    const change = recent - previous;
    const percentChange = (change / previous) * 100;

    return {
      isPositive: change >= 0,
      percentage: Math.abs(percentChange),
      change: Math.abs(change),
    };
  };

  const trendInfo = getTrendInfo();

  if (error) {
    return (
      <Card className={`border border-red-200 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Failed to Load Chart
              </h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Messages Over Time
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {getTimeRangeLabel(timeRange)}
            </p>
          </div>
          {trendInfo && (
            <Badge
              variant="outline"
              className={`${
                trendInfo.isPositive
                  ? 'border-green-200 text-green-700 bg-green-50'
                  : 'border-red-200 text-red-700 bg-red-50'
              }`}
            >
              {trendInfo.isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {trendInfo.percentage.toFixed(1)}%
            </Badge>
          )}
        </div>

        {metadata && (
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
            <span>
              Total:{' '}
              <span className="font-medium text-gray-900">
                {metadata.totalMessages.toLocaleString()}
              </span>
            </span>
            <span>
              Peak:{' '}
              <span className="font-medium text-gray-900">
                {metadata.peakMessages.toLocaleString()}
              </span>
            </span>
            <span>
              Avg:{' '}
              <span className="font-medium text-gray-900">
                {metadata.averageMessages.toLocaleString()}
              </span>
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 11,
                  fill: '#64748b',
                  angle: -45,
                  textAnchor: 'end',
                }}
                height={60}
                interval={2}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {chartData.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Message Data
              </h3>
              <p className="text-sm text-gray-500">
                No messages found for the selected time period.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
