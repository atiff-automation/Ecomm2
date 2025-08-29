'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Download,
  Loader2,
} from 'lucide-react';

interface TrackingStats {
  totalShipments: number;
  inTransit: number;
  delivered: number;
  exceptions: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  courierPerformance: {
    courierName: string;
    shipmentCount: number;
    deliveryRate: number;
    averageTime: number;
  }[];
}

interface TrackingAnalyticsDashboardProps {
  className?: string;
}

export default function TrackingAnalyticsDashboard({
  className = '',
}: TrackingAnalyticsDashboardProps) {
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dateRange, setDateRange] = useState('30'); // Last 30 days
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/tracking/analytics?days=${dateRange}`
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setError('');
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      setError('Failed to load tracking analytics');
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/orders/batch-tracking-refresh', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Show success message or update UI
        await fetchAnalytics(); // Refresh analytics after batch update
      }
    } catch (error) {
      console.error('Batch refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const exportTrackingReport = async () => {
    try {
      const response = await fetch(
        `/api/admin/tracking/export?days=${dateRange}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracking-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className={`${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tracking Analytics</h2>
          <p className="text-gray-600">
            Monitor shipping performance and courier metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleBatchRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh All
          </Button>

          <Button variant="outline" onClick={exportTrackingReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Shipments
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalShipments.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Last {dateRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inTransit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalShipments > 0
                ? ((stats.inTransit / stats.totalShipments) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.delivered.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalShipments > 0
                ? ((stats.delivered / stats.totalShipments) * 100).toFixed(1)
                : 0}
              % delivery rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.exceptions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalShipments > 0
                ? ((stats.exceptions / stats.totalShipments) * 100).toFixed(1)
                : 0}
              % exception rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Delivery Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Delivery Time</span>
              <Badge variant="outline">
                {stats.averageDeliveryTime.toFixed(1)} days
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">On-Time Delivery Rate</span>
              <Badge
                className={
                  stats.onTimeDeliveryRate >= 90
                    ? 'bg-green-100 text-green-800'
                    : stats.onTimeDeliveryRate >= 80
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }
              >
                {stats.onTimeDeliveryRate.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Courier Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.courierPerformance.map((courier, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {courier.courierName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {courier.shipmentCount} shipments
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {courier.deliveryRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {courier.averageTime.toFixed(1)} days avg
                    </div>
                  </div>
                </div>
              ))}

              {stats.courierPerformance.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No courier data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleBatchRefresh} disabled={refreshing}>
              {refreshing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh All Tracking
                </>
              )}
            </Button>

            <Button variant="outline" onClick={exportTrackingReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Detailed Report
            </Button>

            <Button variant="outline">
              <Clock className="w-4 h-4 mr-2" />
              Schedule Auto-Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
