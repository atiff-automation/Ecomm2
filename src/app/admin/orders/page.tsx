'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AdminPageLayout } from '@/components/admin/layout';
import { OrderTable } from '@/components/admin/orders/OrderTable';
import { OrderFilters } from '@/components/admin/orders/OrderFilters';
import { ExportDialog } from '@/components/admin/orders/ExportDialog';
import { useToast } from '@/hooks/use-toast';
import { Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { ORDER_STATUS_TABS } from '@/lib/constants/order';
import type {
  OrderTableData,
  OrderFilterValues,
  ExportOptions,
} from '@/components/admin/orders/types';

interface OrderMetrics {
  total: number;
  awaitingPayment: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export default function AdminOrdersPage() {
  // State management
  const [orders, setOrders] = useState<OrderTableData[]>([]);
  const [metrics, setMetrics] = useState<OrderMetrics>({
    total: 0,
    awaitingPayment: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTab, setSelectedTab] = useState('all');
  const [filters, setFilters] = useState<OrderFilterValues>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom.toISOString() }),
        ...(filters.dateTo && { dateTo: filters.dateTo.toISOString() }),
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load orders',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, toast]);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setMetricsLoading(true);
      const response = await fetch('/api/orders/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedOrderIds([]);
  }, [filters, currentPage]);

  // Handlers
  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    const tab = ORDER_STATUS_TABS.find(t => t.id === tabId);

    if (tab && tab.filter) {
      // Apply tab filter
      setFilters({ ...filters, status: tabId });
    } else {
      // Clear status filter for "All" tab
      const { status, ...restFilters } = filters;
      setFilters(restFilters);
    }
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: OrderFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSelectOrder = (orderId: string, selected: boolean) => {
    if (selected) {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    } else {
      setSelectedOrderIds(selectedOrderIds.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedOrderIds(orders.map(o => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        format: options.format,
        ...(options.dateFrom && { dateFrom: options.dateFrom.toISOString() }),
        ...(options.dateTo && { dateTo: options.dateTo.toISOString() }),
        ...(options.status && { status: options.status }),
        includeCustomerDetails: options.includeCustomerDetails.toString(),
        includeShippingAddress: options.includeShippingAddress.toString(),
        includeItemsBreakdown: options.includeItemsBreakdown.toString(),
      });

      const response = await fetch(`/api/orders/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-export-${new Date().toISOString().split('T')[0]}.${options.format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Orders exported successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to export orders',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Error',
        description: 'Failed to export orders',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminPageLayout
      title="Order Management"
      subtitle="Manage customer orders and fulfillment"
      loading={loading}
    >
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? (
                <div className="animate-pulse h-8 w-12 bg-gray-200 rounded"></div>
              ) : (
                metrics.total
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Awaiting Payment
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {metricsLoading ? (
                <div className="animate-pulse h-8 w-12 bg-gray-200 rounded"></div>
              ) : (
                metrics.awaitingPayment
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metricsLoading ? (
                <div className="animate-pulse h-8 w-12 bg-gray-200 rounded"></div>
              ) : (
                metrics.processing
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Truck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {metricsLoading ? (
                <div className="animate-pulse h-8 w-12 bg-gray-200 rounded"></div>
              ) : (
                metrics.shipped
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metricsLoading ? (
                <div className="animate-pulse h-8 w-12 bg-gray-200 rounded"></div>
              ) : (
                metrics.delivered
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metricsLoading ? (
                <div className="animate-pulse h-8 w-12 bg-gray-200 rounded"></div>
              ) : (
                metrics.cancelled
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Tabs */}
      <Tabs
        value={selectedTab}
        onValueChange={handleTabChange}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {ORDER_STATUS_TABS.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="text-xs sm:text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="mb-6">
        <OrderFilters
          currentFilters={filters}
          onFilterChange={handleFilterChange}
          onExport={() => setExportDialogOpen(true)}
          orderCount={orders.length}
        />
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <OrderTable
            orders={orders}
            selectedOrderIds={selectedOrderIds}
            onSelectOrder={handleSelectOrder}
            onSelectAll={handleSelectAll}
            isLoading={loading}
          />

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(p => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        currentFilters={filters}
        isExporting={isExporting}
      />
    </AdminPageLayout>
  );
}
