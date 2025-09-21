/**
 * Analytics Charts Component
 * Reusable chart components following DRY principles
 * @CLAUDE.md - Systematic approach with centralized chart rendering
 */

'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { AnalyticsData, ChartData } from '@/types/chat';
import { ChartUtils, ProcessedChartData } from '@/lib/analytics/chart-utils';

interface AnalyticsChartsProps {
  data: AnalyticsData;
  loading?: boolean;
  timeRange: string;
  onTimeRangeChange?: (range: string) => void;
}

export function AnalyticsCharts({ 
  data, 
  loading = false, 
  timeRange, 
  onTimeRangeChange 
}: AnalyticsChartsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Generate chart data using centralized utilities
  const chartData = React.useMemo(() => {
    return [
      {
        type: 'line' as const,
        title: 'Sessions Over Time',
        data: data.trendData.sessionsOverTime.map(item => ({
          label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: item.sessions,
          date: item.date
        })),
        xAxis: 'Date',
        yAxis: 'Sessions',
        format: 'number' as const
      },
      {
        type: 'bar' as const,
        title: 'Hourly Activity Distribution',
        data: data.trendData.hourlyDistribution.map(item => ({
          label: `${item.hour}:00`,
          value: item.count
        })),
        xAxis: 'Hour',
        yAxis: 'Sessions',
        format: 'number' as const
      },
      {
        type: 'pie' as const,
        title: 'User Types Distribution',
        data: [
          {
            label: 'Authenticated Users',
            value: data.engagementMetrics.userTypes.authenticated,
            color: '#3B82F6'
          },
          {
            label: 'Guest Users',
            value: data.engagementMetrics.userTypes.guest,
            color: '#10B981'
          }
        ],
        format: 'number' as const
      },
      {
        type: 'bar' as const,
        title: 'Session Length Distribution',
        data: data.engagementMetrics.sessionLengthDistribution.map(item => ({
          label: item.range,
          value: item.count
        })),
        xAxis: 'Duration',
        yAxis: 'Sessions',
        format: 'number' as const
      }
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData.map((chart, index) => {
          const processedChart = ChartUtils.processChartData(chart);
          return (
            <ChartCard key={index} chart={processedChart} />
          );
        })}
      </div>

      {/* Messages Over Time Chart (Full Width) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Messages Over Time
          </h3>
          <div className="text-sm text-gray-500">
            Total: {data.messageMetrics.totalMessages.toLocaleString()} messages
          </div>
        </div>
        <div className="h-64">
          <SimpleLineChart
            data={data.trendData.sessionsOverTime.map(item => ({
              label: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              sessions: item.sessions,
              messages: item.messages
            }))}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Chart Card Component
 * Reusable chart container with consistent styling
 */
function ChartCard({ chart }: { chart: ProcessedChartData }) {
  const getChartIcon = (type: string) => {
    switch (type) {
      case 'pie': return <Users className="h-5 w-5" />;
      case 'bar': return <BarChart3 className="h-5 w-5" />;
      case 'line': return <TrendingUp className="h-5 w-5" />;
      default: return <BarChart3 className="h-5 w-5" />;
    }
  };

  if (chart.isEmpty) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="text-gray-400 mr-2">{getChartIcon(chart.type)}</span>
            {chart.title}
          </h3>
        </div>
        <div className="h-48 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <span className="text-blue-600 mr-2">{getChartIcon(chart.type)}</span>
          {chart.title}
        </h3>
        <div className="text-sm text-gray-500">
          {chart.total !== undefined ? `Total: ${chart.total.toLocaleString()}` : 
           `Max: ${ChartUtils.formatValue(chart.maxValue, chart.format)}`}
        </div>
      </div>
      <div className="h-48">
        {chart.type === 'pie' ? (
          <SimplePieChart data={chart.data} />
        ) : chart.type === 'bar' ? (
          <SimpleBarChart data={chart.data} />
        ) : (
          <SimpleLineChart data={chart.data.map(item => ({ 
            label: item.label, 
            value: item.value 
          }))} />
        )}
      </div>
    </div>
  );
}

/**
 * Simple Bar Chart Component
 * Basic bar chart implementation without external dependencies
 */
function SimpleBarChart({ data }: { data: any[] }) {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="h-full flex items-end justify-between space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
            style={{ 
              height: `${(item.value / maxValue) * 100}%`,
              minHeight: item.value > 0 ? '4px' : '0px'
            }}
            title={`${item.label}: ${item.value.toLocaleString()}`}
          />
          <div className="text-xs text-gray-600 mt-2 text-center truncate w-full">
            {item.label}
          </div>
          <div className="text-xs text-gray-500">
            {item.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Simple Pie Chart Component
 * Basic pie chart implementation using CSS
 */
function SimplePieChart({ data }: { data: any[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="w-32 h-32 rounded-full border-4 border-gray-200 mx-auto mb-2"></div>
          <p className="text-sm">No data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="relative w-40 h-40">
        {/* Simple pie representation using borders */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const color = item.color || (index === 0 ? '#3B82F6' : '#10B981');
            
            return (
              <div
                key={index}
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(${color} 0% ${percentage}%, transparent ${percentage}% 100%)`,
                  clipPath: index === 0 ? 'none' : `polygon(50% 50%, 50% 0%, ${50 + (percentage / 2)}% 0%, 100% 100%, 0% 100%)`
                }}
                title={`${item.label}: ${item.value.toLocaleString()} (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="absolute -right-24 top-1/2 transform -translate-y-1/2 space-y-2">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            const color = item.color || (index === 0 ? '#3B82F6' : '#10B981');
            
            return (
              <div key={index} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <div className="font-medium">{percentage}%</div>
                  <div className="text-gray-500 truncate max-w-20">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple Line Chart Component
 * Basic line chart implementation
 */
function SimpleLineChart({ data }: { data: any[] }) {
  const maxValue = Math.max(...data.map(item => 
    typeof item === 'object' && 'value' in item ? item.value : 
    typeof item === 'object' && 'sessions' in item ? Math.max(item.sessions, item.messages || 0) :
    item
  ));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line
              key={i}
              x1="0"
              y1={i * 40}
              x2="400"
              y2={i * 40}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            points={data.map((item, index) => {
              const x = (index / (data.length - 1)) * 400;
              const value = typeof item === 'object' && 'value' in item ? item.value : 
                           typeof item === 'object' && 'sessions' in item ? item.sessions :
                           item;
              const y = 200 - (value / maxValue) * 180;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 400;
            const value = typeof item === 'object' && 'value' in item ? item.value : 
                         typeof item === 'object' && 'sessions' in item ? item.sessions :
                         item;
            const y = 200 - (value / maxValue) * 180;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#3B82F6"
                className="hover:r-6 transition-all duration-200"
              >
                <title>
                  {typeof item === 'object' && 'label' in item ? item.label : `Point ${index + 1}`}: {value?.toLocaleString()}
                </title>
              </circle>
            );
          })}
        </svg>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        {data.slice(0, 5).map((item, index) => (
          <span key={index} className="truncate">
            {typeof item === 'object' && 'label' in item ? item.label : `${index + 1}`}
          </span>
        ))}
      </div>
    </div>
  );
}