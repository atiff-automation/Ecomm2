/**
 * Admin Shipping Fulfillment Dashboard
 * Comprehensive fulfillment workflow for EasyParcel integration
 * Reference: EASYPARCEL_IMPLEMENTATION_GUIDE.md Phase 5.3
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Package,
  Truck,
  FileText,
  Calendar,
  BarChart3,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  RefreshCw,
  PrinterIcon,
  CalendarDays,
  Users,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

// Types for shipping fulfillment
interface PendingShipment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
  totalValue: number;
  weight?: number;
  dimensions?: string;
  specialInstructions?: string;
  courierSelected: boolean;
  labelGenerated: boolean;
  pickupScheduled: boolean;
  trackingNumber?: string;
  courierName?: string;
  serviceName?: string;
}

interface ShippingStats {
  totalShipments: number;
  pendingBooking: number;
  awaitingPickup: number;
  inTransit: number;
  delivered: number;
  failed: number;
  totalRevenue: number;
  averageDeliveryTime: number;
  todayPickups: number;
  pendingLabels: number;
}

interface PickupSchedule {
  id: string;
  date: string;
  timeSlot: string;
  shipmentCount: number;
  contactPerson: string;
  contactPhone: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  shipments: string[];
}

export default function AdminShippingFulfillmentDashboard() {
  const { data: session, status } = useSession();
  const [pendingShipments, setPendingShipments] = useState<PendingShipment[]>(
    []
  );
  const [shippingStats, setShippingStats] = useState<ShippingStats | null>(
    null
  );
  const [pickupSchedules, setPickupSchedules] = useState<PickupSchedule[]>([]);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('pending');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTimeSlot, setPickupTimeSlot] = useState('');

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }
  if (
    !session?.user ||
    (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN')
  ) {
    redirect('/auth/signin');
  }

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [shipmentsRes, statsRes, pickupsRes] = await Promise.all([
        fetch('/api/admin/shipping/pending'),
        fetch('/api/admin/shipping/stats'),
        fetch('/api/admin/shipping/pickups'),
      ]);

      if (shipmentsRes.ok) {
        const shipmentsData = await shipmentsRes.json();
        setPendingShipments(shipmentsData.shipments || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setShippingStats(statsData.stats);
      }

      if (pickupsRes.ok) {
        const pickupsData = await pickupsRes.json();
        setPickupSchedules(pickupsData.schedules || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk label generation
  const handleBulkLabelGeneration = async () => {
    if (selectedShipments.length === 0) {
      toast.error('Please select shipments to generate labels');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/shipping/bulk-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds: selectedShipments }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Generated ${data.successCount} labels successfully`);

        // Download the generated labels ZIP file
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }

        fetchDashboardData(); // Refresh data
        setSelectedShipments([]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to generate labels');
      }
    } catch (error) {
      console.error('Bulk label generation failed:', error);
      toast.error('Failed to generate labels');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk shipment booking
  const handleBulkShipmentBooking = async () => {
    if (selectedShipments.length === 0) {
      toast.error('Please select shipments to book');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/shipping/bulk-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentIds: selectedShipments }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Booked ${data.successCount} shipments successfully`);
        fetchDashboardData(); // Refresh data
        setSelectedShipments([]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to book shipments');
      }
    } catch (error) {
      console.error('Bulk shipment booking failed:', error);
      toast.error('Failed to book shipments');
    } finally {
      setLoading(false);
    }
  };

  // Handle pickup scheduling
  const handlePickupScheduling = async () => {
    if (selectedShipments.length === 0) {
      toast.error('Please select shipments for pickup');
      return;
    }

    if (!pickupDate || !pickupTimeSlot) {
      toast.error('Please select pickup date and time slot');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shipping/pickup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_ids: selectedShipments,
          pickup_date: pickupDate,
          pickup_time: pickupTimeSlot,
          contact_person: 'Admin',
          contact_phone: '+60123456789',
        }),
      });

      if (response.ok) {
        toast.success('Pickup scheduled successfully');
        fetchDashboardData(); // Refresh data
        setSelectedShipments([]);
        setPickupDate('');
        setPickupTimeSlot('');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to schedule pickup');
      }
    } catch (error) {
      console.error('Pickup scheduling failed:', error);
      toast.error('Failed to schedule pickup');
    } finally {
      setLoading(false);
    }
  };

  // Filter shipments based on search and status
  const filteredShipments = pendingShipments.filter(shipment => {
    const matchesSearch =
      searchQuery === '' ||
      shipment.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shipment.trackingNumber &&
        shipment.trackingNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Format date for Malaysian timezone
  const formatDate = (dateString: string, includeTime = true) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };
    return date.toLocaleDateString('en-MY', options);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-100 text-blue-800';
      case 'PICKED_UP':
        return 'bg-orange-100 text-orange-800';
      case 'LABEL_GENERATED':
        return 'bg-purple-100 text-purple-800';
      case 'BOOKED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get tomorrow's date as default
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Shipping Fulfillment Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive fulfillment workflow for EasyParcel integration
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Overview */}
      {shippingStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Shipments
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {shippingStats.totalShipments}
              </div>
              <p className="text-xs text-muted-foreground">
                All time shipments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Labels
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {shippingStats.pendingLabels || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Need label generation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Pickups
              </CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {shippingStats.todayPickups || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled for today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {shippingStats.delivered}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully delivered
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending Shipments</TabsTrigger>
          <TabsTrigger value="pickups">Pickup Scheduling</TabsTrigger>
          <TabsTrigger value="labels">Label Management</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        {/* Pending Shipments Tab */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Pending Shipments ({filteredShipments.length})</span>
                <Button
                  onClick={fetchDashboardData}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search Orders</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by order number, customer name, or tracking..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="w-full md:w-48">
                  <Label htmlFor="status-filter">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="BOOKED">Booked</SelectItem>
                      <SelectItem value="LABEL_GENERATED">
                        Label Generated
                      </SelectItem>
                      <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                      <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bulk Actions */}
              {selectedShipments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700 mr-4">
                    {selectedShipments.length} shipment(s) selected
                  </span>

                  <Button
                    size="sm"
                    onClick={handleBulkShipmentBooking}
                    disabled={loading}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Book Shipments
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleBulkLabelGeneration}
                    disabled={loading}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Labels
                  </Button>

                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={pickupDate}
                      onChange={e => setPickupDate(e.target.value)}
                      min={getTomorrowDate()}
                      className="w-40"
                    />
                    <Select
                      value={pickupTimeSlot}
                      onValueChange={setPickupTimeSlot}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handlePickupScheduling}
                      disabled={loading || !pickupDate || !pickupTimeSlot}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Pickup
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedShipments([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}

              {/* Shipments Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedShipments.length ===
                              filteredShipments.length &&
                            filteredShipments.length > 0
                          }
                          onCheckedChange={checked => {
                            if (checked) {
                              setSelectedShipments(
                                filteredShipments.map(s => s.id)
                              );
                            } else {
                              setSelectedShipments([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Courier</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map(shipment => (
                      <TableRow key={shipment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedShipments.includes(shipment.id)}
                            onCheckedChange={checked => {
                              if (checked) {
                                setSelectedShipments([
                                  ...selectedShipments,
                                  shipment.id,
                                ]);
                              } else {
                                setSelectedShipments(
                                  selectedShipments.filter(
                                    id => id !== shipment.id
                                  )
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {shipment.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {shipment.orderId}
                            </div>
                            {shipment.trackingNumber && (
                              <div className="text-sm text-blue-600">
                                #{shipment.trackingNumber}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {shipment.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {shipment.customerEmail}
                            </div>
                            {shipment.customerPhone && (
                              <div className="text-sm text-gray-500">
                                {shipment.customerPhone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{shipment.deliveryAddress.name}</div>
                            <div className="text-gray-500">
                              {shipment.deliveryAddress.city},{' '}
                              {shipment.deliveryAddress.state}
                            </div>
                            <div className="text-gray-500">
                              {shipment.deliveryAddress.postalCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusBadgeColor(shipment.status)}
                          >
                            {shipment.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {shipment.courierName && (
                              <>
                                <div className="font-medium">
                                  {shipment.courierName}
                                </div>
                                <div className="text-gray-500">
                                  {shipment.serviceName}
                                </div>
                              </>
                            )}
                            {!shipment.courierName && (
                              <span className="text-gray-400">
                                Not selected
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          RM {shipment.totalValue.toFixed(2)}
                          {shipment.weight && (
                            <div className="text-sm text-gray-500">
                              {shipment.weight}kg
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(shipment.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/admin/orders/${shipment.orderId}`}>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                            {shipment.labelGenerated && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={`/api/shipping/labels/${shipment.id}`}
                                  target="_blank"
                                >
                                  <Download className="w-3 h-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredShipments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No shipments found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pickup Scheduling Tab */}
        <TabsContent value="pickups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pickup Schedules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pickupSchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {formatDate(schedule.date, false)} - {schedule.timeSlot}
                      </div>
                      <div className="text-sm text-gray-500">
                        {schedule.shipmentCount} shipments • Contact:{' '}
                        {schedule.contactPerson}
                      </div>
                      <div className="text-sm text-gray-500">
                        Phone: {schedule.contactPhone}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadgeColor(schedule.status)}>
                        {schedule.status}
                      </Badge>
                      {schedule.status === 'PENDING' && (
                        <Button size="sm" variant="outline">
                          <Phone className="w-3 h-3 mr-1" />
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {pickupSchedules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pickup schedules found</p>
                    <p className="text-sm">
                      Schedule pickups from the "Pending Shipments" tab
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Label Management Tab */}
        <TabsContent value="labels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Label Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Use the "Pending Shipments" tab to select orders and
                    generate shipping labels in bulk. Generated labels will be
                    automatically saved and can be downloaded as a ZIP file.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <PrinterIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <h3 className="font-medium">Bulk Generation</h3>
                    <p className="text-sm text-gray-600">
                      Generate multiple labels at once
                    </p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <Download className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <h3 className="font-medium">ZIP Download</h3>
                    <p className="text-sm text-gray-600">
                      Download all labels as ZIP
                    </p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <h3 className="font-medium">Auto-Regenerate</h3>
                    <p className="text-sm text-gray-600">
                      Regenerate if labels are lost
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Fulfillment Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shippingStats && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Delivery Success Rate</span>
                      <span className="font-bold text-green-600">
                        {shippingStats.totalShipments > 0
                          ? (
                              (shippingStats.delivered /
                                shippingStats.totalShipments) *
                              100
                            ).toFixed(1)
                          : '0'}
                        %
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Delivery Time</span>
                      <span className="font-bold">
                        {shippingStats.averageDeliveryTime || 0} days
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Revenue</span>
                      <span className="font-bold text-blue-600">
                        RM {(shippingStats.totalRevenue || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shippingStats && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending Booking</span>
                      <Badge variant="outline">
                        {shippingStats.pendingBooking}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">In Transit</span>
                      <Badge variant="outline">{shippingStats.inTransit}</Badge>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Failed/Cancelled</span>
                      <Badge variant="outline">{shippingStats.failed}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
