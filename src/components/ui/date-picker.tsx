/**
 * Date Picker Component - Malaysian E-commerce Platform
 * Date selection with calendar popup, formatted for Malaysian dates
 */

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  otherDate?: Date; // For highlighting date ranges
  isStartDate?: boolean; // Whether this is the start date picker
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  otherDate,
  isStartDate = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Create date range for highlighting
  const dateRange = React.useMemo(() => {
    if (!date || !otherDate) {
      return undefined;
    }

    const startDate = isStartDate ? date : otherDate;
    const endDate = isStartDate ? otherDate : date;

    if (startDate && endDate && startDate <= endDate) {
      return { from: startDate, to: endDate };
    }
    return undefined;
  }, [date, otherDate, isStartDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'dd/MM/yyyy') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={selectedDate => {
            onDateChange(selectedDate);
            setOpen(false);
          }}
          disabled={date => date < new Date('1900-01-01')}
          modifiers={{
            range_start: dateRange?.from,
            range_end: dateRange?.to,
            range_middle: dateRange
              ? date => {
                  if (!dateRange.from || !dateRange.to) {
                    return false;
                  }
                  return date > dateRange.from && date < dateRange.to;
                }
              : undefined,
          }}
          modifiersClassNames={{
            range_start: 'bg-green-500 text-white hover:bg-green-600',
            range_end: 'bg-green-500 text-white hover:bg-green-600',
            range_middle: 'bg-green-100 text-green-900 hover:bg-green-200',
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
