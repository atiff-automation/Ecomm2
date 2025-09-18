/**
 * Export Functionality Hook
 * Centralized export management with progress tracking
 */

import { useState, useCallback, useRef } from 'react';
import {
  ExportOptions,
  ExportJob,
  ExportProgress,
  UseExportReturn,
  DEFAULT_EXPORT_OPTIONS,
} from '@/types/chat';
import {
  validateExportOptions,
  generateExportFileName,
  handleApiError,
  STORAGE_KEYS,
  saveToLocalStorage,
  loadFromLocalStorage,
} from '@/utils/chat';

export const useExport = (): UseExportReturn => {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>(() =>
    loadFromLocalStorage(STORAGE_KEYS.EXPORT_HISTORY, [])
  );
  const [loading, setLoading] = useState(false);
  const progressIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Save export jobs to localStorage
  const saveExportJobs = useCallback((jobs: ExportJob[]) => {
    setExportJobs(jobs);
    saveToLocalStorage(STORAGE_KEYS.EXPORT_HISTORY, jobs);
  }, []);

  // Start progress tracking for an export job
  const startProgressTracking = useCallback((jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/admin/chat/export/progress/${jobId}`);
        if (!response.ok) {
          clearInterval(interval);
          progressIntervals.current.delete(jobId);
          return;
        }

        const progress: ExportProgress = await response.json();

        setExportJobs(prevJobs => {
          const updatedJobs = prevJobs.map(job =>
            job.id === jobId ? { ...job, progress } : job
          );
          saveToLocalStorage(STORAGE_KEYS.EXPORT_HISTORY, updatedJobs);
          return updatedJobs;
        });

        // Stop tracking if completed or failed
        if (progress.status === 'completed' || progress.status === 'failed') {
          clearInterval(interval);
          progressIntervals.current.delete(jobId);
        }
      } catch (error) {
        console.error('Error tracking export progress:', error);
        clearInterval(interval);
        progressIntervals.current.delete(jobId);
      }
    }, 2000); // Check every 2 seconds

    progressIntervals.current.set(jobId, interval);

    // Cleanup after 5 minutes to prevent memory leaks
    setTimeout(() => {
      if (progressIntervals.current.has(jobId)) {
        clearInterval(interval);
        progressIntervals.current.delete(jobId);
      }
    }, 5 * 60 * 1000);
  }, []);

  // Export single session
  const exportSession = useCallback(async (
    sessionId: string,
    options: Partial<ExportOptions> = {}
  ) => {
    const exportOptions: ExportOptions = {
      ...DEFAULT_EXPORT_OPTIONS,
      ...options,
      sessionIds: [sessionId],
      dateRange: options.dateRange || {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date(),
      },
    };

    // Validate options
    const validation = validateExportOptions(exportOptions);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/chat/export/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          options: exportOptions,
        }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.json();

      const newJob: ExportJob = {
        id: result.jobId,
        options: exportOptions,
        progress: {
          id: result.jobId,
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
          totalSessions: 1,
          processedSessions: 0,
        },
      };

      const updatedJobs = [newJob, ...exportJobs];
      saveExportJobs(updatedJobs);

      // Start tracking progress
      startProgressTracking(result.jobId);

      return result.jobId;
    } catch (error) {
      throw new Error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [exportJobs, saveExportJobs, startProgressTracking]);

  // Export multiple sessions
  const exportSessions = useCallback(async (options: ExportOptions) => {
    // Validate options
    const validation = validateExportOptions(options);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/chat/export/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const result = await response.json();

      const newJob: ExportJob = {
        id: result.jobId,
        options,
        progress: {
          id: result.jobId,
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
          totalSessions: options.sessionIds.length,
          processedSessions: 0,
        },
      };

      const updatedJobs = [newJob, ...exportJobs];
      saveExportJobs(updatedJobs);

      // Start tracking progress
      startProgressTracking(result.jobId);

      return result.jobId;
    } catch (error) {
      throw new Error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [exportJobs, saveExportJobs, startProgressTracking]);

  // Get export progress
  const getExportProgress = useCallback((jobId: string): ExportProgress | null => {
    const job = exportJobs.find(job => job.id === jobId);
    return job?.progress || null;
  }, [exportJobs]);

  // Cancel export
  const cancelExport = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/admin/chat/export/cancel/${jobId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Cancel failed: ${response.statusText}`);
      }

      // Clear progress tracking
      const interval = progressIntervals.current.get(jobId);
      if (interval) {
        clearInterval(interval);
        progressIntervals.current.delete(jobId);
      }

      // Update job status
      setExportJobs(prevJobs => {
        const updatedJobs = prevJobs.map(job =>
          job.id === jobId
            ? {
                ...job,
                progress: {
                  ...job.progress,
                  status: 'failed' as const,
                  error: 'Cancelled by user',
                },
              }
            : job
        );
        saveToLocalStorage(STORAGE_KEYS.EXPORT_HISTORY, updatedJobs);
        return updatedJobs;
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }, []);

  // Download export
  const downloadExport = useCallback((jobId: string) => {
    const job = exportJobs.find(job => job.id === jobId);
    if (!job || !job.progress.downloadUrl) {
      throw new Error('Export not ready for download');
    }

    // Create download link
    const link = document.createElement('a');
    link.href = job.progress.downloadUrl;
    link.download = generateExportFileName(
      job.options.format,
      job.options.sessionIds.length
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [exportJobs]);

  // Remove export job from history
  const removeExportJob = useCallback((jobId: string) => {
    // Clear progress tracking
    const interval = progressIntervals.current.get(jobId);
    if (interval) {
      clearInterval(interval);
      progressIntervals.current.delete(jobId);
    }

    const updatedJobs = exportJobs.filter(job => job.id !== jobId);
    saveExportJobs(updatedJobs);
  }, [exportJobs, saveExportJobs]);

  // Clear export history
  const clearExportHistory = useCallback(() => {
    // Clear all progress tracking
    progressIntervals.current.forEach(interval => clearInterval(interval));
    progressIntervals.current.clear();

    saveExportJobs([]);
  }, [saveExportJobs]);

  // Get export statistics
  const getExportStats = useCallback(() => {
    const totalExports = exportJobs.length;
    const completedExports = exportJobs.filter(job => job.progress.status === 'completed').length;
    const failedExports = exportJobs.filter(job => job.progress.status === 'failed').length;
    const inProgressExports = exportJobs.filter(
      job => job.progress.status === 'pending' || job.progress.status === 'processing'
    ).length;

    return {
      totalExports,
      completedExports,
      failedExports,
      inProgressExports,
      successRate: totalExports > 0 ? (completedExports / totalExports) * 100 : 0,
    };
  }, [exportJobs]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    progressIntervals.current.forEach(interval => clearInterval(interval));
    progressIntervals.current.clear();
  }, []);

  return {
    exportJobs,
    loading,
    exportSession,
    exportSessions,
    getExportProgress,
    cancelExport,
    downloadExport,
    removeExportJob,
    clearExportHistory,
    getExportStats,
    cleanup,

    // Helper methods
    getCompletedExports: () => exportJobs.filter(job => job.progress.status === 'completed'),
    getFailedExports: () => exportJobs.filter(job => job.progress.status === 'failed'),
    getInProgressExports: () => exportJobs.filter(
      job => job.progress.status === 'pending' || job.progress.status === 'processing'
    ),
  };
};