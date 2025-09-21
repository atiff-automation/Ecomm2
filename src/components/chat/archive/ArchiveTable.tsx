/**
 * Archive Sessions Table Component
 * Following @CLAUDE.md DRY principles - exact pattern from SessionsTable
 * Displays archived sessions with restore functionality
 */

'use client';

import React from 'react';
import { 
  Archive, 
  RotateCcw, 
  Calendar, 
  User, 
  MessageSquare, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { ArchiveSession, SortConfig, PaginationConfig } from '@/types/chat';

interface ArchiveTableProps {
  sessions: ArchiveSession[];
  selectedSessions: string[];
  onSelectionChange: (selected: string[]) => void;
  onRestoreSession: (sessionId: string) => void;
  onBulkRestore: (sessionIds: string[]) => void;
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  pagination: PaginationConfig;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

interface TableHeaderProps {
  label: string;
  sortKey: keyof ArchiveSession;
  sortConfig: SortConfig;
  onSort: (config: SortConfig) => void;
  className?: string;
}

function TableHeader({ label, sortKey, sortConfig, onSort, className = '' }: TableHeaderProps) {
  const isActive = sortConfig.key === sortKey;
  const direction = isActive ? sortConfig.direction : 'asc';

  const handleClick = () => {
    onSort({
      key: sortKey,
      direction: isActive && direction === 'asc' ? 'desc' : 'asc',
    });
  };

  return (
    <th 
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-gray-400">
            {direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
}

export function ArchiveTable({
  sessions,
  selectedSessions,
  onSelectionChange,
  onRestoreSession,
  onBulkRestore,
  sortConfig,
  onSort,
  pagination,
  onPageChange,
  loading = false
}: ArchiveTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(sessions.map(session => session.sessionId));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectSession = (sessionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSessions, sessionId]);
    } else {
      onSelectionChange(selectedSessions.filter(id => id !== sessionId));
    }
  };

  const isAllSelected = sessions.length > 0 && selectedSessions.length === sessions.length;
  const isPartiallySelected = selectedSessions.length > 0 && selectedSessions.length < sessions.length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000 / 60); // minutes
    if (duration < 60) return `${duration}m`;
    return `${Math.round(duration / 60)}h ${duration % 60}m`;
  };

  const getStatusIcon = (session: ArchiveSession) => {
    if (!session.canRestore) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = (session: ArchiveSession) => {
    if (!session.canRestore) {
      return `Expires in ${session.daysUntilPurge} days`;
    }
    return 'Can restore';
  };

  const getUserInfo = (session: ArchiveSession) => {
    if (session.userEmail) {
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">{session.userName || session.userEmail}</div>
          <div className="text-sm text-gray-500">{session.userEmail}</div>
        </div>
      );
    }
    if (session.guestEmail || session.guestPhone) {
      return (
        <div>
          <div className="text-sm font-medium text-gray-900">Guest User</div>
          <div className="text-sm text-gray-500">
            {session.guestEmail || session.guestPhone}
          </div>
        </div>
      );
    }
    return (
      <div className="text-sm text-gray-500">Anonymous</div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-8"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-12 text-center">
          <Archive className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No archived sessions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Sessions will appear here when they are archived.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {/* Bulk Actions */}
      {selectedSessions.length > 0 && (
        <div className="bg-blue-50 px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''} selected
            </span>
            <Button
              size="sm"
              onClick={() => onBulkRestore(selectedSessions)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Selected
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isPartiallySelected}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <TableHeader
                label="Session"
                sortKey="sessionId"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <TableHeader
                label="User"
                sortKey="userEmail"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <TableHeader
                label="Messages"
                sortKey="messageCount"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <TableHeader
                label="Duration"
                sortKey="startedAt"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <TableHeader
                label="Archived"
                sortKey="archivedAt"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <TableHeader
                label="Status"
                sortKey="canRestore"
                sortConfig={sortConfig}
                onSort={onSort}
              />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.sessionId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Checkbox
                    checked={selectedSessions.includes(session.sessionId)}
                    onCheckedChange={(checked) => 
                      handleSelectSession(session.sessionId, checked as boolean)
                    }
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {session.sessionId.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(session.startedAt)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getUserInfo(session)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <MessageSquare className="h-4 w-4 mr-1 text-gray-400" />
                    {session.messageCount}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDuration(session.startedAt, session.endedAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(session.archivedAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(session)}
                    <span className="ml-2 text-sm text-gray-900">
                      {getStatusText(session)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {session.canRestore && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRestoreSession(session.sessionId)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.total > pagination.pageSize && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.total}</span> sessions
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-l-md"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                  className="rounded-r-md"
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArchiveTable;