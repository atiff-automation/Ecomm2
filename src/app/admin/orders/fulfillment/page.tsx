/**
 * Order Fulfillment Page - JRM E-commerce Platform
 * Manage order fulfillment, shipping, and tracking
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Package,
  Truck,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Clock,
  AlertTriangle,
  Copy,
  RefreshCw,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import ContextualNavigation from '@/components/admin/ContextualNavigation';

// Define tracking status type
type TrackingStatus = 
  | 'pending'
  | 'booked' 
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'cancelled';

interface FulfillmentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    postcode: string;
  };
  createdAt: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  
  // ENHANCED: More detailed shipment info
  shipment?: {
    trackingNumber?: string;
    status?: TrackingStatus;
    courierName?: string;
    serviceName?: string;
    estimatedDelivery?: string;
    lastTrackedAt?: string;
  };
}

export default function OrderFulfillmentPage() {
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('fulfillment', 'true'); // Filter for fulfillment-ready orders

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) {
      return;
    }

    try {
      const response = await fetch('/api/admin/orders/fulfillment', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: selectedOrders,
          status: newStatus,
        }),
      });

      if (response.ok) {
        await fetchOrders();
        setSelectedOrders([]);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  // NEW: Bulk shipping operations
  const handleBulkShip = async () => {
    const shippableOrders = selectedOrders.filter(orderId => {
      const order = orders.find(o => o.id === orderId);
      return order?.status === 'PROCESSING' && !order?.shipment?.trackingNumber;
    });

    if (shippableOrders.length === 0) return;

    try {
      const response = await fetch('/api/admin/orders/bulk-ship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: shippableOrders }),
      });

      if (response.ok) {
        await fetchOrders();
        setSelectedOrders([]);
      }
    } catch (error) {
      console.error('Failed to ship orders:', error);
    }
  };

  const handleBulkTrackingRefresh = async () => {
    const ordersWithTracking = selectedOrders.filter(orderId => {
      const order = orders.find(o => o.id === orderId);
      return order?.shipment?.trackingNumber;
    });

    if (ordersWithTracking.length === 0) return;

    try {
      const response = await fetch('/api/admin/orders/bulk-tracking-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: ordersWithTracking }),
      });

      if (response.ok) {
        await fetchOrders();
      }
    } catch (error) {
      console.error('Failed to refresh tracking:', error);
    }
  };

  const handleBulkLabelDownload = async () => {
    const ordersWithShipments = selectedOrders.filter(orderId => {
      const order = orders.find(o => o.id === orderId);
      return order?.shipment?.trackingNumber;
    });

    if (ordersWithShipments.length === 0) return;

    try {
      const response = await fetch('/api/admin/orders/bulk-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: ordersWithShipments }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `labels-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download labels:', error);
    }
  };

  const handleShipOrder = async (orderId: string) => {
    // Implementation for single order shipping
    // This could open a modal or navigate to shipping page
    console.log('Ship order:', orderId);
  };

  const handleEditShipment = (orderId: string) => {
    // Navigate to order details or open edit modal
    window.location.href = `/admin/orders/${orderId}#shipping`;
  };

  const handleSelectOrder = (orderId: string, selected: boolean) => {
    if (selected) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedOrders(orders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SHIPPED':
        return 'bg-green-100 text-green-800';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // NEW: Tracking helper functions
  const getTrackingStatusColor = (status?: TrackingStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'booked':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'picked_up':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_transit':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'out_for_delivery':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'exception':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTrackingStatus = (status?: TrackingStatus): string => {
    if (!status) return 'No Status';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const formatRelativeTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-MY');
  };

  const formatDateTime = (dateString: string): string => {
    return new Intl.DateTimeFormat('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // NEW: Bulk operation helper functions
  const canBulkShip = (): boolean => {
    return selectedOrders.some(orderId => {
      const order = orders.find(o => o.id === orderId);
      return order?.status === 'PROCESSING' && !order?.shipment?.trackingNumber;
    });
  };

  const getShippableCount = (): number => {
    return selectedOrders.filter(orderId => {
      const order = orders.find(o => o.id === orderId);
      return order?.status === 'PROCESSING' && !order?.shipment?.trackingNumber;
    }).length;
  };

  const hasTrackingNumbers = (): boolean => {
    return selectedOrders.some(orderId => {
      const order = orders.find(o => o.id === orderId);
      return order?.shipment?.trackingNumber;
    });
  };

  const hasShipments = (): boolean => {
    return selectedOrders.some(orderId => {
      const order = orders.find(o => o.id === orderId);
      return order?.shipment?.trackingNumber;
    });
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm]);

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
          <h1 className="text-3xl font-bold text-gray-900">
            Order Fulfillment
          </h1>
          <p className="text-gray-600 mt-1">
            Process orders and manage shipping
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Pending Processing
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {orders.filter(o => o.status === 'CONFIRMED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    In Processing
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {orders.filter(o => o.status === 'PROCESSING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Truck className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Shipped</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {orders.filter(o => o.status === 'SHIPPED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    High Priority
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {orders.filter(o => o.priority === 'HIGH').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Fulfillment Queue
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleBulkStatusUpdate('PROCESSING')}
                  disabled={selectedOrders.length === 0}
                  size="sm"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Start Processing ({selectedOrders.length})
                </Button>
                
                <Button
                  onClick={() => handleBulkShip()}
                  disabled={selectedOrders.length === 0 || !canBulkShip()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Ship Orders ({getShippableCount()})
                </Button>
                
                <Button
                  onClick={() => handleBulkTrackingRefresh()}
                  disabled={selectedOrders.length === 0 || !hasTrackingNumbers()}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Tracking
                </Button>
                
                <Button
                  onClick={() => handleBulkLabelDownload()}
                  disabled={selectedOrders.length === 0 || !hasShipments()}
                  size="sm"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Labels
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search orders by number, customer name, or email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="CONFIRMED">Ready to Process</SelectItem>
                  <SelectItem value="PROCESSING">In Processing</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={
                    selectedOrders.length === orders.length && orders.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  {selectedOrders.length > 0
                    ? `${selectedOrders.length} selected`
                    : `${orders.length} orders`}
                </span>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Queue
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shipping
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        <div className="animate-pulse">Loading orders...</div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No orders found for fulfillment
                      </td>
                    </tr>
                  ) : (
                    orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Checkbox
                              checked={selectedOrders.includes(order.id)}
                              onCheckedChange={checked =>
                                handleSelectOrder(order.id, checked as boolean)
                              }
                              className="mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.orderNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.customerEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.itemCount}{' '}
                            {order.itemCount === 1 ? 'item' : 'items'}
                          </div>
                          <div className="text-sm text-gray-500">
                            RM{order.total}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            {/* Shipping Method */}
                            <div className="text-sm text-gray-900 font-medium">
                              {order.shipment?.serviceName || 'Standard'}
                            </div>
                            
                            {/* Courier Name */}
                            {order.shipment?.courierName && (
                              <div className="text-xs text-gray-600">
                                via {order.shipment.courierName}
                              </div>
                            )}
                            
                            {/* Tracking Information */}
                            {order.shipment?.trackingNumber ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-blue-600">
                                    {order.shipment.trackingNumber}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0"
                                    onClick={() => navigator.clipboard.writeText(order.shipment!.trackingNumber!)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    className={`${getTrackingStatusColor(order.shipment.status)} text-xs`}
                                    variant="outline"
                                  >
                                    {formatTrackingStatus(order.shipment.status)}
                                  </Badge>
                                  
                                  {order.shipment.lastTrackedAt && (
                                    <span className="text-xs text-gray-400" title={`Last updated: ${formatDateTime(order.shipment.lastTrackedAt)}`}>
                                      {formatRelativeTime(order.shipment.lastTrackedAt)}
                                    </span>
                                  )}
                                </div>
                                
                                {order.shipment.estimatedDelivery && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Est: {formatDate(order.shipment.estimatedDelivery)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                <span className="text-xs text-gray-400">Awaiting shipment</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex gap-1">
                            {/* View Order */}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            
                            {/* Quick Tracking */}
                            {order.shipment?.trackingNumber && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(`https://track.easyparcel.my/${order.shipment!.trackingNumber}`, '_blank')}
                                title="Track shipment"
                              >
                                <Truck className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* Ship Order / Edit Tracking */}
                            {order.status === 'PROCESSING' && !order.shipment?.trackingNumber ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleShipOrder(order.id)}
                                title="Ship order"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditShipment(order.id)}
                                title="Edit shipment"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
