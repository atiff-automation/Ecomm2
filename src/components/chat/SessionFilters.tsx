/**
 * SessionFilters Component
 * Advanced filtering UI following DRY principles and centralized architecture
 * Following @CLAUDE.md approach with single source of truth
 */

'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { FilterState } from '@/types/chat';

interface SessionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onExport: () => void;
  selectedCount: number;
  isExporting: boolean;
  exportFormat: 'json' | 'csv' | 'pdf';
  onExportFormatChange: (format: 'json' | 'csv' | 'pdf') => void;
}

export function SessionFilters({
  filters,
  onFiltersChange,
  onExport,
  selectedCount,
  isExporting,
  exportFormat,
  onExportFormatChange,
}: SessionFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ status: e.target.value as FilterState['status'] });
  };

  const handleDateRangeChange = (from: Date | undefined, to: Date | undefined) => {
    onFiltersChange({
      dateRange: {
        from: from || filters.dateRange.from,
        to: to || filters.dateRange.to,
      },
    });
  };

  const handleClearDates = () => {
    onFiltersChange({
      dateRange: {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        to: new Date(),
      },
    });
  };

  const hasCustomDateRange = () => {
    const defaultFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const defaultTo = new Date();

    return (
      Math.abs(filters.dateRange.from.getTime() - defaultFrom.getTime()) > 24 * 60 * 60 * 1000 ||
      Math.abs(filters.dateRange.to.getTime() - defaultTo.getTime()) > 24 * 60 * 60 * 1000
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search sessions by ID or user email..."
                value={filters.search}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters and Export */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={handleStatusChange}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="ended">Ended</option>
            </select>

            {/* Date Range Picker */}
            <div className="min-w-[280px]">
              <DateRangePicker
                startDate={filters.dateRange.from}
                endDate={filters.dateRange.to}
                onStartDateChange={(date) => handleDateRangeChange(date, filters.dateRange.to)}
                onEndDateChange={(date) => handleDateRangeChange(filters.dateRange.from, date)}
                placeholder="Filter by date range"
                className="w-full"
              />
            </div>

            {/* Clear Dates Button */}
            {hasCustomDateRange() && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearDates}
                className="whitespace-nowrap"
              >
                Clear Dates
              </Button>
            )}

            {/* Export Format Selector */}
            <select
              value={exportFormat}
              onChange={(e) => onExportFormatChange(e.target.value as 'json' | 'csv' | 'pdf')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
            </select>

            {/* Export Button */}
            <Button
              onClick={onExport}
              disabled={selectedCount === 0 || isExporting}
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
            >
              {isExporting ? 'Exporting...' : `Export (${selectedCount})`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}