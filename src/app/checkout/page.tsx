/**
 * Checkout Page - Malaysian E-commerce Platform
 * Complete checkout flow with membership registration integration
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
  AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { useFreshMembership } from '@/hooks/use-fresh-membership';
import { getBestPrice } from '@/lib/promotions/promotion-utils';
import { malaysianStatesOptions } from '@/lib/validation/settings';
import MembershipCheckoutBanner from '@/components/membership/MembershipCheckoutBanner';
import ShippingSelector from '@/components/checkout/ShippingSelector';
import PaymentMethodSelection from '@/components/checkout/PaymentMethodSelection';
import type { ShippingOption, DeliveryAddress } from '@/lib/shipping/types';
// API endpoints for postcode validation (client-safe)

interface CheckoutItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    regularPrice: number;
    memberPrice: number;
    categories: Array<{
      category: {
        id: string;
        name: string;
        qualifiesForMembership: boolean;
      };
    }>;
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
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  // Use centralized cart service
  const {
    cart,
    isLoading: cartLoading,
    error: cartError,
    totalItems,
    subtotal,
    total,
    memberDiscount,
    promotionalDiscount,
    qualifiesForMembership,
    membershipProgress,
    membershipRemaining,
    refreshCart,
  } = useCart();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
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
    email: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'MY',
  });

  const [useSameAddress, setUseSameAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [hasAvailableGateways, setHasAvailableGateways] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState<string>('');
  const [membershipActivated, setMembershipActivated] = useState(false);
  const [membershipPending, setMembershipPending] = useState(false);
  const [pendingMembershipMessage, setPendingMembershipMessage] = useState('');
  const [paymentProcessed, setPaymentProcessed] = useState(() => {
    // Check if we have payment result parameters on initial load
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.has('payment');
    }
    return false;
  });

  // Shipping state (new simplified implementation)
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [calculatedWeight, setCalculatedWeight] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [freeShippingApplied, setFreeShippingApplied] = useState(false);

  // Postcode validation state
  const [postcodeValidation, setPostcodeValidation] = useState<{
    shipping: {
      valid: boolean;
      error?: string;
      loading?: boolean;
      manualEntry?: boolean;
    };
    billing: {
      valid: boolean;
      error?: string;
      loading?: boolean;
      manualEntry?: boolean;
    };
  }>({
    shipping: { valid: true },
    billing: { valid: true },
  });

  const freshMembership = useFreshMembership();

  const isLoggedIn = freshMembership.isLoggedIn;
  const isMember =
    freshMembership.isMember || (membershipActivated && !membershipPending);

  // Memoize cartItems for MembershipCheckoutBanner to prevent unnecessary re-renders
  const memoizedCartItems = useMemo(() => {
    return (
      cart?.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      })) || []
    );
  }, [cart?.items]);

  // Malaysian states from enhanced database service
  // Use static malaysianStatesOptions for consistency with business profile

  // Initialize checkout data using cart service
  const initializeCheckoutData = useCallback(async () => {
    try {
      setLoading(true);

      // If we're processing payment, don't fetch cart or redirect
      if (paymentProcessed) {
        console.log(
          '⏸️ Payment already processed, skipping cart initialization'
        );
        setLoading(false);
        return;
      }

      // DON'T refresh cart here - use cached data from cart service to avoid fetching stale database data

      // Check if we have payment parameters in URL - if so, don't redirect to cart
      const urlParams = new URLSearchParams(window.location.search);
      const hasPaymentParams =
        urlParams.has('payment') && urlParams.has('orderRef');

      // FIXED: Use totalItems from cart service instead of cart.items.length for consistency
      // This prevents the checkout page from thinking cart is empty when it has items
      const isCartLoaded = !cartLoading && cart !== null;

      console.log('📊 Checkout cart state check:', {
        totalItems,
        cartItemsLength: cart?.items?.length,
        cartLoading,
        isCartLoaded,
        hasPaymentParams,
      });

      // Only redirect to cart if empty AND not processing payment AND no payment params AND cart is loaded
      // Use totalItems from cart service for consistency across components
      if (totalItems === 0 && !hasPaymentParams && isCartLoaded) {
        console.log('🔄 Cart is empty, redirecting to cart page');
        router.push('/cart');
        return;
      } else if (totalItems === 0 && hasPaymentParams) {
        console.log(
          '⏸️ Cart empty but payment params detected, staying on checkout'
        );
      } else if (totalItems > 0) {
        console.log('✅ Cart has items, proceeding with checkout');
      }

      // Malaysian states now handled via static import from settings.ts

      // Pre-fill user info and default address if available
      if (session?.user) {
        try {
          // Try to fetch user's default address
          const addressResponse = await fetch('/api/user/default-address');
          if (addressResponse.ok) {
            const { address } = await addressResponse.json();

            if (address) {
              // Use saved address
              setShippingAddress(address);
              if (useSameAddress) {
                setBillingAddress(address);
              }
            } else {
              // Fallback to basic user info
              const [firstName, lastName] = session.user.name?.split(' ') || [
                '',
                '',
              ];
              const basicInfo = {
                firstName: firstName || '',
                lastName: lastName || '',
                email: session.user.email || '',
                phone: '',
                address: '',
                address2: '',
                city: '',
                state: '',
                postcode: '',
                country: 'MY',
              };
              setShippingAddress(prev => ({ ...prev, ...basicInfo }));
              setBillingAddress(prev => ({ ...prev, ...basicInfo }));
            }
          } else {
            // Fallback to basic user info if API fails
            const [firstName, lastName] = session.user.name?.split(' ') || [
              '',
              '',
            ];
            const basicInfo = {
              firstName: firstName || '',
              lastName: lastName || '',
              email: session.user.email || '',
              phone: '',
              address: '',
              address2: '',
              city: '',
              state: '',
              postcode: '',
              country: 'MY',
            };
            setShippingAddress(prev => ({ ...prev, ...basicInfo }));
            setBillingAddress(prev => ({ ...prev, ...basicInfo }));
          }
        } catch (error) {
          console.error('Error fetching default address:', error);
          // Fallback to basic user info
          const [firstName, lastName] = session.user.name?.split(' ') || [
            '',
            '',
          ];
          const basicInfo = {
            firstName: firstName || '',
            lastName: lastName || '',
            email: session.user.email || '',
            phone: '',
            address: '',
            address2: '',
            city: '',
            state: '',
            postcode: '',
            country: 'MY',
          };
          setShippingAddress(prev => ({ ...prev, ...basicInfo }));
          setBillingAddress(prev => ({ ...prev, ...basicInfo }));
        }
      }
    } catch (error) {
      console.error('Failed to initialize checkout data:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, paymentProcessed, router, totalItems, cartLoading]); // Removed useSameAddress and cart from dependencies

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
      // Cart data will automatically refresh through cart service hooks
    }
  };

  // Handle postcode change with auto-fill
  const handlePostcodeChange = (
    addressType: 'shipping' | 'billing',
    postcode: string
  ) => {
    // Update the postcode value immediately
    const addressSetter =
      addressType === 'shipping' ? setShippingAddress : setBillingAddress;
    addressSetter(prev => ({ ...prev, postcode }));

    // TEMPORARY: Disable postcode validation/autofill until API endpoint is created
    setPostcodeValidation(prev => ({
      ...prev,
      [addressType]: { valid: true, loading: false },
    }));
  };

  // Handle address input change
  // Helper function to render field errors
  const renderFieldError = (fieldPath: string) => {
    const error = fieldErrors[fieldPath];
    if (!error) {
      return null;
    }

    return (
      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {error}
      </p>
    );
  };

  // Clear field errors when user starts typing
  const clearFieldError = (fieldPath: string) => {
    if (fieldErrors[fieldPath]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldPath];
        return newErrors;
      });
    }

    // Clear general order error when user starts fixing issues
    if (orderError) {
      setOrderError('');
    }
  };

  const handleAddressChange = (
    type: 'shipping' | 'billing',
    field: keyof ShippingAddress,
    value: string
  ) => {
    // Clear field-specific error
    clearFieldError(`${type}Address.${field}`);

    // Clear general error
    if (orderError) {
      setOrderError('');
    }
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

  // Check if shipping address is complete for shipping calculation
  const isAddressComplete = (address: ShippingAddress): boolean => {
    return !!(
      address.firstName &&
      address.lastName &&
      address.phone &&
      address.address &&
      address.city &&
      address.state &&
      address.postcode &&
      address.postcode.length === 5
    );
  };

  // Handle shipping selection from ShippingSelector component
  // FIXED: Removed fieldErrors dependency to prevent unnecessary recalculations during order submission
  const handleShippingSelected = useCallback(
    (option: ShippingOption | null, weight?: number) => {
      setSelectedShipping(option);
      setShippingCost(option?.cost || 0);
      setFreeShippingApplied(option?.freeShipping || false);

      // CRITICAL: Update calculated weight from API response
      if (weight !== undefined) {
        setCalculatedWeight(weight);
        console.log('✅ Weight updated from shipping calculation:', weight);
      }

      // Clear shipping error if exists - using functional update to avoid dependency
      setFieldErrors(prev => {
        if (prev['shipping']) {
          const newErrors = { ...prev };
          delete newErrors['shipping'];
          return newErrors;
        }
        return prev;
      });
    },
    []
  ); // Empty dependencies - all state updates use functional form

  // Memoize deliveryAddress to prevent recreation on every render
  const memoizedDeliveryAddress = useMemo(
    () => ({
      name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      phone: shippingAddress.phone,
      addressLine1: shippingAddress.address,
      addressLine2: shippingAddress.address2 || '',
      city: shippingAddress.city,
      state: shippingAddress.state as DeliveryAddress['state'],
      postalCode: shippingAddress.postcode,
      country: 'MY' as const,
    }),
    [
      shippingAddress.firstName,
      shippingAddress.lastName,
      shippingAddress.phone,
      shippingAddress.address,
      shippingAddress.address2,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.postcode,
    ]
  );

  // Handle payment method change - wrapped in useCallback to prevent re-renders
  const handlePaymentMethodChange = useCallback((method: string) => {
    console.log('💳 Payment method selected:', method);
    setPaymentMethod(method);
    // Clear any previous payment-related errors
    setOrderError('');
  }, []);

  // Handle payment methods loaded callback - wrapped in useCallback
  const handlePaymentMethodsLoaded = useCallback((hasGateways: boolean) => {
    console.log('💳 Payment gateways availability:', { hasGateways });
    setHasAvailableGateways(hasGateways);
  }, []);

  // Submit order
  const handleSubmitOrder = async () => {
    setProcessing(true);
    setOrderError('');
    setFieldErrors({});

    try {
      // Check if cart is empty using totalItems for consistency
      if (!cart || totalItems === 0) {
        setOrderError(
          'Your cart is empty. Please add items before proceeding.'
        );
        setProcessing(false);
        router.push('/cart');
        return;
      }

      // Client-side validation before submitting
      const errors: { [key: string]: string } = {};

      // Validate shipping address
      if (!shippingAddress.firstName.trim()) {
        errors['shippingAddress.firstName'] = 'First name is required';
      }
      if (!shippingAddress.lastName.trim()) {
        errors['shippingAddress.lastName'] = 'Last name is required';
      }
      if (!shippingAddress.phone.trim()) {
        errors['shippingAddress.phone'] = 'Phone number is required';
      }
      if (!shippingAddress.address.trim()) {
        errors['shippingAddress.address'] = 'Address is required';
      }
      if (!shippingAddress.city.trim()) {
        errors['shippingAddress.city'] = 'City is required';
      }
      if (!shippingAddress.state.trim()) {
        errors['shippingAddress.state'] = 'State is required';
      }
      if (!shippingAddress.postcode.trim()) {
        errors['shippingAddress.postcode'] = 'Postcode is required';
      } else if (
        !postcodeValidation.shipping.valid &&
        !postcodeValidation.shipping.manualEntry
      ) {
        errors['shippingAddress.postcode'] =
          'Please enter a valid Malaysian postcode for accurate shipping calculation';
      }

      // Validate billing address if different from shipping
      if (!useSameAddress) {
        if (!billingAddress.firstName.trim()) {
          errors['billingAddress.firstName'] = 'First name is required';
        }
        if (!billingAddress.lastName.trim()) {
          errors['billingAddress.lastName'] = 'Last name is required';
        }
        if (!billingAddress.phone.trim()) {
          errors['billingAddress.phone'] = 'Phone number is required';
        }
        if (!billingAddress.address.trim()) {
          errors['billingAddress.address'] = 'Address is required';
        }
        if (!billingAddress.city.trim()) {
          errors['billingAddress.city'] = 'City is required';
        }
        if (!billingAddress.state.trim()) {
          errors['billingAddress.state'] = 'State is required';
        }
        if (!billingAddress.postcode.trim()) {
          errors['billingAddress.postcode'] = 'Postcode is required';
        } else if (
          !postcodeValidation.billing.valid &&
          !postcodeValidation.billing.manualEntry
        ) {
          errors['billingAddress.postcode'] =
            'Please enter a valid Malaysian postcode';
        }
      }

      // Validate shipping selection
      if (!selectedShipping) {
        errors['shipping'] =
          'Shipping method not available. Please check your address.';
      }

      // Validate payment method selection
      if (!paymentMethod) {
        errors['paymentMethod'] = 'Please select a payment method';
      } else if (!hasAvailableGateways) {
        errors['paymentMethod'] =
          'No payment gateways are currently available. Please try again later.';
      }

      // If there are validation errors, show them and stop processing
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setOrderError('Please fill in all required fields');
        setProcessing(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // For testing purposes, create order first then redirect to test payment gateway
      if (process.env.NODE_ENV === 'development') {
        // Create the order first in development mode
        const orderData = {
          cartItems: cart?.items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          shippingAddress,
          billingAddress: useSameAddress ? shippingAddress : billingAddress,
          // CRITICAL: Include shipping data from ShippingSelector
          selectedShipping: selectedShipping,
          calculatedWeight: calculatedWeight,
          paymentMethod,
          membershipActivated: membershipActivated || membershipPending, // Include pending memberships
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

          // Redirect to payment URL returned from the order API
          if (result.paymentUrl) {
            console.log('🔗 Redirecting to payment URL:', result.paymentUrl);
            router.push(result.paymentUrl);
          } else {
            // Fallback to test payment gateway if no payment URL provided
            console.log(
              '⚠️ No payment URL provided, using test payment gateway'
            );
            const paymentParams = new URLSearchParams({
              amount: total.toString() || '100',
              currency: 'MYR',
              orderRef: result.orderNumber,
              returnUrl: '/checkout',
            });
            router.push(`/test-payment-gateway?${paymentParams.toString()}`);
          }
        } else {
          const error = await response.json();
          setOrderError(error.message || 'Failed to create order');
          setFieldErrors(error.fieldErrors || {});

          // Scroll to top to show error message
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      // Production flow - create order and get real payment URL
      const orderData = {
        cartItems: cart?.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress,
        billingAddress: useSameAddress ? shippingAddress : billingAddress,
        // CRITICAL: Include shipping data from ShippingSelector
        selectedShipping: selectedShipping,
        calculatedWeight: calculatedWeight,
        paymentMethod,
        membershipActivated: membershipActivated || membershipPending, // Include pending memberships
      };

      console.log('🔄 Creating order with payment method:', paymentMethod);

      // First create the order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        setOrderError(error.message || 'Failed to create order');
        setFieldErrors(error.fieldErrors || {});
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const orderResult = await orderResponse.json();
      console.log('✅ Order created successfully:', orderResult.orderNumber);

      // Now create payment bill using the multi-gateway API
      const paymentData = {
        orderId: orderResult.orderId, // Use orderId instead of orderNumber
        amount: total + shippingCost,
        customerInfo: {
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
        },
        description: `Order ${orderResult.orderNumber} - ${cart?.items.length} items`,
        paymentMethod: paymentMethod, // Use selected payment method
      };

      console.log('💳 Creating payment bill:', {
        method: paymentMethod,
        amount: paymentData.amount,
        orderNumber: paymentData.orderNumber,
      });

      console.log('💳 Redirecting to payment gateway...');

      // Use window.location to navigate to the API endpoint
      // The API will perform a server-side redirect to the payment gateway
      window.location.href = `/api/payment/create-bill?orderId=${encodeURIComponent(orderResult.orderId)}`;
    } catch (error) {
      console.error('Order submission error:', error);
      setOrderError(
        'Failed to submit order. Please check your connection and try again.'
      );
      setFieldErrors({});

      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setProcessing(false);
    }
  };

  // Handle payment result from test gateway - prevent multiple processing
  // This MUST run before fetchCheckoutData to prevent empty cart redirect
  useEffect(() => {
    const handlePaymentResult = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentResult = urlParams.get('payment');
      const orderRef = urlParams.get('orderRef');
      const amount = urlParams.get('amount');

      console.log('🔍 Checking URL params:', {
        hasPayment: !!paymentResult,
        hasOrderRef: !!orderRef,
        paymentProcessed,
        currentUrl: window.location.href,
      });

      if (paymentResult && orderRef && !paymentProcessed) {
        console.log('🔔 Payment result detected:', {
          paymentResult,
          orderRef,
          amount,
        });
        setPaymentProcessed(true);

        // Clear URL params immediately to prevent re-processing
        window.history.replaceState({}, '', window.location.pathname);

        // Only handle failed payments here - successful payments now go directly to thank-you page
        if (paymentResult === 'failed') {
          alert(
            `❌ Payment Failed\n\nOrder: ${orderRef}\nPlease try again or use a different payment method.`
          );
          setPaymentProcessed(false); // Allow retry
        }
        // Note: Successful payments are now handled directly by payment gateway -> thank-you page
      }
    };

    handlePaymentResult();
  }, []); // Remove dependencies to ensure it runs on mount

  // Initialize email from session once
  useEffect(() => {
    if (
      session?.user?.email &&
      !shippingAddress.email &&
      !billingAddress.email
    ) {
      const email = session.user.email;
      setShippingAddress(prev => ({ ...prev, email }));
      setBillingAddress(prev => ({ ...prev, email }));
    }
  }, [session?.user?.email, shippingAddress.email, billingAddress.email]);

  // Fetch checkout data after payment processing is set up
  useEffect(() => {
    initializeCheckoutData();
  }, [initializeCheckoutData]);

  // Simplified cart synchronization - only listen for essential updates
  useEffect(() => {
    const handleCartUpdated = () => {
      // Only refresh if we're not processing a payment
      if (!processing) {
        initializeCheckoutData();
      }
    };

    // Only listen for direct cart updates, not all storage/focus changes
    window.addEventListener('cart_updated', handleCartUpdated);

    return () => {
      window.removeEventListener('cart_updated', handleCartUpdated);
    };
  }, [processing]); // Remove fetchCheckoutData dependency

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(price);
  };

  // Remove this authentication check - allow guest checkout

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

  // Use totalItems for consistency with cart service instead of cart?.items.length
  if (!cart || totalItems === 0) {
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

      {/* Error Display */}
      {orderError && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {orderError}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Checkout Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Membership Qualification Banner */}
          {cart && (
            <MembershipCheckoutBanner
              cartItems={memoizedCartItems}
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
              <Alert className="mt-2">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Auto-fill:</strong> Enter your 5-digit Malaysian
                  postcode and we'll automatically fill in your state and city
                  for accurate shipping calculation.
                </AlertDescription>
              </Alert>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingFirstName">First Name *</Label>
                  <Input
                    id="shippingFirstName"
                    value={shippingAddress.firstName}
                    onChange={e =>
                      handleAddressChange(
                        'shipping',
                        'firstName',
                        e.target.value
                      )
                    }
                    required
                    className="h-12 sm:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingLastName">Last Name *</Label>
                  <Input
                    id="shippingLastName"
                    value={shippingAddress.lastName}
                    onChange={e =>
                      handleAddressChange(
                        'shipping',
                        'lastName',
                        e.target.value
                      )
                    }
                    required
                    className="h-12 sm:h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingEmail">Email *</Label>
                  <Input
                    id="shippingEmail"
                    type="email"
                    value={shippingAddress.email}
                    onChange={e =>
                      handleAddressChange('shipping', 'email', e.target.value)
                    }
                    required
                    className="h-12 sm:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingPhone">Phone *</Label>
                  <Input
                    id="shippingPhone"
                    type="tel"
                    placeholder="+60123456789"
                    value={shippingAddress.phone}
                    onChange={e =>
                      handleAddressChange('shipping', 'phone', e.target.value)
                    }
                    required
                    className={`h-12 sm:h-10 ${
                      fieldErrors['shippingAddress.phone']
                        ? 'border-red-300 focus:border-red-500'
                        : ''
                    }`}
                  />
                  {renderFieldError('shippingAddress.phone')}
                </div>
              </div>

              <div>
                <Label htmlFor="shippingAddress">Address *</Label>
                <Input
                  id="shippingAddress"
                  value={shippingAddress.address}
                  onChange={e =>
                    handleAddressChange('shipping', 'address', e.target.value)
                  }
                  required
                  className={
                    fieldErrors['shippingAddress.address']
                      ? 'border-red-300 focus:border-red-500'
                      : ''
                  }
                />
                {renderFieldError('shippingAddress.address')}
              </div>

              <div>
                <Label htmlFor="shippingAddress2">
                  Apartment, suite, etc. (optional)
                </Label>
                <Input
                  id="shippingAddress2"
                  value={shippingAddress.address2}
                  onChange={e =>
                    handleAddressChange('shipping', 'address2', e.target.value)
                  }
                />
              </div>

              {/* Address fields ordered for optimal auto-fill workflow: Postcode → City → State */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Postal Code - First position for auto-fill workflow */}
                <div>
                  <Label htmlFor="shippingPostcode">
                    Postcode *
                    {postcodeValidation.shipping.loading && (
                      <span className="ml-2 text-xs text-blue-600">
                        <Loader2 className="inline h-3 w-3 animate-spin" />{' '}
                        Looking up...
                      </span>
                    )}
                  </Label>
                  <Input
                    id="shippingPostcode"
                    value={shippingAddress.postcode}
                    onChange={e =>
                      handlePostcodeChange('shipping', e.target.value)
                    }
                    placeholder="e.g. 50000"
                    maxLength={5}
                    required
                    className={`h-12 md:h-10 ${
                      !postcodeValidation.shipping.valid
                        ? 'border-red-300 focus:border-red-500'
                        : postcodeValidation.shipping.loading
                          ? 'border-blue-300 focus:border-blue-500'
                          : ''
                    }`}
                  />
                  {!postcodeValidation.shipping.valid &&
                    postcodeValidation.shipping.error && (
                      <p className="mt-1 text-xs text-red-600">
                        {postcodeValidation.shipping.error}
                      </p>
                    )}
                  {postcodeValidation.shipping.valid &&
                    shippingAddress.postcode.length === 5 && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Valid Malaysian postcode
                      </p>
                    )}
                </div>
                {/* City - Second position, auto-filled from postcode */}
                <div>
                  <Label htmlFor="shippingCity">
                    City *
                    {postcodeValidation.shipping.manualEntry && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Manual Entry
                      </Badge>
                    )}
                  </Label>
                  <Input
                    id="shippingCity"
                    value={shippingAddress.city}
                    onChange={e =>
                      handleAddressChange('shipping', 'city', e.target.value)
                    }
                    placeholder={
                      postcodeValidation.shipping.manualEntry
                        ? 'Enter city manually'
                        : 'Auto-filled from postcode'
                    }
                    className={`h-12 md:h-10 ${postcodeValidation.shipping.manualEntry ? 'border-orange-300 focus:border-orange-500' : ''}`}
                    required
                  />
                </div>
                {/* State - Third position, auto-filled from postcode */}
                <div>
                  <Label htmlFor="shippingState">
                    State *
                    {postcodeValidation.shipping.manualEntry && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Manual Entry
                      </Badge>
                    )}
                  </Label>
                  <Select
                    value={shippingAddress.state}
                    onValueChange={value =>
                      handleAddressChange('shipping', 'state', value)
                    }
                  >
                    <SelectTrigger className="h-12 md:h-10">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {malaysianStatesOptions.map(state => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Method Selection - New Simple Implementation */}
          {isAddressComplete(shippingAddress) && (
            <ShippingSelector
              deliveryAddress={memoizedDeliveryAddress}
              items={memoizedCartItems}
              orderValue={total}
              onShippingSelected={handleShippingSelected}
            />
          )}

          {/* Shipping validation error display */}
          {fieldErrors['shipping'] && (
            <Alert className="border-red-200 bg-red-50 -mt-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {fieldErrors['shipping']}
              </AlertDescription>
            </Alert>
          )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className="h-12 sm:h-10"
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
                      className="h-12 sm:h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      className="h-12 sm:h-10"
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
                      className="h-12 sm:h-10"
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

                {/* Address fields ordered for optimal auto-fill workflow: Postcode → City → State */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Postal Code - First position for auto-fill workflow */}
                  <div>
                    <Label htmlFor="billingPostcode">
                      Postcode *
                      {postcodeValidation.billing.loading && (
                        <span className="ml-2 text-xs text-blue-600">
                          <Loader2 className="inline h-3 w-3 animate-spin" />{' '}
                          Looking up...
                        </span>
                      )}
                    </Label>
                    <Input
                      id="billingPostcode"
                      value={billingAddress.postcode}
                      onChange={e =>
                        handlePostcodeChange('billing', e.target.value)
                      }
                      placeholder="e.g. 50000"
                      maxLength={5}
                      required
                      className={`h-12 md:h-10 ${
                        !postcodeValidation.billing.valid
                          ? 'border-red-300 focus:border-red-500'
                          : postcodeValidation.billing.loading
                            ? 'border-blue-300 focus:border-blue-500'
                            : ''
                      }`}
                    />
                    {!postcodeValidation.billing.valid &&
                      postcodeValidation.billing.error && (
                        <p className="mt-1 text-xs text-red-600">
                          {postcodeValidation.billing.error}
                        </p>
                      )}
                    {postcodeValidation.billing.valid &&
                      billingAddress.postcode.length === 5 && (
                        <p className="mt-1 text-xs text-green-600">
                          ✓ Valid Malaysian postcode
                        </p>
                      )}
                  </div>
                  {/* City - Second position, auto-filled from postcode */}
                  <div>
                    <Label htmlFor="billingCity">
                      City *
                      {postcodeValidation.billing.manualEntry && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Manual Entry
                        </Badge>
                      )}
                    </Label>
                    <Input
                      id="billingCity"
                      value={billingAddress.city}
                      onChange={e =>
                        handleAddressChange('billing', 'city', e.target.value)
                      }
                      placeholder={
                        postcodeValidation.billing.manualEntry
                          ? 'Enter city manually'
                          : 'Auto-filled from postcode'
                      }
                      className={`h-12 md:h-10 ${postcodeValidation.billing.manualEntry ? 'border-orange-300 focus:border-orange-500' : ''}`}
                      required
                    />
                  </div>
                  {/* State - Third position, auto-filled from postcode */}
                  <div>
                    <Label htmlFor="billingState">
                      State *
                      {postcodeValidation.billing.manualEntry && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Manual Entry
                        </Badge>
                      )}
                    </Label>
                    <Select
                      value={billingAddress.state}
                      onValueChange={value =>
                        handleAddressChange('billing', 'state', value)
                      }
                    >
                      <SelectTrigger className="h-12 md:h-10">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {malaysianStatesOptions.map(state => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Payment Method - Dynamic Selection */}
          <PaymentMethodSelection
            selectedMethod={paymentMethod}
            onMethodChange={handlePaymentMethodChange}
            onMethodsLoaded={handlePaymentMethodsLoaded}
          />

          {/* Payment Method Validation Error */}
          {fieldErrors['paymentMethod'] && (
            <Alert className="border-red-200 bg-red-50 -mt-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {fieldErrors['paymentMethod']}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart?.items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative w-16 h-12 flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                      {item.product.primaryImage ? (
                        <Image
                          src={item.product.primaryImage.url}
                          alt={
                            item.product.primaryImage.altText ||
                            item.product.name
                          }
                          width={48}
                          height={48}
                          quality={100}
                          unoptimized={true}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs font-medium bg-primary text-primary-foreground border border-background">
                      {item.quantity}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {item.product.categories?.[0]?.category?.name ||
                        'Uncategorized'}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {(() => {
                      // Wait for fresh membership data to load
                      if (freshMembership.loading) {
                        return formatPrice(
                          Number(item.product.regularPrice) * item.quantity
                        );
                      }

                      // Get the best price for this product
                      const bestPrice = getBestPrice(
                        {
                          regularPrice: Number(item.product.regularPrice),
                          memberPrice: Number(item.product.memberPrice),
                          isPromotional: item.product.isPromotional || false,
                          promotionalPrice: item.product.promotionalPrice
                            ? Number(item.product.promotionalPrice)
                            : null,
                          promotionStartDate: item.product.promotionStartDate,
                          promotionEndDate: item.product.promotionEndDate,
                          isQualifyingForMembership:
                            item.product.isQualifyingForMembership || false,
                          memberOnlyUntil: item.product.memberOnlyUntil,
                          earlyAccessStart: item.product.earlyAccessStart,
                        },
                        isMember
                      );

                      // Price type styling configuration
                      const priceTypeConfig = {
                        promotional: { color: 'text-red-600', label: 'Promo' },
                        member: { color: 'text-green-600', label: 'Member' },
                        'early-access': {
                          color: 'text-blue-600',
                          label: 'Early',
                        },
                        regular: { color: 'text-gray-900', label: '' },
                      };

                      const config =
                        priceTypeConfig[
                          bestPrice.priceType as keyof typeof priceTypeConfig
                        ] || priceTypeConfig.regular;

                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={config.color}>
                              {formatPrice(bestPrice.price * item.quantity)}
                            </span>
                            {config.label && (
                              <Badge variant="outline" className="text-xs py-0">
                                {config.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          {cart && (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                {promotionalDiscount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Promotional Discount</span>
                    <span>-{formatPrice(promotionalDiscount)}</span>
                  </div>
                )}

                {isMember && !freshMembership.loading && memberDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Member Discount</span>
                    <span>-{formatPrice(memberDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {freeShippingApplied && shippingCost === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : shippingCost === 0 ? (
                      <span className="text-muted-foreground">
                        Select shipping method
                      </span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatPrice(0)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total + shippingCost)}</span>
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

          {/* Membership Progress - for non-members */}
          {!isMember &&
            !freshMembership.loading &&
            cart &&
            cart.qualifyingTotal > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Award className="w-5 h-5" />
                    Membership Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={membershipProgress} className="h-3" />

                  <div className="flex justify-between text-sm text-blue-700">
                    <span>{formatPrice(cart.qualifyingTotal)}</span>
                    <span>{formatPrice(cart.membershipThreshold)}</span>
                  </div>

                  {qualifiesForMembership ? (
                    <div className="text-center">
                      <p className="text-sm text-blue-800 font-medium mb-2">
                        🎉 Congratulations! You're eligible for membership
                        benefits!
                      </p>
                      <p className="text-xs text-blue-700">
                        Your membership will be activated after successful
                        payment
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-blue-700 mb-1">
                        Add {formatPrice(membershipRemaining)} more to qualify
                        for membership
                      </p>
                      <p className="text-xs text-blue-600">
                        Only qualifying products count towards membership
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
                Place Order {cart && formatPrice(total)}
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
