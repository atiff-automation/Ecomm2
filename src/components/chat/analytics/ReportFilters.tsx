/**
 * Analytics Report Filters Component
 * Following @CLAUDE.md DRY principles - matches SessionFilters pattern
 * Provides time range, metrics type, and export filtering for analytics
 */

'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  Filter, 
  Download, 
  Clock, 
  BarChart3,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReportConfig } from '@/types/chat';

interface ReportFiltersProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onExport: (config: ReportConfig) => void;
  onRefresh?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (config: ReportConfig) => void;
  timeRange: string;
}

function ExportDialog({ open, onOpenChange, onExport, timeRange }: ExportDialogProps) {
  const [config, setConfig] = useState<Partial<ReportConfig>>({
    title: 'Chat Analytics Report',
    timeRange,
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
    format: 'pdf',
  });

  const handleExport = () => {
    onExport({
      title: config.title || 'Chat Analytics Report',
      timeRange: config.timeRange || timeRange,
      includeCharts: config.includeCharts ?? true,
      includeSummary: config.includeSummary ?? true,
      includeDetails: config.includeDetails ?? true,
      format: config.format || 'pdf',
    });
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Export Analytics Report</h3>
        
        <div className="space-y-4">
          {/* Report Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Title
            </label>
            <input
              type="text"
              value={config.title || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter report title"
            />
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format
            </label>
            <Select 
              value={config.format} 
              onValueChange={(value: 'json' | 'csv' | 'pdf') => 
                setConfig(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="csv">CSV Data</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Include Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Include in Report
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeCharts ?? true}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Charts and Graphs</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeSummary ?? true}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeSummary: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Executive Summary</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeDetails ?? true}
                  onChange={(e) => setConfig(prev => ({ ...prev, includeDetails: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Detailed Metrics</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ReportFilters({ 
  timeRange, 
  onTimeRangeChange, 
  onExport, 
  onRefresh,
  disabled = false,
  loading = false 
}: ReportFiltersProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const timeRangeOptions = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  const getTimeRangeLabel = (value: string) => {
    const option = timeRangeOptions.find(opt => opt.value === value);
    return option?.label || value;
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left side - Time Range Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Time Range:</span>
            </div>
            
            <Select 
              value={timeRange} 
              onValueChange={onTimeRangeChange}
              disabled={disabled || loading}
            >
              <SelectTrigger className="w-44">
                <SelectValue>
                  {getTimeRangeLabel(timeRange)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={disabled || loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportDialogOpen(true)}
              disabled={disabled || loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BarChart3 className="h-3 w-3" />
            <span>Analytics for {getTimeRangeLabel(timeRange)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TrendingUp className="h-3 w-3" />
            <span>Real-time data</span>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={onExport}
        timeRange={timeRange}
      />
    </>
  );
}

export default ReportFilters;