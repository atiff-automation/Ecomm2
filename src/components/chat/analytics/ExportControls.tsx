/**
 * Analytics Export Controls Component
 * Following @CLAUDE.md DRY principles - centralized export functionality
 * Provides export controls and progress tracking for analytics data
 */

'use client';

import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Table, 
  Code, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Calendar,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ReportConfig, AnalyticsExportData } from '@/types/chat';

interface ExportControlsProps {
  onExport: (config: ReportConfig) => Promise<AnalyticsExportData>;
  timeRange: string;
  disabled?: boolean;
  className?: string;
}

interface ExportJob {
  id: string;
  config: ReportConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export function ExportControls({ 
  onExport, 
  timeRange, 
  disabled = false,
  className = '' 
}: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  const formatOptions = [
    { 
      value: 'pdf' as const, 
      label: 'PDF Report', 
      icon: FileText,
      description: 'Formatted report with charts and summary'
    },
    { 
      value: 'csv' as const, 
      label: 'CSV Data', 
      icon: Table,
      description: 'Raw data for external analysis'
    },
    { 
      value: 'json' as const, 
      label: 'JSON Data', 
      icon: Code,
      description: 'Structured data for API integration'
    }
  ];

  const handleQuickExport = async (format: 'pdf' | 'csv' | 'json') => {
    if (isExporting || disabled) return;

    const config: ReportConfig = {
      title: `Chat Analytics Report - ${timeRange}`,
      timeRange,
      includeCharts: format === 'pdf',
      includeSummary: true,
      includeDetails: true,
      format,
    };

    await handleExport(config);
  };

  const handleCustomExport = async () => {
    if (isExporting || disabled) return;

    const config: ReportConfig = {
      title: `Custom Analytics Report - ${timeRange}`,
      timeRange,
      includeCharts: selectedFormat === 'pdf',
      includeSummary: true,
      includeDetails: true,
      format: selectedFormat,
    };

    await handleExport(config);
  };

  const handleExport = async (config: ReportConfig) => {
    const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newJob: ExportJob = {
      id: jobId,
      config,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };

    setExportJobs(prev => [newJob, ...prev]);
    setIsExporting(true);

    try {
      // Update job status to processing
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'processing' as const, progress: 25 }
          : job
      ));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportJobs(prev => prev.map(job => 
          job.id === jobId && job.progress < 90
            ? { ...job, progress: job.progress + 10 }
            : job
        ));
      }, 200);

      // Perform actual export
      const exportData = await onExport(config);

      clearInterval(progressInterval);

      // Create download blob and URL
      const blob = new Blob([exportData.content], { type: exportData.mimeType });
      const downloadUrl = URL.createObjectURL(blob);

      // Update job to completed
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'completed' as const, 
              progress: 100,
              downloadUrl,
              completedAt: new Date()
            }
          : job
      ));

      // Auto-download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = exportData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Export failed:', error);
      
      setExportJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'failed' as const, 
              error: error instanceof Error ? error.message : 'Export failed'
            }
          : job
      ));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = (job: ExportJob) => {
    if (job.downloadUrl) {
      const link = document.createElement('a');
      link.href = job.downloadUrl;
      link.download = `${job.config.title}.${job.config.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Export Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Export</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {formatOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant="outline"
                onClick={() => handleQuickExport(option.value)}
                disabled={disabled || isExporting}
                className="flex flex-col items-center p-4 h-auto"
              >
                <Icon className="h-5 w-5 mb-2" />
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-gray-500 text-center mt-1">
                  {option.description}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Custom Export */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Custom Export</h3>
        
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={handleCustomExport}
            disabled={disabled || isExporting}
          >
            <Settings className="h-4 w-4 mr-2" />
            Export with Options
          </Button>
        </div>
      </div>

      {/* Export Jobs History */}
      {exportJobs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Exports</h3>
          
          <div className="space-y-3">
            {exportJobs.slice(0, 5).map((job) => (
              <div 
                key={job.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {job.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {job.status === 'failed' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {job.status === 'processing' && (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  )}
                  {job.status === 'pending' && (
                    <Calendar className="h-5 w-5 text-gray-400" />
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {job.config.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {job.config.format.toUpperCase()} • {job.createdAt.toLocaleTimeString()}
                      {job.status === 'processing' && ` • ${job.progress}%`}
                      {job.status === 'failed' && job.error && ` • ${job.error}`}
                    </p>
                  </div>
                </div>
                
                {job.status === 'completed' && job.downloadUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(job)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExportControls;