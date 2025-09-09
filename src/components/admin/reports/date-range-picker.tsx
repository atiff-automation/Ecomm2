/**
 * Date Range Picker Component
 * Simple date range selection using native HTML date inputs
 * Note: In production, consider using a library like react-day-picker for better UX
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar, X } from 'lucide-react';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(
    value.startDate.toISOString().split('T')[0]
  );
  const [tempEndDate, setTempEndDate] = useState(
    value.endDate.toISOString().split('T')[0]
  );

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysDifference = () => {
    const diffTime = Math.abs(value.endDate.getTime() - value.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const applyDateRange = () => {
    const startDate = new Date(tempStartDate);
    const endDate = new Date(tempEndDate);
    
    if (startDate >= endDate) {
      alert('Start date must be before end date');
      return;
    }

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);
    
    onChange({ startDate, endDate });
    setIsOpen(false);
  };

  const setQuickRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);
    
    onChange({ startDate, endDate });
    setIsOpen(false);
  };

  const resetToTemp = () => {
    setTempStartDate(value.startDate.toISOString().split('T')[0]);
    setTempEndDate(value.endDate.toISOString().split('T')[0]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="justify-start text-left font-normal w-auto"
          onClick={() => {
            resetToTemp();
            setIsOpen(true);
          }}
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">
            {formatDisplayDate(value.startDate)} - {formatDisplayDate(value.endDate)}
          </span>
          <span className="sm:hidden">
            {getDaysDifference()}d range
          </span>
          <Badge variant="secondary" className="ml-2">
            {getDaysDifference()} days
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Select Date Range</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Range Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(7)}
            >
              Last 7 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(30)}
            >
              Last 30 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(90)}
            >
              Last 90 days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickRange(365)}
            >
              Last year
            </Button>
          </div>

          {/* Custom Date Inputs */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="start-date" className="text-sm font-medium">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                max={tempEndDate}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="end-date" className="text-sm font-medium">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                min={tempStartDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Date Range Preview */}
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            <div>Preview:</div>
            <div className="font-medium">
              {new Date(tempStartDate).toLocaleDateString('en-MY')} - {' '}
              {new Date(tempEndDate).toLocaleDateString('en-MY')}
            </div>
            <div>
              Duration: {Math.ceil((new Date(tempEndDate).getTime() - new Date(tempStartDate).getTime()) / (1000 * 60 * 60 * 24))} days
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex justify-between space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={applyDateRange}
              disabled={!tempStartDate || !tempEndDate}
            >
              Apply Range
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}