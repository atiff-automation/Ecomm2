/**
 * Data Management Dashboard
 * Centralized data operations interface
 * Following standard AdminPageLayout pattern for consistency
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataExportDatePicker } from '@/components/ui/data-export-date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  CalendarIcon,
  DownloadIcon,
  TrashIcon,
  DatabaseIcon,
  FileIcon,
  PlayIcon,
  Square,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { AdminPageLayout, TabConfig } from '@/components/admin/layout';

interface BackupFile {
  id: string;
  filename: string;
  month: number;
  year: number;
  createdAt: string;
  fileSize: string;
  sessionCount: number;
  status: string;
}

interface CleanupStats {
  totalSessions: number;
  totalMessages: number;
  sessionsAtRisk: number;
  messagesAtRisk: number;
  nextCleanupDate?: string;
  config: {
    retentionDays: number;
    gracePeriodDays: number;
    autoDeleteEnabled: boolean;
    backupEnabled: boolean;
  };
}

interface JobDefinition {
  name: string;
  description: string;
  cron: string;
  timezone: string;
}

interface JobStatus {
  isRunning: boolean;
  scheduledJobs: string[];
  jobDefinitions: Record<string, JobDefinition>;
}

export default function DataManagementPage() {
  const [exportStartDate, setExportStartDate] = useState<Date>();
  const [exportEndDate, setExportEndDate] = useState<Date>();
  const [exportFormat, setExportFormat] = useState<string>('json');
  const [isExporting, setIsExporting] = useState(false);

  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null);
  const [isLoadingCleanup, setIsLoadingCleanup] = useState(false);

  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  useEffect(() => {
    fetchBackupFiles();
    fetchCleanupStats();
    fetchJobStatus();
  }, []);

  const fetchBackupFiles = async () => {
    setIsLoadingBackups(true);
    try {
      const response = await fetch('/api/admin/chat/backups');
      const data = await response.json();

      if (data.success) {
        setBackupFiles(data.backups);
      } else {
        toast.error('Failed to load backup files');
      }
    } catch {
      toast.error('Failed to load backup files');
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const fetchCleanupStats = async () => {
    setIsLoadingCleanup(true);
    try {
      const response = await fetch('/api/admin/chat/cleanup');
      const data = await response.json();

      if (data.success) {
        setCleanupStats(data.stats);
      } else {
        toast.error('Failed to load cleanup stats');
      }
    } catch {
      toast.error('Failed to load cleanup stats');
    } finally {
      setIsLoadingCleanup(false);
    }
  };

  const fetchJobStatus = async () => {
    setIsLoadingJobs(true);
    try {
      const response = await fetch('/api/admin/chat/jobs');
      const data = await response.json();

      if (data.success) {
        setJobStatus(data.status);
      } else {
        toast.error('Failed to load job status');
      }
    } catch {
      toast.error('Failed to load job status');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const handleDateExport = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (exportStartDate > exportEndDate) {
      toast.error('Start date must be before end date');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/chat/export/date-range', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: exportStartDate.toISOString(),
          endDate: exportEndDate.toISOString(),
          format: exportFormat,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          response.headers
            .get('Content-Disposition')
            ?.split('filename=')[1]
            ?.replace(/"/g, '') || `chat-export.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Export completed successfully');
      } else {
        const errorData = await response.json();
        toast.error(`Export failed: ${errorData.error}`);
      }
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;

    setIsCreatingBackup(true);
    try {
      const response = await fetch('/api/admin/chat/backups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year, month }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Backup created successfully');
        fetchBackupFiles();
      } else {
        toast.error(`Backup failed: ${data.error}`);
      }
    } catch {
      toast.error('Backup creation failed');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/admin/chat/backups/${filename}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Backup downloaded successfully');
      } else {
        toast.error('Failed to download backup');
      }
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDeleteBackup = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/chat/backups?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Backup deleted successfully');
        fetchBackupFiles();
      } else {
        toast.error(`Delete failed: ${data.error}`);
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleRunCleanup = async () => {
    try {
      const response = await fetch('/api/admin/chat/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'scheduled' }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Cleanup completed: ${data.result.deletedSessionsCount} sessions and ${data.result.deletedMessagesCount} messages deleted`
        );
        fetchCleanupStats();
      } else {
        toast.error(`Cleanup failed: ${data.error}`);
      }
    } catch {
      toast.error('Cleanup failed');
    }
  };

  const handleJobAction = async (action: string, jobName?: string) => {
    try {
      const response = await fetch('/api/admin/chat/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, jobName }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchJobStatus();
      } else {
        toast.error(`Action failed: ${data.error}`);
      }
    } catch {
      toast.error('Action failed');
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes, 10);
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Tab configuration for chat navigation - consistent across all chat pages
  const chatTabs: TabConfig[] = [
    {
      id: 'sessions',
      label: 'Sessions',
      href: '/admin/chat',
    },
    {
      id: 'configuration',
      label: 'Configuration',
      href: '/admin/chat/config',
    },
    {
      id: 'operations',
      label: 'Operations',
      href: '/admin/chat/operations',
    },
    {
      id: 'archive',
      label: 'Data Management',
      href: '/admin/chat/archive',
    },
  ];

  return (
    <AdminPageLayout
      title="Chat Management"
      subtitle="Monitor and manage customer chat interactions"
      tabs={chatTabs}
      loading={isLoadingBackups || isLoadingCleanup || isLoadingJobs}
    >
      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">Data Export</TabsTrigger>
          <TabsTrigger value="backups">Backup Management</TabsTrigger>
          <TabsTrigger value="cleanup">Data Cleanup</TabsTrigger>
          <TabsTrigger value="jobs">Scheduled Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DownloadIcon className="h-5 w-5" />
                Date Range Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Export Date Range</label>
                  <DataExportDatePicker
                    startDate={exportStartDate}
                    endDate={exportEndDate}
                    onStartDateChange={setExportStartDate}
                    onEndDateChange={setExportEndDate}
                    placeholder="Select export date range"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              <Button
                onClick={handleDateExport}
                disabled={isExporting || !exportStartDate || !exportEndDate}
                className="w-full"
              >
                {isExporting ? (
                  <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DownloadIcon className="mr-2 h-4 w-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DatabaseIcon className="h-5 w-5" />
                  Backup Files
                </div>
                <Button
                  onClick={handleCreateBackup}
                  disabled={isCreatingBackup}
                >
                  {isCreatingBackup ? (
                    <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <DatabaseIcon className="mr-2 h-4 w-4" />
                  )}
                  Create Backup
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBackups ? (
                <div className="flex justify-center py-8">
                  <RefreshCwIcon className="h-6 w-6 animate-spin" />
                </div>
              ) : backupFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No backup files found
                </div>
              ) : (
                <div className="space-y-2">
                  {backupFiles.map(backup => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{backup.filename}</div>
                          <div className="text-sm text-muted-foreground">
                            {backup.year}-
                            {backup.month.toString().padStart(2, '0')} •
                            {backup.sessionCount} sessions •
                            {formatFileSize(backup.fileSize)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            backup.status === 'completed'
                              ? 'success'
                              : 'destructive'
                          }
                        >
                          {backup.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadBackup(backup.filename)}
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete backup?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the backup file{' '}
                                {backup.filename}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteBackup(backup.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangleIcon className="h-5 w-5" />
                  Data Retention Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCleanup ? (
                  <div className="flex justify-center py-8">
                    <RefreshCwIcon className="h-6 w-6 animate-spin" />
                  </div>
                ) : cleanupStats ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-2xl font-bold">
                          {cleanupStats.totalSessions.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Sessions
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {cleanupStats.totalMessages.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Messages
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {cleanupStats.sessionsAtRisk.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Sessions at Risk
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {cleanupStats.messagesAtRisk.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Messages at Risk
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-sm space-y-1">
                        <div>
                          Retention: {cleanupStats.config.retentionDays} days
                        </div>
                        <div>
                          Grace Period: {cleanupStats.config.gracePeriodDays}{' '}
                          days
                        </div>
                        <div className="flex items-center gap-2">
                          Auto Delete:
                          {cleanupStats.config.autoDeleteEnabled ? (
                            <Badge variant="success">Enabled</Badge>
                          ) : (
                            <Badge variant="destructive">Disabled</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Failed to load cleanup stats
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrashIcon className="h-5 w-5" />
                  Manual Cleanup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Run cleanup manually according to the current retention
                  policy.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Run Cleanup Now
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Run data cleanup?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete {cleanupStats?.sessionsAtRisk || 0}{' '}
                        sessions and {cleanupStats?.messagesAtRisk || 0}{' '}
                        messages that are older than the retention policy. This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRunCleanup}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Run Cleanup
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  variant="outline"
                  onClick={fetchCleanupStats}
                  className="w-full"
                >
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Refresh Stats
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  Scheduled Jobs
                </div>
                <div className="flex items-center gap-2">
                  {jobStatus?.isRunning ? (
                    <Badge variant="success">Running</Badge>
                  ) : (
                    <Badge variant="destructive">Stopped</Badge>
                  )}
                  <Button
                    onClick={() =>
                      handleJobAction(jobStatus?.isRunning ? 'stop' : 'start')
                    }
                    variant={jobStatus?.isRunning ? 'destructive' : 'default'}
                    size="sm"
                  >
                    {jobStatus?.isRunning ? (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        Stop Scheduler
                      </>
                    ) : (
                      <>
                        <PlayIcon className="mr-2 h-4 w-4" />
                        Start Scheduler
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingJobs ? (
                <div className="flex justify-center py-8">
                  <RefreshCwIcon className="h-6 w-6 animate-spin" />
                </div>
              ) : jobStatus ? (
                <div className="space-y-4">
                  {Object.entries(jobStatus.jobDefinitions).map(
                    ([key, job]: [string, JobDefinition]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{job.description}</div>
                          <div className="text-sm text-muted-foreground">
                            Schedule: {job.cron} ({job.timezone})
                          </div>
                        </div>
                        <Button
                          onClick={() => handleJobAction('run', job.name)}
                          variant="outline"
                          size="sm"
                        >
                          <PlayIcon className="mr-2 h-4 w-4" />
                          Run Now
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Failed to load job status
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
