/**
 * Data Export Date Range Picker Component
 * Based on the promotional date picker but customized for data export functionality
 */

'use client';

import * as React from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DataExportDatePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function DataExportDatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = 'Select export date range',
  disabled = false,
  className,
}: DataExportDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

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

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      onStartDateChange(date);
      onEndDateChange(undefined);
    } else if (startDate && !endDate) {
      // Set end date
      if (date >= startDate) {
        onEndDateChange(date);
        // Keep calendar open after selecting end date for user review
      } else {
        // If selected date is before start date, make it the new start date
        onStartDateChange(date);
        onEndDateChange(undefined);
      }
    }
  };

  const isInRange = (date: Date) => {
    if (!startDate || !endDate) {
      return false;
    }
    return date >= startDate && date <= endDate;
  };

  const isRangeStart = (date: Date) => {
    return startDate && isSameDay(date, startDate);
  };

  const isRangeEnd = (date: Date) => {
    return endDate && isSameDay(date, endDate);
  };

  const getDayClassName = (date: Date) => {
    const baseClass =
      'h-9 w-9 p-0 font-normal text-sm hover:bg-blue-100 cursor-pointer flex items-center justify-center rounded';

    if (isToday(date)) {
      return cn(
        baseClass,
        'bg-blue-100 text-blue-900 font-semibold border border-blue-400'
      );
    }

    if (isRangeStart(date) || isRangeEnd(date)) {
      return cn(baseClass, 'bg-green-500 text-white hover:bg-green-600');
    }

    if (isInRange(date)) {
      return cn(baseClass, 'bg-green-100 text-green-900 hover:bg-green-200');
    }

    if (!isSameMonth(date, currentMonth)) {
      return cn(baseClass, 'text-gray-400 hover:bg-gray-100');
    }

    return cn(baseClass, 'text-gray-900 hover:bg-gray-100');
  };

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay())); // End on Saturday

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(monthDate, 1))}
            className="p-1 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {MONTH_NAMES[monthDate.getMonth()]} {monthDate.getFullYear()}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(monthDate, 1))}
            className="p-1 hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="h-9 w-9 flex items-center justify-center text-sm font-medium text-gray-600"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, dayIdx) => (
            <button
              key={dayIdx}
              type="button"
              onClick={() => handleDateClick(day)}
              className={getDayClassName(day)}
            >
              {day.getDate()}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const getDaysCount = () => {
    if (!startDate || !endDate) {
      return null;
    }
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
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
        <div className="flex">
          {renderMonth(currentMonth)}
          {renderMonth(addMonths(currentMonth, 1))}
        </div>

        {/* Footer with export period info */}
        <div className="p-3 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">
                {startDate && endDate ? 'Export Period' : 'Select export period'}
              </span>
            </div>
            {getDaysCount() && (
              <span className="font-medium text-gray-900">
                {getDaysCount()} days
              </span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}