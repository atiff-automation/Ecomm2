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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const handleStatusChange = (value: string) => {
    onFiltersChange({ status: value as FilterState['status'] });
  };

  const handleExportFormatChange = (value: string) => {
    onExportFormatChange(value as 'json' | 'csv' | 'pdf');
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
    <div className="flex flex-col lg:flex-row gap-4 mb-6">
      {/* Search Input - Following admin layout standards */}
      <div className="flex-1 min-w-0">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search sessions by ID or user email..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-10 h-10"
          />
        </div>
      </div>

      {/* Filters - Clean horizontal layout like products page */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-10 w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Picker */}
        <DateRangePicker
          startDate={filters.dateRange.from}
          endDate={filters.dateRange.to}
          onStartDateChange={(date) => handleDateRangeChange(date, filters.dateRange.to)}
          onEndDateChange={(date) => handleDateRangeChange(filters.dateRange.from, date)}
          placeholder="Filter by date range"
          className="h-10 w-[240px]"
        />

        {/* Clear Dates Button */}
        {hasCustomDateRange() && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearDates}
            className="h-10 px-3 whitespace-nowrap"
          >
            Clear Dates
          </Button>
        )}

        {/* Export Format Selector */}
        <Select value={exportFormat} onValueChange={handleExportFormatChange}>
          <SelectTrigger className="h-10 w-[100px]">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button */}
        <Button
          onClick={onExport}
          disabled={selectedCount === 0 || isExporting}
          variant="outline"
          className="h-10 px-4 whitespace-nowrap"
        >
          {isExporting ? 'Exporting...' : `Export (${selectedCount})`}
        </Button>
      </div>
    </div>
  );
}