'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Download, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ORDER_DATE_FILTERS } from '@/lib/constants/order';
import type { OrderFilterValues, OrderFiltersProps } from './types';

export function OrderFilters({
  currentFilters,
  onFilterChange,
  onExport,
  isLoading = false,
  orderCount = 0,
}: OrderFiltersProps) {
  const [searchInput, setSearchInput] = useState(currentFilters.search || '');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    currentFilters.dateFrom
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(currentFilters.dateTo);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search - update filter after user stops typing
    const timeoutId = setTimeout(() => {
      onFilterChange({ ...currentFilters, search: value });
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleDatePresetChange = (presetId: string) => {
    const preset = ORDER_DATE_FILTERS.find(f => f.id === presetId);
    if (!preset) {
      return;
    }

    if (preset.id === 'custom') {
      // Keep current custom dates
      return;
    }

    const dateRange = preset.getValue();
    if (dateRange) {
      setDateFrom(dateRange.from);
      setDateTo(dateRange.to);
      onFilterChange({
        ...currentFilters,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
      });
    }
  };

  const handleCustomDateChange = (
    type: 'from' | 'to',
    date: Date | undefined
  ) => {
    if (type === 'from') {
      setDateFrom(date);
      onFilterChange({ ...currentFilters, dateFrom: date });
    } else {
      setDateTo(date);
      onFilterChange({ ...currentFilters, dateTo: date });
    }
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    onFilterChange({
      ...currentFilters,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const hasActiveFilters =
    currentFilters.search ||
    currentFilters.status ||
    currentFilters.dateFrom ||
    currentFilters.dateTo;

  const clearAllFilters = () => {
    setSearchInput('');
    setDateFrom(undefined);
    setDateTo(undefined);
    onFilterChange({});
  };

  return (
    <div className="space-y-4" role="search" aria-label="Order filters">
      {/* Top Row: Search + Date Filter + Export */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by order #, customer name, or email..."
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
            className="pl-10"
            disabled={isLoading}
            aria-label="Search orders"
            type="search"
          />
        </div>

        {/* Date Filter */}
        <div className="flex gap-2">
          {/* Date Preset Selector */}
          <Select onValueChange={handleDatePresetChange}>
            <SelectTrigger
              className="w-[160px]"
              aria-label="Select date range preset"
            >
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_DATE_FILTERS.map(preset => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !dateFrom && !dateTo && 'text-muted-foreground'
                )}
                aria-label="Pick custom date range"
              >
                <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                {dateFrom && dateTo ? (
                  <>
                    {format(dateFrom, 'MMM dd')} - {format(dateTo, 'MMM dd')}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-3">
                <div>
                  <label htmlFor="date-from" className="text-sm font-medium">
                    From
                  </label>
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={date => handleCustomDateChange('from', date)}
                    initialFocus
                    aria-label="Select start date"
                  />
                </div>
                <div>
                  <label htmlFor="date-to" className="text-sm font-medium">
                    To
                  </label>
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={date => handleCustomDateChange('to', date)}
                    disabled={date => (dateFrom ? date < dateFrom : false)}
                    aria-label="Select end date"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilter}
                    className="w-full"
                    aria-label="Clear selected dates"
                  >
                    Clear dates
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Export Button */}
        {onExport && (
          <Button
            variant="outline"
            onClick={onExport}
            disabled={isLoading || orderCount === 0}
            aria-label="Export orders"
          >
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export
          </Button>
        )}
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div
          className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-md"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <span className="font-medium">{orderCount} orders</span>
            {currentFilters.search && (
              <span>matching "{currentFilters.search}"</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 text-blue-700 hover:text-blue-900"
            aria-label="Clear all filters"
          >
            <X className="w-4 h-4 mr-1" aria-hidden="true" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
