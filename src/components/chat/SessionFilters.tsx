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
import { CustomDateRangePicker } from '@/components/ui/custom-date-range-picker';
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
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 my-6">
      {/* Enhanced Search Input - Following promotional date design aesthetics */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search sessions by ID or user email..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-10 h-10 w-full border-gray-300 focus:border-green-500 focus:ring-green-500 transition-colors bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Filters - Clean horizontal layout like products page */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter - Enhanced with green accents */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-10 w-[140px] border-gray-300 focus:border-green-500 focus:ring-green-500">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Range Picker - Following promotional date design */}
        <CustomDateRangePicker
          startDate={filters.dateRange.from}
          endDate={filters.dateRange.to}
          onStartDateChange={(date) => handleDateRangeChange(date, filters.dateRange.to)}
          onEndDateChange={(date) => handleDateRangeChange(filters.dateRange.from, date)}
          placeholder="Filter by date range"
          className="h-10 w-[240px]"
        />

        {/* Clear Dates Button - Enhanced styling */}
        {hasCustomDateRange() && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearDates}
            className="h-10 px-3 whitespace-nowrap border-gray-300 hover:border-green-500 hover:text-green-600 transition-colors"
          >
            Clear Dates
          </Button>
        )}

        {/* Export Format Selector - Enhanced with green accents */}
        <Select value={exportFormat} onValueChange={handleExportFormatChange}>
          <SelectTrigger className="h-10 w-[100px] border-gray-300 focus:border-green-500 focus:ring-green-500">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="json">JSON</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button - Enhanced with green styling */}
        <Button
          onClick={onExport}
          disabled={selectedCount === 0 || isExporting}
          variant="outline"
          className="h-10 px-4 whitespace-nowrap border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
        >
          {isExporting ? 'Exporting...' : `Export (${selectedCount})`}
        </Button>
      </div>
    </div>
  );
}