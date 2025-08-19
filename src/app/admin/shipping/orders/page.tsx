/**
 * Admin Order Shipping Management
 * Interface for admin to select main and alternative couriers per order
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Truck,
  Package,
  Clock,
  DollarSign,
  Star,
  Shield,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit,
  Save,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  createdAt: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    postcode: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    weight: number;
  }>;
  shipping?: {
    courierName?: string;
    serviceName?: string;
    price?: number;
    trackingNumber?: string;
    status?: string;
  };
}

interface CourierRate {
  courier_id: string;
  courier_name: string;
  service_name: string;
  service_type: string;
  price: number;
  estimated_delivery_days: number;
  estimated_delivery: string;
  features: {
    insurance_available: boolean;
    cod_available: boolean;
    signature_required_available: boolean;
  };
  description?: string;
}

interface CourierSelectionData {
  orderId: string;
  mainCourier: CourierRate | null;
  alternativeCourier: CourierRate | null;
  availableRates: CourierRate[];
  selectionReason: string;
}

export default function AdminOrderShippingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [courierSelection, setCourierSelection] = useState<CourierSelectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders?status=pending_shipping');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadCourierRates = async (order: Order) => {
    try {
      setLoadingRates(true);
      setSelectedOrder(order);

      // Calculate total weight from order items
      const totalWeight = order.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      const orderValue = order.total;

      const response = await fetch('/api/admin/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          destination: {
            postcode: order.shippingAddress.postcode,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
          },
          parcel: {
            weight: Math.max(0.1, totalWeight),
            declared_value: orderValue,
            length: 20,
            width: 15,
            height: 10,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCourierSelection({
          orderId: order.id,
          mainCourier: data.recommendedMain || null,
          alternativeCourier: data.recommendedAlternative || null,
          availableRates: data.rates || [],
          selectionReason: data.reason || 'Available courier options',
        });
      } else {
        throw new Error('Failed to fetch courier rates');
      }
    } catch (error) {
      console.error('Failed to load courier rates:', error);
      toast.error('Failed to load courier rates');
    } finally {
      setLoadingRates(false);
    }
  };

  const saveCourierSelection = async () => {
    if (!courierSelection || !courierSelection.mainCourier) {
      toast.error('Please select a main courier');
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch('/api/admin/shipping/assign-couriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: courierSelection.orderId,
          mainCourier: courierSelection.mainCourier,
          alternativeCourier: courierSelection.alternativeCourier,
          selectionReason: courierSelection.selectionReason,
        }),
      });

      if (response.ok) {
        toast.success('Courier selection saved successfully');
        await loadOrders(); // Refresh orders list
        setCourierSelection(null);
        setSelectedOrder(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save courier selection');
      }
    } catch (error) {
      console.error('Failed to save courier selection:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save courier selection');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatPrice = (price: number) => `RM ${price.toFixed(2)}`;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PENDING': 'outline',
      'CONFIRMED': 'secondary',
      'SHIPPED': 'default',
      'DELIVERED': 'default',
      'CANCELLED': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="p-6">Loading orders...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Truck className="h-8 w-8" />
          Order Shipping Management
        </h1>
        <Button onClick={loadOrders} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Orders</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by order number or customer name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="SHIPPED">Shipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Requiring Shipping Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Shipping</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {order.shippingAddress.city}, {order.shippingAddress.state}
                      <br />
                      {order.shippingAddress.postcode}
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.shipping ? (
                      <div className="text-sm">
                        <div className="font-medium">{order.shipping.courierName}</div>
                        <div className="text-gray-500">{formatPrice(order.shipping.price || 0)}</div>
                      </div>
                    ) : (
                      <Badge variant="outline">Not Assigned</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          onClick={() => loadCourierRates(order)}
                          disabled={loadingRates}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {order.shipping ? 'Change' : 'Assign'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Select Couriers for Order {order.orderNumber}</DialogTitle>
                          <DialogDescription>
                            Choose main and alternative courier options for this shipment
                          </DialogDescription>
                        </DialogHeader>

                        {loadingRates ? (
                          <div className="flex items-center justify-center p-8">
                            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                            Loading courier rates...
                          </div>
                        ) : courierSelection && (
                          <CourierSelectionForm
                            selection={courierSelection}
                            onSelectionChange={setCourierSelection}
                            onSave={saveCourierSelection}
                            saving={saving}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Courier Selection Form Component
function CourierSelectionForm({ 
  selection, 
  onSelectionChange, 
  onSave, 
  saving 
}: {
  selection: CourierSelectionData;
  onSelectionChange: (selection: CourierSelectionData) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const formatPrice = (price: number) => `RM ${price.toFixed(2)}`;

  const handleMainCourierChange = (rate: CourierRate) => {
    onSelectionChange({
      ...selection,
      mainCourier: rate,
    });
  };

  const handleAlternativeCourierChange = (rate: CourierRate) => {
    onSelectionChange({
      ...selection,
      alternativeCourier: rate,
    });
  };

  return (
    <div className="space-y-6">
      {/* Available Rates Overview */}
      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Found {selection.availableRates.length} courier options. 
          Select one main courier and optionally one alternative courier for fallback.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="main" className="w-full">
        <TabsList>
          <TabsTrigger value="main">Main Courier Selection</TabsTrigger>
          <TabsTrigger value="alternative">Alternative Courier (Optional)</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Select Main Courier
          </h3>
          
          <RadioGroup 
            value={selection.mainCourier?.courier_id || ''} 
            onValueChange={(value) => {
              const selectedRate = selection.availableRates.find(rate => rate.courier_id === value);
              if (selectedRate) {
                handleMainCourierChange(selectedRate);
              }
            }}
          >
            <div className="grid gap-3">
              {selection.availableRates.map((rate) => (
                <div key={`main-${rate.courier_id}-${rate.service_name}`} className="flex items-center space-x-2">
                  <RadioGroupItem value={rate.courier_id} id={`main-${rate.courier_id}`} />
                  <label htmlFor={`main-${rate.courier_id}`} className="flex-1 cursor-pointer">
                    <Card className={`transition-colors ${selection.mainCourier?.courier_id === rate.courier_id ? 'ring-2 ring-blue-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{rate.courier_name}</h4>
                            <p className="text-sm text-gray-600">{rate.service_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {rate.estimated_delivery}
                              </span>
                              {rate.features.insurance_available && (
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Insurance
                                </span>
                              )}
                              {rate.features.cod_available && (
                                <Badge variant="outline" className="text-xs">COD Available</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatPrice(rate.price)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {rate.service_type}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </TabsContent>

        <TabsContent value="alternative" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Select Alternative Courier (Fallback)
            </h3>
            {selection.alternativeCourier && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleAlternativeCourierChange(null as any)}
              >
                Clear Selection
              </Button>
            )}
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Alternative courier will be used if the main courier fails during booking or becomes unavailable.
            </AlertDescription>
          </Alert>

          <RadioGroup 
            value={selection.alternativeCourier?.courier_id || ''} 
            onValueChange={(value) => {
              if (!value) return;
              const selectedRate = selection.availableRates.find(rate => rate.courier_id === value);
              if (selectedRate) {
                handleAlternativeCourierChange(selectedRate);
              }
            }}
          >
            <div className="grid gap-3">
              {selection.availableRates
                .filter(rate => rate.courier_id !== selection.mainCourier?.courier_id)
                .map((rate) => (
                <div key={`alt-${rate.courier_id}-${rate.service_name}`} className="flex items-center space-x-2">
                  <RadioGroupItem value={rate.courier_id} id={`alt-${rate.courier_id}`} />
                  <label htmlFor={`alt-${rate.courier_id}`} className="flex-1 cursor-pointer">
                    <Card className={`transition-colors ${selection.alternativeCourier?.courier_id === rate.courier_id ? 'ring-2 ring-blue-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{rate.courier_name}</h4>
                            <p className="text-sm text-gray-600">{rate.service_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {rate.estimated_delivery}
                              </span>
                              {rate.features.insurance_available && (
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Insurance
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {formatPrice(rate.price)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {rate.service_type}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </TabsContent>
      </Tabs>

      {/* Selection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selection Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label className="font-medium">Main Courier:</Label>
              {selection.mainCourier ? (
                <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{selection.mainCourier.courier_name}</span>
                      <span className="text-sm text-gray-600 ml-2">({selection.mainCourier.service_name})</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatPrice(selection.mainCourier.price)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded text-gray-500">
                  No main courier selected
                </div>
              )}
            </div>

            <div>
              <Label className="font-medium">Alternative Courier:</Label>
              {selection.alternativeCourier ? (
                <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{selection.alternativeCourier.courier_name}</span>
                      <span className="text-sm text-gray-600 ml-2">({selection.alternativeCourier.service_name})</span>
                    </div>
                    <span className="font-bold text-blue-600">
                      {formatPrice(selection.alternativeCourier.price)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded text-gray-500">
                  No alternative courier selected
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={onSave}
          disabled={!selection.mainCourier || saving}
          className="min-w-32"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Selection'}
        </Button>
      </div>
    </div>
  );
}