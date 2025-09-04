'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Save,
  RotateCcw,
  Trash2,
  Plus,
  Clock,
  User,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Archive,
  Download,
  Eye,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface BackupRecord {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  size: number;
  version: string;
  metadata: {
    configurationHash: string;
    systemInfo: {
      nodeVersion: string;
      platform: string;
    };
    backupType: 'manual' | 'scheduled' | 'pre-update';
  };
}

interface BackupMetadata {
  totalBackups: number;
  totalSize: number;
  lastBackup: number | null;
  updatedAt: string;
}

export function BackupManager() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [metadata, setMetadata] = useState<BackupMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Create backup form state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  
  // Restore form state
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [preserveCurrent, setPreserveCurrent] = useState(true);
  const [preRestoreBackupName, setPreRestoreBackupName] = useState('');

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/telegram/backup');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        toast.error('Failed to load backups');
      }
    } catch (error) {
      toast.error('Error loading backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    if (!backupName.trim()) {
      toast.error('Backup name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/telegram/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: backupName,
          description: backupDescription,
          backupType: 'manual'
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Backup created successfully');
        setShowCreateDialog(false);
        setBackupName('');
        setBackupDescription('');
        loadBackups();
      } else {
        toast.error(result.error || 'Failed to create backup');
      }
    } catch (error) {
      toast.error('Error creating backup');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;

    setRestoring(selectedBackup.id);
    try {
      const response = await fetch('/api/admin/telegram/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupId: selectedBackup.id,
          preserveCurrentAsBackup: preserveCurrent,
          backupName: preRestoreBackupName || undefined
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Configuration restored successfully');
        setShowRestoreDialog(false);
        setSelectedBackup(null);
        setPreRestoreBackupName('');
        loadBackups();
      } else {
        toast.error(result.error || 'Failed to restore backup');
      }
    } catch (error) {
      toast.error('Error restoring backup');
    } finally {
      setRestoring(null);
    }
  };

  const deleteBackup = async (backupId: string) => {
    setDeleting(backupId);
    try {
      const response = await fetch(`/api/admin/telegram/backup?id=${backupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Backup deleted successfully');
        loadBackups();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete backup');
      }
    } catch (error) {
      toast.error('Error deleting backup');
    } finally {
      setDeleting(null);
    }
  };

  const downloadBackup = async (backup: BackupRecord) => {
    try {
      const response = await fetch(`/api/admin/telegram/backup?id=${backup.id}&data=true`);
      if (response.ok) {
        const backupData = await response.json();
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
          type: 'application/json' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${backup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_backup.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Backup downloaded');
      } else {
        toast.error('Failed to download backup');
      }
    } catch (error) {
      toast.error('Error downloading backup');
    }
  };

  const formatSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getBackupTypeIcon = (type: string) => {
    switch (type) {
      case 'manual': return <Save className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'pre-update': return <Shield className="w-4 h-4" />;
      default: return <Archive className="w-4 h-4" />;
    }
  };

  const getBackupTypeColor = (type: string) => {
    switch (type) {
      case 'manual': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'scheduled': return 'bg-green-100 text-green-700 border-green-300';
      case 'pre-update': return 'bg-amber-100 text-amber-700 border-amber-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading backups...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Backup Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <HardDrive className="w-5 h-5 mr-2" />
              Backup Overview
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Backup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Configuration Backup</DialogTitle>
                  <DialogDescription>
                    Create a backup of your current Telegram notification configuration.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="backup-name">Backup Name*</Label>
                    <Input
                      id="backup-name"
                      value={backupName}
                      onChange={(e) => setBackupName(e.target.value)}
                      placeholder="e.g., Production Config - Sept 2024"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backup-description">Description</Label>
                    <Textarea
                      id="backup-description"
                      value={backupDescription}
                      onChange={(e) => setBackupDescription(e.target.value)}
                      placeholder="Optional description of this backup..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createBackup} disabled={creating}>
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Create Backup
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{backups.length}</div>
              <div className="text-sm text-blue-700">Total Backups</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                {formatSize(backups.reduce((sum, backup) => sum + backup.size, 0))}
              </div>
              <div className="text-sm text-green-700">Total Size</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                {backups.length > 0 ? new Date(Math.max(...backups.map(b => new Date(b.createdAt).getTime()))).toLocaleDateString() : '-'}
              </div>
              <div className="text-sm text-purple-700">Latest Backup</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Backups</CardTitle>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No backups found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first backup to secure your configuration.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Backup
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium">{backup.name}</h4>
                        <Badge className={getBackupTypeColor(backup.metadata.backupType)}>
                          {getBackupTypeIcon(backup.metadata.backupType)}
                          <span className="ml-1">{backup.metadata.backupType}</span>
                        </Badge>
                      </div>
                      {backup.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {backup.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(backup.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{backup.createdBy}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HardDrive className="w-3 h-3" />
                          <span>{formatSize(backup.size)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setPreRestoreBackupName(`Current config backup - ${new Date().toLocaleString()}`);
                          setShowRestoreDialog(true);
                        }}
                        disabled={restoring === backup.id}
                      >
                        {restoring === backup.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBackup(backup.id)}
                        disabled={deleting === backup.id}
                      >
                        {deleting === backup.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Configuration</DialogTitle>
            <DialogDescription>
              This will replace your current configuration with the selected backup.
            </DialogDescription>
          </DialogHeader>
          {selectedBackup && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">{selectedBackup.name}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Created: {new Date(selectedBackup.createdAt).toLocaleString()}</p>
                  <p>By: {selectedBackup.createdBy}</p>
                  {selectedBackup.description && <p>Description: {selectedBackup.description}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="preserve-current"
                    checked={preserveCurrent}
                    onCheckedChange={setPreserveCurrent}
                  />
                  <Label htmlFor="preserve-current">
                    Create backup of current configuration before restoring
                  </Label>
                </div>

                {preserveCurrent && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="pre-restore-name">Backup name for current config</Label>
                    <Input
                      id="pre-restore-name"
                      value={preRestoreBackupName}
                      onChange={(e) => setPreRestoreBackupName(e.target.value)}
                      placeholder="Pre-restore backup name"
                    />
                  </div>
                )}
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This action will replace your current configuration. 
                  Make sure you have a backup if you want to preserve your current settings.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestoreDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={restoreBackup} 
              disabled={!selectedBackup || restoring === selectedBackup?.id}
            >
              {restoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore Configuration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Usage Notes */}
      <Alert>
        <Archive className="h-4 w-4" />
        <AlertDescription>
          <strong>Backup Management:</strong> Backups include your complete Telegram configuration 
          including bot tokens (encrypted), channel settings, and preferences. Regular backups are 
          recommended before making significant changes. Pre-update backups are created automatically 
          during restore operations.
        </AlertDescription>
      </Alert>
    </div>
  );
}