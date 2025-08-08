/**
 * Order Export Page - JRM E-commerce Platform
 * Export orders for fulfillment, accounting, and analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  Calendar,
  FileText,
  Package,
  Calculator,
  Truck,
  Clock,
  CheckCircle,
} from 'lucide-react';
import ContextualNavigation from '@/components/admin/ContextualNavigation';

interface ExportStats {
  totalOrders: number;
  totalRevenue: number;
  pendingFulfillment: number;
  completedOrders: number;
}

export default function OrderExportPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ExportStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingFulfillment: 0,
    completedOrders: 0,
  });

  // Export filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeItems, setIncludeItems] = useState(true);
  const [includeShipping, setIncludeShipping] = useState(true);
  const [includeTax, setIncludeTax] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/orders/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleExport = async (type: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        format: exportFormat,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        includeItems: includeItems.toString(),
        includeShipping: includeShipping.toString(),
        includeTax: includeTax.toString(),
      });

      const response = await fetch(`/api/admin/orders/export?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `orders_${type}_${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    setDateTo(today.toISOString().slice(0, 10));
    setDateFrom(thirtyDaysAgo.toISOString().slice(0, 10));
  }, []);

  const exportTypes = [
    {
      id: 'fulfillment',
      name: 'Fulfillment Export',
      description: 'Export orders for shipping and fulfillment processing',
      icon: Package,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'accounting',
      name: 'Accounting Export',
      description: 'Export orders with financial details for accounting',
      icon: Calculator,
      color: 'bg-green-100 text-green-800',
    },
    {
      id: 'shipping',
      name: 'Shipping Export',
      description: 'Export orders for shipping label generation',
      icon: Truck,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'analytics',
      name: 'Analytics Export',
      description: 'Export detailed order data for business analytics',
      icon: FileText,
      color: 'bg-orange-100 text-orange-800',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ContextualNavigation
        items={[
          { label: 'Orders', href: '/admin/orders' },
          { label: 'Fulfillment', href: '/admin/orders/fulfillment' },
          { label: 'Export', href: '/admin/orders/export' },
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Export</h1>
          <p className="text-gray-600 mt-1">
            Export order data for fulfillment, accounting, and analytics
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Orders
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.totalOrders.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calculator className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    RM{stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Pending Fulfillment
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.pendingFulfillment}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Completed Orders
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.completedOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Configuration */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Export Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Range */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Date Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="dateFrom"
                        className="text-xs text-gray-500"
                      >
                        From
                      </Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo" className="text-xs text-gray-500">
                        To
                      </Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium">Order Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Export Format */}
                <div>
                  <Label className="text-sm font-medium">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Include Options */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Include in Export
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeItems"
                        checked={includeItems}
                        onCheckedChange={setIncludeItems}
                      />
                      <Label htmlFor="includeItems" className="text-sm">
                        Order Items Details
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeShipping"
                        checked={includeShipping}
                        onCheckedChange={setIncludeShipping}
                      />
                      <Label htmlFor="includeShipping" className="text-sm">
                        Shipping Information
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeTax"
                        checked={includeTax}
                        onCheckedChange={setIncludeTax}
                      />
                      <Label htmlFor="includeTax" className="text-sm">
                        Tax Calculations
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Types */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Export Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exportTypes.map(type => (
                    <Card
                      key={type.id}
                      className="border-2 hover:border-blue-200 transition-colors"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${type.color}`}>
                            <type.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {type.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                              {type.description}
                            </p>
                            <Button
                              onClick={() => handleExport(type.id)}
                              disabled={loading}
                              size="sm"
                              className="w-full"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              {loading ? 'Exporting...' : 'Export'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Export Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleExport('daily')}
                    disabled={loading}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Calendar className="h-5 w-5 mb-1" />
                    <span className="text-sm">Today's Orders</span>
                  </Button>

                  <Button
                    onClick={() => handleExport('pending')}
                    disabled={loading}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Clock className="h-5 w-5 mb-1" />
                    <span className="text-sm">Pending Orders</span>
                  </Button>

                  <Button
                    onClick={() => handleExport('shipped')}
                    disabled={loading}
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <Truck className="h-5 w-5 mb-1" />
                    <span className="text-sm">Shipped Orders</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Export History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Export history will appear here</p>
              <p className="text-sm mt-2">
                Recent exports will be tracked for audit purposes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
