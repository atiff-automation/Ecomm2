/**
 * Checkout Page - Malaysian E-commerce Platform
 * Complete checkout flow with membership registration integration
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  CreditCard,
  MapPin,
  User,
  Loader2,
  ArrowLeft,
  Shield,
  Truck,
  Award,
  Check,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MembershipCheckoutBanner from '@/components/membership/MembershipCheckoutBanner';

interface CheckoutItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    regularPrice: number;
    memberPrice: number;
    category: {
      id: string;
      name: string;
      qualifiesForMembership: boolean;
    };
    primaryImage?: {
      url: string;
      altText?: string;
    };
  };
}

interface CheckoutSummary {
  itemCount: number;
  subtotal: number;
  memberSubtotal: number;
  applicableSubtotal: number;
  potentialSavings: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  qualifyingTotal: number;
  membershipThreshold: number;
  isEligibleForMembership: boolean;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CheckoutItem[]>([]);
  const [checkoutSummary, setCheckoutSummary] =
    useState<CheckoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'MY',
  });

  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: session?.user?.email || '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'MY',
  });

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [orderNotes, setOrderNotes] = useState('');
  const [membershipActivated, setMembershipActivated] = useState(false);
  const [membershipPending, setMembershipPending] = useState(false);
  const [pendingMembershipMessage, setPendingMembershipMessage] = useState('');

  const isLoggedIn = !!session?.user;
  const isMember =
    session?.user?.isMember || (membershipActivated && !membershipPending);

  // Malaysian states
  const malaysianStates = [
    'Johor',
    'Kedah',
    'Kelantan',
    'Kuala Lumpur',
    'Labuan',
    'Malacca',
    'Negeri Sembilan',
    'Pahang',
    'Penang',
    'Perak',
    'Perlis',
    'Putrajaya',
    'Sabah',
    'Sarawak',
    'Selangor',
    'Terengganu',
  ];

  // Fetch checkout data
  const fetchCheckoutData = useCallback(async () => {
    if (!isLoggedIn) {
      router.push('/auth/signin?redirect=/checkout');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/cart');

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items);
        setCheckoutSummary(data.summary);

        // Redirect to cart if empty
        if (data.items.length === 0) {
          router.push('/cart');
          return;
        }

        // Pre-fill user info if available
        if (session?.user) {
          const [firstName, lastName] = session.user.name?.split(' ') || [
            '',
            '',
          ];
          setShippingAddress(prev => ({
            ...prev,
            firstName: firstName || '',
            lastName: lastName || '',
            email: session.user.email || '',
          }));
          setBillingAddress(prev => ({
            ...prev,
            firstName: firstName || '',
            lastName: lastName || '',
            email: session.user.email || '',
          }));
        }
      } else if (response.status === 401) {
        router.push('/auth/signin?redirect=/checkout');
      }
    } catch (error) {
      console.error('Failed to fetch checkout data:', error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, router, session?.user]);

  // Handle membership activation callback
  const handleMembershipActivated = (membershipData: any) => {
    if (membershipData.membershipStatus === 'pending_payment') {
      // Membership is pending payment - don't apply member pricing yet
      setMembershipPending(true);
      setPendingMembershipMessage(
        membershipData.message ||
          'Your membership will be activated after successful payment.'
      );
      // Don't refresh checkout data since member pricing shouldn't apply yet
    } else {
      // Membership is immediately active
      setMembershipActivated(true);
      fetchCheckoutData(); // Refresh to apply member pricing
    }
  };

  // Handle address input change
  const handleAddressChange = (
    type: 'shipping' | 'billing',
    field: keyof ShippingAddress,
    value: string
  ) => {
    if (type === 'shipping') {
      setShippingAddress(prev => ({ ...prev, [field]: value }));
      if (useSameAddress) {
        setBillingAddress(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setBillingAddress(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle same address toggle
  const handleUseSameAddressChange = (checked: boolean) => {
    setUseSameAddress(checked);
    if (checked) {
      setBillingAddress(shippingAddress);
    }
  };

  // Submit order
  const handleSubmitOrder = async () => {
    setProcessing(true);

    try {
      const orderData = {
        cartItems: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress,
        billingAddress: useSameAddress ? shippingAddress : billingAddress,
        paymentMethod,
        orderNotes,
        membershipActivated,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();
        // Redirect to payment or order confirmation
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
        } else {
          router.push(`/orders/${result.orderId}`);
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order submission error:', error);
      alert('Failed to submit order');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchCheckoutData();
  }, [fetchCheckoutData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to proceed to checkout
          </p>
          <Link href="/auth/signin?redirect=/checkout">
            <Button className="w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span>Loading checkout...</span>
        </div>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some products to your cart before checking out
          </p>
          <Link href="/products">
            <Button className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/cart">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-muted-foreground">
              Complete your order securely
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Checkout Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Membership Qualification Banner */}
          {checkoutSummary && (
            <MembershipCheckoutBanner
              cartItems={cartItems.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
              }))}
              onMembershipActivated={handleMembershipActivated}
            />
          )}

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={shippingAddress.firstName}
                    onChange={e =>
                      handleAddressChange(
                        'shipping',
                        'firstName',
                        e.target.value
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={shippingAddress.lastName}
                    onChange={e =>
                      handleAddressChange(
                        'shipping',
                        'lastName',
                        e.target.value
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={shippingAddress.email}
                    onChange={e =>
                      handleAddressChange('shipping', 'email', e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+60123456789"
                    value={shippingAddress.phone}
                    onChange={e =>
                      handleAddressChange('shipping', 'phone', e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={shippingAddress.address}
                  onChange={e =>
                    handleAddressChange('shipping', 'address', e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="address2">
                  Apartment, suite, etc. (optional)
                </Label>
                <Input
                  id="address2"
                  value={shippingAddress.address2}
                  onChange={e =>
                    handleAddressChange('shipping', 'address2', e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={e =>
                      handleAddressChange('shipping', 'city', e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={shippingAddress.state}
                    onValueChange={value =>
                      handleAddressChange('shipping', 'state', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {malaysianStates.map(state => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    value={shippingAddress.postcode}
                    onChange={e =>
                      handleAddressChange(
                        'shipping',
                        'postcode',
                        e.target.value
                      )
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Billing Address
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={useSameAddress}
                    onChange={e => handleUseSameAddressChange(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="sameAddress" className="text-sm font-normal">
                    Same as shipping address
                  </Label>
                </div>
              </CardTitle>
            </CardHeader>
            {!useSameAddress && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingFirstName">First Name *</Label>
                    <Input
                      id="billingFirstName"
                      value={billingAddress.firstName}
                      onChange={e =>
                        handleAddressChange(
                          'billing',
                          'firstName',
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingLastName">Last Name *</Label>
                    <Input
                      id="billingLastName"
                      value={billingAddress.lastName}
                      onChange={e =>
                        handleAddressChange(
                          'billing',
                          'lastName',
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingEmail">Email *</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      value={billingAddress.email}
                      onChange={e =>
                        handleAddressChange('billing', 'email', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingPhone">Phone *</Label>
                    <Input
                      id="billingPhone"
                      type="tel"
                      placeholder="+60123456789"
                      value={billingAddress.phone}
                      onChange={e =>
                        handleAddressChange('billing', 'phone', e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="billingAddress">Address *</Label>
                  <Input
                    id="billingAddress"
                    value={billingAddress.address}
                    onChange={e =>
                      handleAddressChange('billing', 'address', e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="billingAddress2">
                    Apartment, suite, etc. (optional)
                  </Label>
                  <Input
                    id="billingAddress2"
                    value={billingAddress.address2}
                    onChange={e =>
                      handleAddressChange('billing', 'address2', e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="billingCity">City *</Label>
                    <Input
                      id="billingCity"
                      value={billingAddress.city}
                      onChange={e =>
                        handleAddressChange('billing', 'city', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="billingState">State *</Label>
                    <Select
                      value={billingAddress.state}
                      onValueChange={value =>
                        handleAddressChange('billing', 'state', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {malaysianStates.map(state => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="billingPostcode">Postcode *</Label>
                    <Input
                      id="billingPostcode"
                      value={billingAddress.postcode}
                      onChange={e =>
                        handleAddressChange(
                          'billing',
                          'postcode',
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe">Credit/Debit Card (Stripe)</Label>
                  <Badge variant="secondary">Secure</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="billplz" id="billplz" />
                  <Label htmlFor="billplz">Online Banking (Billplz)</Label>
                  <Badge variant="secondary">Local Banks</Badge>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                placeholder="Special instructions for your order..."
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.primaryImage ? (
                      <Image
                        src={item.product.primaryImage.url}
                        alt={
                          item.product.primaryImage.altText || item.product.name
                        }
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <Badge className="absolute -top-2 -right-2 w-6 h-6 p-0 flex items-center justify-center text-xs">
                      {item.quantity}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {item.product.category.name}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatPrice(
                      (isMember
                        ? item.product.memberPrice
                        : item.product.regularPrice) * item.quantity
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          {checkoutSummary && (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex justify-between">
                  <span>Subtotal ({checkoutSummary.itemCount} items)</span>
                  <span>{formatPrice(checkoutSummary.subtotal)}</span>
                </div>

                {isMember && checkoutSummary.potentialSavings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Member Discount</span>
                    <span>
                      -{formatPrice(checkoutSummary.potentialSavings)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{formatPrice(checkoutSummary.shippingCost)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice(checkoutSummary.taxAmount)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(checkoutSummary.total)}</span>
                </div>

                {membershipActivated && !membershipPending && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800 font-medium">
                        Membership Activated!
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      You're now enjoying member pricing
                    </p>
                  </div>
                )}

                {membershipPending && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800 font-medium">
                        Membership Pending Payment
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      {pendingMembershipMessage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Place Order Button */}
          <Button
            onClick={handleSubmitOrder}
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Order...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Place Order{' '}
                {checkoutSummary && formatPrice(checkoutSummary.total)}
              </>
            )}
          </Button>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <Shield className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Secure Payment</p>
            </div>
            <div className="text-center">
              <Truck className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Fast Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
