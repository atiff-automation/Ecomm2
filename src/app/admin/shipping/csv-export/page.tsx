'use client';

/**
 * EasyParcel CSV Export Admin Interface
 * Allows admins to export orders in EasyParcel bulk upload format
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
}

interface ExportStatistics {
  totalOrders: number;
  readyToShip: number;
  pendingPayment: number;
  processing: number;
  recentOrders: number;
}

interface PreviewData {
  preview: any[];
  totalOrders: number;
  estimatedSize: string;
  validationIssues: string[];
  orders: Order[];
}

const CSVExportPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<ExportStatistics | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [exportMode, setExportMode] = useState<'filtered' | 'selected'>('filtered');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string[]>(['CONFIRMED', 'PROCESSING']);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string[]>(['PAID']);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Export options
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [validateRequired, setValidateRequired] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/admin/shipping/export/easyparcel-csv');
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const generatePreview = async () => {
    setLoading(true);
    try {
      const requestBody = {
        action: 'preview',
        ...(exportMode === 'selected' 
          ? { orderIds: selectedOrders }
          : {
              filters: {
                status: statusFilter,
                paymentStatus: paymentStatusFilter,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
              }
            }
        ),
        options: {
          includeHeaders,
          validateRequired,
          previewLimit: 5
        }
      };

      const response = await fetch('/api/admin/shipping/export/easyparcel-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      if (data.success) {
        setPreviewData(data.data);
      } else {
        alert(data.message || 'Preview failed');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Error generating preview');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    setLoading(true);
    try {
      const requestBody = {
        action: 'export',
        ...(exportMode === 'selected' 
          ? { orderIds: selectedOrders }
          : {
              filters: {
                status: statusFilter,
                paymentStatus: paymentStatusFilter,
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
              }
            }
        ),
        options: {
          includeHeaders,
          validateRequired
        }
      };

      const response = await fetch('/api/admin/shipping/export/easyparcel-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'easyparcel-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert(`CSV exported successfully! (${response.headers.get('X-Export-Count')} orders)`);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Export failed');
      }
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Error downloading CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSelection = (orderId: string, selected: boolean) => {
    if (selected) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  const selectAllOrders = () => {
    if (previewData) {
      setSelectedOrders(previewData.orders.map(order => order.id));
    }
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">EasyParcel CSV Export</h1>
        <p className="text-gray-600">Export orders in EasyParcel bulk upload format as a fallback when API is unavailable</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalOrders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Ready to Ship</h3>
            <p className="text-2xl font-bold text-green-600">{statistics.readyToShip}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Processing</h3>
            <p className="text-2xl font-bold text-blue-600">{statistics.processing}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Pending Payment</h3>
            <p className="text-2xl font-bold text-yellow-600">{statistics.pendingPayment}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Recent Orders</h3>
            <p className="text-2xl font-bold text-purple-600">{statistics.recentOrders}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Configuration */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Export Configuration</h2>
          
          {/* Export Mode */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Mode</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="filtered"
                  checked={exportMode === 'filtered'}
                  onChange={(e) => setExportMode(e.target.value as 'filtered')}
                  className="mr-2"
                />
                Filter by criteria
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="selected"
                  checked={exportMode === 'selected'}
                  onChange={(e) => setExportMode(e.target.value as 'selected')}
                  className="mr-2"
                />
                Select specific orders ({selectedOrders.length} selected)
              </label>
            </div>
          </div>

          {/* Filters - only show when in filtered mode */}
          {exportMode === 'filtered' && (
            <>
              {/* Status Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStatusFilter([...statusFilter, status]);
                          } else {
                            setStatusFilter(statusFilter.filter(s => s !== status));
                          }
                        }}
                        className="mr-2"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Status Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {['PENDING', 'PAID', 'FAILED', 'REFUNDED'].map(status => (
                    <label key={status} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={paymentStatusFilter.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPaymentStatusFilter([...paymentStatusFilter, status]);
                          } else {
                            setPaymentStatusFilter(paymentStatusFilter.filter(s => s !== status));
                          }
                        }}
                        className="mr-2"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border rounded px-3 py-2"
                    placeholder="From"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border rounded px-3 py-2"
                    placeholder="To"
                  />
                </div>
              </div>
            </>
          )}

          {/* Export Options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="mr-2"
                />
                Include CSV headers
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={validateRequired}
                  onChange={(e) => setValidateRequired(e.target.checked)}
                  className="mr-2"
                />
                Validate required fields
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={generatePreview}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Preview Export'}
            </button>
            <button
              onClick={downloadCSV}
              disabled={loading || !previewData}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {/* Preview Results */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Export Preview</h2>
          
          {previewData ? (
            <>
              {/* Summary */}
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Total Orders:</strong> {previewData.totalOrders}
                  </div>
                  <div>
                    <strong>Estimated Size:</strong> {previewData.estimatedSize}
                  </div>
                </div>
              </div>

              {/* Validation Issues */}
              {previewData.validationIssues.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 rounded border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">Validation Issues:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {previewData.validationIssues.slice(0, 5).map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                    {previewData.validationIssues.length > 5 && (
                      <li>... and {previewData.validationIssues.length - 5} more issues</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Orders List */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Orders to Export</h4>
                  {exportMode === 'selected' && (
                    <div className="space-x-2">
                      <button
                        onClick={selectAllOrders}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {exportMode === 'selected' && <th className="p-2 text-left">Select</th>}
                        <th className="p-2 text-left">Order #</th>
                        <th className="p-2 text-left">Customer</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.orders.slice(0, 20).map(order => (
                        <tr key={order.id} className="border-t">
                          {exportMode === 'selected' && (
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={selectedOrders.includes(order.id)}
                                onChange={(e) => handleOrderSelection(order.id, e.target.checked)}
                              />
                            </td>
                          )}
                          <td className="p-2 font-mono text-xs">{order.orderNumber}</td>
                          <td className="p-2">{order.customerName}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              order.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                              order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-2">RM{order.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.orders.length > 20 && (
                    <div className="p-2 text-center text-sm text-gray-500 bg-gray-50">
                      ... and {previewData.orders.length - 20} more orders
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Click "Preview Export" to see what will be exported
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">How to use EasyParcel CSV Export:</h3>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Configure your export criteria using the filters above</li>
          <li>Click "Preview Export" to review the orders that will be exported</li>
          <li>Download the CSV file when you're satisfied with the selection</li>
          <li>Upload the CSV file to EasyParcel's bulk upload feature on their website</li>
          <li>Process the shipments directly through EasyParcel's interface</li>
        </ol>
        <p className="text-xs text-blue-600 mt-2">
          <strong>Note:</strong> This is a fallback method when the EasyParcel API is unavailable.
          The CSV format follows EasyParcel's bulk upload template specification.
        </p>
      </div>
    </div>
  );
};

export default CSVExportPage;