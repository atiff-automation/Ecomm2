'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap,
  Play, 
  Pause,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Download,
  Search,
  MoreVertical
} from 'lucide-react';

interface QueueItem {
  id: string;
  messageId: string;
  webhookUrl: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  nextRetryAt?: string;
  payload: any;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  processingRate: number;
}

export default function ChatQueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  
  // UI states
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchQueueData = async () => {
    try {
      setError(null);
      
      const [queueResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/chat/queue?status=${statusFilter}&search=${searchTerm}&page=${currentPage}&limit=${itemsPerPage}`),
        fetch('/api/admin/chat/queue/stats')
      ]);

      if (!queueResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch queue data');
      }

      const queueData = await queueResponse.json();
      const statsData = await statsResponse.json();

      setQueueItems(queueData.items || []);
      setQueueStats(statsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch queue data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    
    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(fetchQueueData, 10000);
    
    return () => clearInterval(interval);
  }, [statusFilter, searchTerm, currentPage]);

  const handleBulkAction = async (action: string) => {
    if (selectedItems.size === 0) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/chat/queue/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          queueIds: Array.from(selectedItems)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      const result = await response.json();
      
      // Clear selection and refresh data
      setSelectedItems(new Set());
      await fetchQueueData();
      
      // Show success message (you might want to add a toast system)
      console.log(`Bulk action completed: ${result.message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'failed':
        return 'text-red-700 bg-red-100';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'processing':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredItems = queueItems.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      item.messageId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.webhookUrl.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Zap className="h-8 w-8 text-blue-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading queue data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Queue</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchQueueData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600">
            Monitor and manage webhook queue processing, retries, and failed deliveries
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated</div>
          <div className="text-sm font-medium text-gray-900">
            {lastUpdated.toLocaleTimeString()}
          </div>
          <button
            onClick={fetchQueueData}
            className="mt-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 inline mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Queue Statistics */}
      {queueStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{queueStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-60" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-blue-600">{queueStats.processing}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-600 opacity-60" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{queueStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-60" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600 opacity-60" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{queueStats.total}</p>
              </div>
              <Zap className="h-8 w-8 text-gray-600 opacity-60" />
            </div>
          </div>
        </div>
      )}

      {/* Controls and Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by message ID or URL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedItems.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('retry')}
                disabled={isProcessing}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                Retry ({selectedItems.size})
              </button>
              <button
                onClick={() => handleBulkAction('cancel')}
                disabled={isProcessing}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Cancel ({selectedItems.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Queue Items Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedItems.size === filteredItems.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Webhook URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className={selectedItems.has(item.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {item.messageId.slice(-12)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {item.webhookUrl}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className={`${item.attempts >= item.maxAttempts ? 'text-red-600' : 'text-gray-600'}`}>
                        {item.attempts}/{item.maxAttempts}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">No queue items found</p>
                    <p className="text-gray-400 text-sm">
                      {statusFilter !== 'all' || searchTerm 
                        ? 'Try adjusting your filters or search terms'
                        : 'Queue is currently empty'
                      }
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Display for Failed Items */}
      {statusFilter === 'failed' && filteredItems.some(item => item.lastError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-red-800 font-medium mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Recent Error Summary
          </h4>
          <div className="text-sm text-red-700 space-y-1">
            {filteredItems
              .filter(item => item.lastError)
              .slice(0, 5)
              .map(item => (
                <div key={item.id} className="flex items-start gap-2">
                  <span className="font-mono text-xs">{item.messageId.slice(-8)}:</span>
                  <span className="flex-1">{item.lastError}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}