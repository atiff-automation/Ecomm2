/**
 * Application Filters Component
 * Advanced filtering interface for agent applications
 * Following CLAUDE.md principles: Centralized filter logic, systematic implementation
 */

'use client';

import React, { useState } from 'react';
import { ApplicationFilters as ApplicationFiltersType } from '@/types/agent-application';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Filter, RotateCcw } from 'lucide-react';

interface ApplicationFiltersProps {
  filters: ApplicationFiltersType;
  onApply: (filters: Partial<ApplicationFiltersType>) => void;
  onReset: () => void;
}

export function ApplicationFilters({ filters, onApply, onReset }: ApplicationFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ApplicationFiltersType>(filters);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters: ApplicationFiltersType = {
      page: 1,
      limit: 10,
      status: undefined,
      search: '',
      hasJrmExp: undefined,
      dateFrom: undefined,
      dateTo: undefined
    };
    setLocalFilters(resetFilters);
    onReset();
  };

  const updateFilter = (key: keyof ApplicationFiltersType, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <span>Penapis Lanjutan</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Experience Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Pengalaman</Label>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasJrmExp"
                  checked={localFilters.hasJrmExp === true}
                  onCheckedChange={(checked) =>
                    updateFilter('hasJrmExp', checked ? true : undefined)
                  }
                />
                <Label htmlFor="hasJrmExp" className="text-sm">
                  Ada Pengalaman JRM
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="noJrmExp"
                  checked={localFilters.hasJrmExp === false}
                  onCheckedChange={(checked) =>
                    updateFilter('hasJrmExp', checked ? false : undefined)
                  }
                />
                <Label htmlFor="noJrmExp" className="text-sm">
                  Tiada Pengalaman JRM
                </Label>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Tarikh Permohonan</Label>

            <div className="space-y-2">
              <div>
                <Label htmlFor="dateFrom" className="text-xs text-gray-500">
                  Dari
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="dateTo" className="text-xs text-gray-500">
                  Hingga
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={localFilters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Results per page */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Bilangan Per Halaman</Label>

            <Select
              value={localFilters.limit?.toString() || '10'}
              onValueChange={(value) => updateFilter('limit', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per halaman</SelectItem>
                <SelectItem value="10">10 per halaman</SelectItem>
                <SelectItem value="25">25 per halaman</SelectItem>
                <SelectItem value="50">50 per halaman</SelectItem>
                <SelectItem value="100">100 per halaman</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Penapis Pantas</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                updateFilter('dateFrom', lastWeek.toISOString().split('T')[0]);
                updateFilter('dateTo', today.toISOString().split('T')[0]);
              }}
            >
              7 Hari Lepas
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                updateFilter('dateFrom', lastMonth.toISOString().split('T')[0]);
                updateFilter('dateTo', today.toISOString().split('T')[0]);
              }}
            >
              30 Hari Lepas
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                updateFilter('dateFrom', startOfMonth.toISOString().split('T')[0]);
                updateFilter('dateTo', today.toISOString().split('T')[0]);
              }}
            >
              Bulan Ini
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter('hasJrmExp', true)}
            >
              Dengan Pengalaman JRM
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter('status', 'SUBMITTED')}
            >
              Perlu Semakan
            </Button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(localFilters.hasJrmExp !== undefined ||
          localFilters.dateFrom ||
          localFilters.dateTo) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Penapis Aktif:</p>
              <ul className="list-disc list-inside space-y-1">
                {localFilters.hasJrmExp !== undefined && (
                  <li>
                    Pengalaman JRM: {localFilters.hasJrmExp ? 'Ada' : 'Tiada'}
                  </li>
                )}
                {localFilters.dateFrom && (
                  <li>
                    Dari: {new Date(localFilters.dateFrom).toLocaleDateString('ms-MY')}
                  </li>
                )}
                {localFilters.dateTo && (
                  <li>
                    Hingga: {new Date(localFilters.dateTo).toLocaleDateString('ms-MY')}
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleApply}>
            <Filter className="w-4 h-4 mr-2" />
            Terapkan Penapis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}