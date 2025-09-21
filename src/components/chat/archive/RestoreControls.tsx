/**
 * Restore Controls Component
 * Following @CLAUDE.md DRY principles - centralized restore functionality
 * Provides restore controls and validation for archived sessions
 */

'use client';

import React, { useState } from 'react';
import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database,
  User,
  MessageSquare,
  FileText,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RestoreOperation, RestorePreview, RestoreValidation, RestoreTransaction } from '@/types/chat';

interface RestoreControlsProps {
  selectedSessions: string[];
  onRestore: (operation: RestoreOperation) => void;
  onPreview: (sessionIds: string[]) => void;
  disabled?: boolean;
}

interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionIds: string[];
  onRestore: (operation: RestoreOperation) => void;
}

interface RestorePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previews: RestorePreview[];
  onConfirmRestore: (operation: RestoreOperation) => void;
}

function RestoreDialog({ open, onOpenChange, sessionIds, onRestore }: RestoreDialogProps) {
  const [restoreToStatus, setRestoreToStatus] = useState<string>('ended');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRestore = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const operation: RestoreOperation = {
        sessionIds,
        reason: reason.trim() || undefined,
        restoreToStatus: restoreToStatus || undefined,
      };

      onRestore(operation);
      onOpenChange(false);
      setReason('');
      setRestoreToStatus('ended');
    } catch (error) {
      console.error('Restore failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Restore Archived Sessions</h3>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-3">
              You are about to restore {sessionIds.length} session{sessionIds.length !== 1 ? 's' : ''}.
            </p>
          </div>

          {/* Restore Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restore to Status
            </label>
            <Select value={restoreToStatus} onValueChange={setRestoreToStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ended">Ended (Default)</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the status for restored sessions
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Restoration (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter reason for restoring these sessions..."
            />
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Important Notes:</p>
                <ul className="mt-1 text-yellow-700 space-y-1">
                  <li>• Restored sessions will be visible in the main Sessions tab</li>
                  <li>• All messages and metadata will be preserved</li>
                  <li>• This action cannot be easily undone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRestore}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore Sessions
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RestorePreviewDialog({ 
  open, 
  onOpenChange, 
  previews, 
  onConfirmRestore 
}: RestorePreviewDialogProps) {
  const [restoreToStatus, setRestoreToStatus] = useState<string>('ended');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    const operation: RestoreOperation = {
      sessionIds: previews.map(p => p.sessionId),
      reason: reason.trim() || undefined,
      restoreToStatus: restoreToStatus || undefined,
    };
    onConfirmRestore(operation);
    onOpenChange(false);
  };

  if (!open || !previews.length) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Restore Preview</h3>
        
        <div className="space-y-6">
          {/* Preview Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Session ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Messages
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data Integrity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Est. Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previews.map((preview) => (
                  <tr key={preview.sessionId}>
                    <td className="px-4 py-3 text-sm font-mono">
                      {preview.sessionId.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {preview.userInfo}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-1 text-gray-400" />
                        {preview.messageCount}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          {preview.dataIntegrityChecks.messagesIntact ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className="text-xs">Messages</span>
                        </div>
                        <div className="flex items-center">
                          {preview.dataIntegrityChecks.metadataIntact ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className="text-xs">Metadata</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {preview.estimatedRestoreTime}s
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restore to Status
              </label>
              <Select value={restoreToStatus} onValueChange={setRestoreToStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ended">Ended (Default)</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Restoration reason..."
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Restore Summary:</p>
                <p className="mt-1 text-blue-700">
                  {previews.length} session{previews.length !== 1 ? 's' : ''} will be restored.
                  Total estimated time: {previews.reduce((sum, p) => sum + p.estimatedRestoreTime, 0)} seconds.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Confirm Restore
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RestoreControls({ 
  selectedSessions, 
  onRestore, 
  onPreview, 
  disabled = false 
}: RestoreControlsProps) {
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previews, setPreviews] = useState<RestorePreview[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleQuickRestore = () => {
    if (selectedSessions.length === 0) return;
    setRestoreDialogOpen(true);
  };

  const handlePreviewRestore = async () => {
    if (selectedSessions.length === 0 || isLoadingPreview) return;

    setIsLoadingPreview(true);
    try {
      onPreview(selectedSessions);
      // In a real implementation, this would trigger the preview API
      // For now, we'll simulate the preview data
      const mockPreviews: RestorePreview[] = selectedSessions.map(sessionId => ({
        sessionId,
        originalStatus: 'ended',
        archivedAt: new Date().toISOString(),
        retentionUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        messageCount: Math.floor(Math.random() * 50) + 1,
        userInfo: 'user@example.com',
        estimatedRestoreTime: Math.floor(Math.random() * 10) + 1,
        dataIntegrityChecks: {
          messagesIntact: true,
          metadataIntact: true,
          userLinksIntact: Math.random() > 0.1,
        },
      }));
      
      setPreviews(mockPreviews);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const hasSelectedSessions = selectedSessions.length > 0;

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Restore Operations</h3>
            <p className="text-sm text-gray-500 mt-1">
              {hasSelectedSessions 
                ? `${selectedSessions.length} session${selectedSessions.length !== 1 ? 's' : ''} selected`
                : 'Select sessions to restore'
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewRestore}
              disabled={!hasSelectedSessions || disabled || isLoadingPreview}
            >
              {isLoadingPreview ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Preview Restore
            </Button>

            <Button
              size="sm"
              onClick={handleQuickRestore}
              disabled={!hasSelectedSessions || disabled}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Quick Restore
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        {hasSelectedSessions && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Sessions: {selectedSessions.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Est. Time: ~{selectedSessions.length * 2}s</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">Data Preserved</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">Restore Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <RestoreDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        sessionIds={selectedSessions}
        onRestore={onRestore}
      />

      <RestorePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        previews={previews}
        onConfirmRestore={onRestore}
      />
    </>
  );
}

export default RestoreControls;