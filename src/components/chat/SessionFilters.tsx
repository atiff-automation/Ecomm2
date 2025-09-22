/**
 * SessionFilters Component
 * Advanced filtering UI following DRY principles and centralized architecture
 * Following @CLAUDE.md approach with single source of truth
 */

'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FilterState } from '@/types/chat';

interface SessionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
}

export function SessionFilters({
  filters,
  onFiltersChange,
}: SessionFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ search: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ status: value as FilterState['status'] });
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
      </div>
    </div>
  );
}
