/**
 * Date Range Picker Component - Malaysian E-commerce Platform
 * Single interface for selecting start and end dates with range highlighting
 */

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = 'Select date range',
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Create date range for the calendar
  const dateRange: DateRange | undefined = React.useMemo(() => {
    if (!startDate && !endDate) return undefined;
    return {
      from: startDate,
      to: endDate,
    };
  }, [startDate, endDate]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onStartDateChange(undefined);
      onEndDateChange(undefined);
      return;
    }

    onStartDateChange(range.from);
    onEndDateChange(range.to);

    // Close popup when both dates are selected
    if (range.from && range.to) {
      setOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!startDate && !endDate) {
      return placeholder;
    }

    if (startDate && !endDate) {
      return `${format(startDate, 'dd/MM/yyyy')} - Select end date`;
    }

    if (!startDate && endDate) {
      return `Select start date - ${format(endDate, 'dd/MM/yyyy')}`;
    }

    if (startDate && endDate) {
      return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
    }

    return placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !startDate && !endDate && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={startDate || new Date()}
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={2}
          disabled={date => date < new Date('1900-01-01')}
          classNames={{
            day_selected:
              'bg-green-500 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white',
            day_range_start:
              'bg-green-500 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white',
            day_range_end:
              'bg-green-500 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white',
            day_range_middle:
              'bg-green-100 text-green-900 hover:bg-green-200 hover:text-green-900',
            day_today: 'bg-blue-100 text-blue-900 font-semibold',
          }}
        />

        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Promotion Period</span>
            </div>
            {startDate && endDate && (
              <span className="font-medium text-gray-900">
                {Math.ceil(
                  (endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1}{' '}
                days
              </span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
