/**
 * SessionsTable Component
 * Enhanced table with sorting, pagination, and selection following DRY principles
 * Following @CLAUDE.md approach with centralized architecture
 */

'use client';

import React from 'react';
import { Eye, Download, Archive, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ChatSession, SortConfig, PaginationConfig } from '@/types/chat';
import { formatDuration, formatTimestamp, getStatusColor } from '@/utils/chat';

interface SessionsTableProps {
  sessions: ChatSession[];
  selectedSessions: string[];
  onSelectionChange: (selected: string[]) => void;
  onExportSession: (sessionId: string) => void;
  onViewSession: (sessionId: string) => void;
  onEndSession: (sessionId: string) => void;
  sortConfig: SortConfig;
  onSort: (key: keyof ChatSession) => void;
  pagination: PaginationConfig;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function SessionsTable({
  sessions,
  selectedSessions,
  onSelectionChange,
  onExportSession,
  onViewSession,
  onEndSession,
  sortConfig,
  onSort,
  pagination,
  onPageChange,
  loading = false,
}: SessionsTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(sessions.map(s => s.sessionId));
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

  const getSortIcon = (key: keyof ChatSession) => {
    if (sortConfig.key !== key) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);
    const currentPage = pagination.page;

    if (totalPages <= 1) return null;

    const pages = [];
    const showPages = 5;
    let start = Math.max(1, currentPage - Math.floor(showPages / 2));
    let end = Math.min(totalPages, start + showPages - 1);

    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div className="bg-white border-t border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * pagination.pageSize) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * pagination.pageSize, pagination.total)}</span> of{' '}
            <span className="font-medium">{pagination.total}</span> sessions
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-9"
            >
              Previous
            </Button>
            {start > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  className="h-9 w-9"
                >
                  1
                </Button>
                {start > 2 && (
                  <span className="px-2 text-gray-400">...</span>
                )}
              </>
            )}
            {pages.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="h-9 w-9"
              >
                {page}
              </Button>
            ))}
            {end < totalPages && (
              <>
                {end < totalPages - 1 && (
                  <span className="px-2 text-gray-400">...</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(totalPages)}
                  className="h-9 w-9"
                >
                  {totalPages}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-9"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Sessions
          </h3>
          {sessions.length > 0 && (
            <Button
              onClick={() => handleSelectAll(selectedSessions.length !== sessions.length)}
              variant="outline"
              size="sm"
            >
              {selectedSessions.length === sessions.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={sessions.length > 0 && selectedSessions.length === sessions.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => onSort('sessionId')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Session</span>
                    {getSortIcon('sessionId')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => onSort('status')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Status</span>
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => onSort('startedAt')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Duration</span>
                    {getSortIcon('startedAt')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => onSort('messageCount')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Messages</span>
                    {getSortIcon('messageCount')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => onSort('lastActivity')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Last Activity</span>
                    {getSortIcon('lastActivity')}
                  </button>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.sessionId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(session.sessionId)}
                      onChange={(e) => handleSelectSession(session.sessionId, e.target.checked)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {session.sessionId}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={getStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {session.userEmail || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {session.ipAddress}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(
                      session.startedAt,
                      session.status === 'ended' ? session.lastActivity : undefined
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.messageCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(session.lastActivity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewSession(session.sessionId)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onExportSession(session.sessionId)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {session.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEndSession(session.sessionId)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sessions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Archive className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No chat sessions found
              </h3>
              <p className="text-gray-500">
                Chat sessions will appear here when users start conversations.
              </p>
            </div>
          )}
        </div>

        {renderPagination()}
      </div>
    </div>
  );
}