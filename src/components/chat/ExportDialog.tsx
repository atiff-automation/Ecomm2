/**
 * ExportDialog Component
 * Enhanced export UI with progress tracking following plan specification
 * Following @CLAUDE.md approach with centralized architecture
 */

'use client';

import React, { useState } from 'react';
import { Download, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import type { ExportOptions, ExportProgress } from '@/types/chat';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  selectedSessions: string[];
  defaultOptions?: Partial<ExportOptions>;
}

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  selectedSessions,
  defaultOptions = {},
}: ExportDialogProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    sessionIds: selectedSessions,
    dateRange: {
      from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      to: new Date(),
    },
    includeMetadata: true,
    autoArchive: false,
    ...defaultOptions,
  });

  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress({
        id: Date.now().toString(),
        status: 'processing',
        progress: 0,
      });

      // Simulate progress updates (in real implementation, this would come from the API)
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (!prev || prev.progress >= 90) return prev;
          return {
            ...prev,
            progress: prev.progress + 10,
          };
        });
      }, 200);

      await onExport(exportOptions);

      clearInterval(progressInterval);
      setExportProgress(prev =>
        prev
          ? {
              ...prev,
              status: 'completed',
              progress: 100,
            }
          : null
      );

      // Auto-close after successful export
      setTimeout(() => {
        onClose();
        setExportProgress(null);
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportProgress(prev =>
        prev
          ? {
              ...prev,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Export failed',
            }
          : null
      );
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusIcon = (status: ExportProgress['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: ExportProgress['status']) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Export Chat Sessions</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isExporting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Export Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Sessions: {selectedSessions.length}</div>
              <div>Format: {exportOptions.format.toUpperCase()}</div>
              <div>
                Include Messages: {exportOptions.includeMetadata ? 'Yes' : 'No'}
              </div>
              {exportOptions.autoArchive && (
                <div className="text-orange-600">
                  ⚠️ Sessions will be archived after export
                </div>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export Format
              </label>
              <select
                value={exportOptions.format}
                onChange={e =>
                  setExportOptions(prev => ({
                    ...prev,
                    format: e.target.value as 'pdf' | 'csv' | 'json',
                  }))
                }
                disabled={isExporting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="json">JSON (Complete Data)</option>
                <option value="csv">CSV (Session Metadata)</option>
                <option value="pdf">PDF (Summary Report)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeMetadata"
                checked={exportOptions.includeMetadata}
                onChange={e =>
                  setExportOptions(prev => ({
                    ...prev,
                    includeMetadata: e.target.checked,
                  }))
                }
                disabled={isExporting}
                className="rounded"
              />
              <label
                htmlFor="includeMetadata"
                className="text-sm text-gray-700"
              >
                Include chat messages and metadata
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoArchive"
                checked={exportOptions.autoArchive}
                onChange={e =>
                  setExportOptions(prev => ({
                    ...prev,
                    autoArchive: e.target.checked,
                  }))
                }
                disabled={isExporting}
                className="rounded"
              />
              <label htmlFor="autoArchive" className="text-sm text-gray-700">
                Archive sessions after export
              </label>
            </div>
          </div>

          {/* Progress Indicator */}
          {exportProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(exportProgress.status)}
                  <span className="text-sm font-medium">
                    {exportProgress.status === 'processing' && 'Exporting...'}
                    {exportProgress.status === 'completed' && 'Export Complete'}
                    {exportProgress.status === 'failed' && 'Export Failed'}
                  </span>
                </div>
                <Badge className={getStatusColor(exportProgress.status)}>
                  {exportProgress.status}
                </Badge>
              </div>

              {exportProgress.status === 'processing' && (
                <Progress value={exportProgress.progress} className="w-full" />
              )}

              {exportProgress.error && (
                <div className="text-sm text-red-600 mt-2">
                  {exportProgress.error}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedSessions.length === 0}
            >
              {isExporting ? 'Exporting...' : 'Start Export'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
