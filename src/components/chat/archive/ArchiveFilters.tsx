/**
 * Archive Filters Component
 * Following @CLAUDE.md DRY principles - matches SessionFilters pattern
 * Provides search, filtering, and bulk operations for archived sessions
 */

'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  RotateCcw,
  Archive,
  Clock,
  MessageSquare,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FilterState } from '@/types/chat';

interface ArchiveFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onBulkArchive: () => void;
  onBulkRestore: () => void;
  selectedCount: number;
  disabled?: boolean;
}

interface DateRangePickerProps {
  value: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date }) => void;
  disabled?: boolean;
}

function DateRangePicker({ value, onChange, disabled }: DateRangePickerProps) {
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleFromChange = (dateString: string) => {
    const newFrom = new Date(dateString);
    onChange({ from: newFrom, to: value.to });
  };

  const handleToChange = (dateString: string) => {
    const newTo = new Date(dateString);
    onChange({ from: value.from, to: newTo });
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-400" />
      <Input
        type="date"
        value={formatDate(value.from)}
        onChange={(e) => handleFromChange(e.target.value)}
        disabled={disabled}
        className="w-36"
      />
      <span className="text-gray-400">to</span>
      <Input
        type="date"
        value={formatDate(value.to)}
        onChange={(e) => handleToChange(e.target.value)}
        disabled={disabled}
        className="w-36"
      />
    </div>
  );
}

export function ArchiveFilters({
  filters,
  onFiltersChange,
  onBulkArchive,
  onBulkRestore,
  selectedCount,
  disabled = false
}: ArchiveFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleStatusChange = (status: typeof filters.status) => {
    onFiltersChange({ ...filters, status });
  };

  const handleUserTypeChange = (userType: typeof filters.userType) => {
    onFiltersChange({ ...filters, userType });
  };

  const handleDurationFilterChange = (durationFilter: typeof filters.durationFilter) => {
    onFiltersChange({ ...filters, durationFilter });
  };

  const handleMessageCountFilterChange = (messageCountFilter: typeof filters.messageCountFilter) => {
    onFiltersChange({ ...filters, messageCountFilter });
  };

  const handleDateRangeChange = (dateRange: { from: Date; to: Date }) => {
    onFiltersChange({ ...filters, dateRange });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      dateRange: {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days for archive
        to: new Date(),
      },
      userType: 'all',
      durationFilter: 'all',
      messageCountFilter: 'all',
    });
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.userType !== 'all' ||
    filters.durationFilter !== 'all' ||
    filters.messageCountFilter !== 'all';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Main Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search sessions, emails, or session IDs..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={disabled}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-3">
          {/* Archive Status */}
          <Select value={filters.status} onValueChange={handleStatusChange} disabled={disabled}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Can Restore</SelectItem>
              <SelectItem value="ended">Cannot Restore</SelectItem>
            </SelectContent>
          </Select>

          {/* User Type */}
          <Select value={filters.userType} onValueChange={handleUserTypeChange} disabled={disabled}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="authenticated">Authenticated</SelectItem>
              <SelectItem value="anonymous">Guest Users</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            disabled={disabled}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvancedFilters ? 'Hide' : 'More'} Filters
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={disabled}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archive Date Range
              </label>
              <DateRangePicker
                value={filters.dateRange}
                onChange={handleDateRangeChange}
                disabled={disabled}
              />
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Session Duration
              </label>
              <Select 
                value={filters.durationFilter} 
                onValueChange={handleDurationFilterChange}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Durations</SelectItem>
                  <SelectItem value="short">Short (&lt; 5 min)</SelectItem>
                  <SelectItem value="medium">Medium (5-30 min)</SelectItem>
                  <SelectItem value="long">Long (&gt; 30 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message Count Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Count
              </label>
              <Select 
                value={filters.messageCountFilter} 
                onValueChange={handleMessageCountFilterChange}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counts</SelectItem>
                  <SelectItem value="low">Low (1-5 messages)</SelectItem>
                  <SelectItem value="medium">Medium (6-20 messages)</SelectItem>
                  <SelectItem value="high">High (20+ messages)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {selectedCount} session{selectedCount !== 1 ? 's' : ''} selected
            </span>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onBulkRestore}
                disabled={disabled}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">Active Filters:</span>
            
            {filters.search && (
              <div className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                <span>"{filters.search}"</span>
              </div>
            )}
            
            {filters.status !== 'all' && (
              <div className="flex items-center gap-1">
                <Archive className="h-3 w-3" />
                <span>{filters.status === 'active' ? 'Can Restore' : 'Cannot Restore'}</span>
              </div>
            )}
            
            {filters.userType !== 'all' && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{filters.userType === 'authenticated' ? 'Authenticated' : 'Guest'}</span>
              </div>
            )}
            
            {filters.durationFilter !== 'all' && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{filters.durationFilter} duration</span>
              </div>
            )}
            
            {filters.messageCountFilter !== 'all' && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{filters.messageCountFilter} messages</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArchiveFilters;