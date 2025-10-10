'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { ORDER_DATE_FILTERS } from '@/lib/constants/order';
import type { ExportDialogProps, ExportOptions, ExportFormat } from './types';

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  currentFilters,
  isExporting = false,
}: ExportDialogProps) {
  // Form state - controlled components
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [datePreset, setDatePreset] = useState('last-30-days');
  const [includeCustomerDetails, setIncludeCustomerDetails] = useState(true);
  const [includeShippingAddress, setIncludeShippingAddress] = useState(true);
  const [includeItemsBreakdown, setIncludeItemsBreakdown] = useState(true);

  const handleExport = async () => {
    // Get date range from preset
    const preset = ORDER_DATE_FILTERS.find(f => f.id === datePreset);
    const dateRange = preset?.getValue();

    const options: ExportOptions = {
      format,
      dateFrom: dateRange?.from || currentFilters?.dateFrom,
      dateTo: dateRange?.to || currentFilters?.dateTo,
      status: currentFilters?.status,
      includeCustomerDetails,
      includeShippingAddress,
      includeItemsBreakdown,
    };

    await onExport(options);

    // Reset form and close
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormat('csv');
    setDatePreset('last-30-days');
    setIncludeCustomerDetails(true);
    setIncludeShippingAddress(true);
    setIncludeItemsBreakdown(true);
  };

  const handleClose = () => {
    if (!isExporting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Orders</DialogTitle>
          <DialogDescription>
            Choose export format and customize which data to include
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4" role="form" aria-label="Export options">
          {/* Date Range Selection */}
          <div className="space-y-2">
            <Label htmlFor="export-date-range">Date Range</Label>
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger
                id="export-date-range"
                aria-label="Select date range for export"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_DATE_FILTERS.filter(f => f.id !== 'custom').map(
                  preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={value => setFormat(value as ExportFormat)}
              aria-label="Select export format"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="format-csv" />
                <Label
                  htmlFor="format-csv"
                  className="font-normal cursor-pointer"
                >
                  CSV (.csv) - Compatible with Excel, Google Sheets
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="format-excel" />
                <Label
                  htmlFor="format-excel"
                  className="font-normal cursor-pointer"
                >
                  Excel (.xlsx) - Microsoft Excel format
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="format-pdf" />
                <Label
                  htmlFor="format-pdf"
                  className="font-normal cursor-pointer"
                >
                  PDF (.pdf) - Printable document
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-customer"
                  checked={includeCustomerDetails}
                  onCheckedChange={checked =>
                    setIncludeCustomerDetails(!!checked)
                  }
                />
                <Label
                  htmlFor="include-customer"
                  className="font-normal cursor-pointer"
                >
                  Customer Details (name, email, phone)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-shipping"
                  checked={includeShippingAddress}
                  onCheckedChange={checked =>
                    setIncludeShippingAddress(!!checked)
                  }
                />
                <Label
                  htmlFor="include-shipping"
                  className="font-normal cursor-pointer"
                >
                  Shipping Address
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-items"
                  checked={includeItemsBreakdown}
                  onCheckedChange={checked =>
                    setIncludeItemsBreakdown(!!checked)
                  }
                />
                <Label
                  htmlFor="include-items"
                  className="font-normal cursor-pointer"
                >
                  Items Breakdown (products, quantities, prices)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isExporting}
            aria-label="Cancel export"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            aria-label="Download export file"
          >
            {isExporting && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            {isExporting ? 'Exporting...' : 'Download Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
