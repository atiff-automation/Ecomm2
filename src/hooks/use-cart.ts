/**
 * useCart Hook - Malaysian E-commerce Platform
 * React hook for accessing centralized cart operations
 *
 * This hook provides a clean React interface to the CartService,
 * handling all cart state management and operations centrally.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { cartService, CartEventPayload } from '@/lib/services/cart-service';
import { CartResponse, CartItem } from '@/lib/types/api';
import { toast } from 'sonner';

interface UseCartReturn {
  // Cart state
  cart: CartResponse | null;
  isLoading: boolean;
  error: string | null;

  // Cart summary
  totalItems: number;
  subtotal: number;
  total: number;
  memberDiscount: number;
  promotionalDiscount: number;

  // Membership info
  qualifiesForMembership: boolean;
  membershipProgress: number;
  membershipRemaining: number;

  // Actions
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;

  // Utilities
  isProductInCart: (productId: string) => boolean;
  getProductQuantity: (productId: string) => number;
  getItemById: (itemId: string) => CartItem | undefined;
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize cart on mount
  useEffect(() => {
    const initializeCart = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const cartData = await cartService.getCart();
        setCart(cartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cart');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCart();
  }, []);

  // Set up cart event listeners
  useEffect(() => {
    const unsubscribeAll = cartService.addEventListener(
      '*',
      (payload: CartEventPayload) => {
        if (payload.cart) {
          setCart(payload.cart);
          setError(null); // Clear any previous errors
        }
      }
    );

    // Listen for specific events to ensure immediate updates
    const unsubscribeAdded = cartService.addEventListener(
      'ITEM_ADDED',
      (payload: CartEventPayload) => {
        if (payload.cart) {
          setCart(payload.cart);
          setError(null);
        }
      }
    );

    return () => {
      unsubscribeAll();
      unsubscribeAdded();
    };
  }, []);

  // Actions
  const addToCart = useCallback(
    async (productId: string, quantity: number = 1) => {
      console.log('🔗 useCart.addToCart called with:', { productId, quantity });
      try {
        setError(null);
        console.log('📞 Calling cartService.addToCart...');
        await cartService.addToCart(productId, quantity);
        console.log('🎉 cartService.addToCart completed successfully');
        toast.success(
          `Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`
        );
      } catch (err) {
        console.error('💥 useCart.addToCart error:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add to cart';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    []
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      try {
        setError(null);
        await cartService.updateCartItem(itemId, quantity);
        toast.success('Cart updated');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update cart';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      }
    },
    []
  );

  const removeItem = useCallback(async (itemId: string) => {
    try {
      setError(null);
      await cartService.removeFromCart(itemId);
      toast.success('Item removed from cart');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove item';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      setError(null);
      await cartService.clearCart();
      toast.success('Cart cleared');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to clear cart';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await cartService.refreshCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh cart');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Computed values
  const totalItems = cart?.totalItems || 0;
  const subtotal = cart?.subtotal || 0;
  const total = cart?.total || 0;
  const memberDiscount = cart?.memberDiscount || 0;
  const promotionalDiscount = cart?.promotionalDiscount || 0;

  // Membership qualification data from API (respects product rules)
  const qualifiesForMembership = cart?.qualifiesForMembership || false;
  const membershipProgress = cart?.membershipProgress || 0;
  const membershipRemaining = cart?.membershipRemaining || 80;

  // Utility functions
  const isProductInCart = useCallback(
    (productId: string) => {
      return cart?.items.some(item => item.productId === productId) || false;
    },
    [cart]
  );

  const getProductQuantity = useCallback(
    (productId: string) => {
      const item = cart?.items.find(item => item.productId === productId);
      return item?.quantity || 0;
    },
    [cart]
  );

  const getItemById = useCallback(
    (itemId: string) => {
      return cart?.items.find(item => item.id === itemId);
    },
    [cart]
  );

  return {
    // Cart state
    cart,
    isLoading,
    error,

    // Cart summary
    totalItems,
    subtotal,
    total,
    memberDiscount,
    promotionalDiscount,

    // Membership info
    qualifiesForMembership,
    membershipProgress,
    membershipRemaining,

    // Actions
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    refreshCart,

    // Utilities
    isProductInCart,
    getProductQuantity,
    getItemById,
  };
}

/**
 * Hook for cart count only (lightweight)
 */
export function useCartCount(): {
  count: number;
  isLoading: boolean;
  error: string | null;
} {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCount = useCallback(async () => {
    try {
      setError(null);
      const cartCount = await cartService.getCartCount();
      setCount(cartCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load cart count'
      );
    }
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        setIsLoading(true);
        await refreshCount();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCount();

    // Listen for cart events and refresh count
    const unsubscribe = cartService.addEventListener(
      '*',
      (payload: CartEventPayload) => {
        console.log('🔔 useCartCount received event:', payload.event, {
          cartItems: payload.cart?.totalItems,
          timestamp: payload.timestamp,
        });

        if (payload.cart) {
          console.log('📊 Updating cart count to:', payload.cart.totalItems);
          setCount(payload.cart.totalItems);
          setError(null);
        } else {
          console.log('🔄 No cart data, refreshing...');
          // If no cart data in event, refresh from service
          refreshCount();
        }
      }
    );

    // Also listen for global cart updates (for legacy compatibility)
    const handleCartUpdate = () => {
      refreshCount();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cartUpdated', handleCartUpdate);
    }

    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('cartUpdated', handleCartUpdate);
      }
    };
  }, [refreshCount]);

  return { count, isLoading, error };
}

/**
 * Hook for membership eligibility
 */
export function useMembershipEligibility(): {
  eligible: boolean;
  progress: number;
  remaining: number;
  threshold: number;
  isLoading: boolean;
  error: string | null;
} {
  const [data, setData] = useState({
    eligible: false,
    progress: 0,
    remaining: 80,
    threshold: 80,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const eligibility = await cartService.checkMembershipEligibility();
        setData(eligibility);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to check eligibility'
        );
      } finally {
        setIsLoading(false);
      }
    };

    checkEligibility();

    // Listen for cart updates
    const unsubscribe = cartService.addEventListener('*', () => {
      checkEligibility();
    });

    return unsubscribe;
  }, []);

  return { ...data, isLoading, error };
}

/**
 * Hook for checking if specific product is in cart
 */
export function useProductInCart(productId: string): {
  inCart: boolean;
  quantity: number;
  itemId?: string;
  isLoading: boolean;
} {
  const [data, setData] = useState({
    inCart: false,
    quantity: 0,
    itemId: undefined as string | undefined,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkProduct = async () => {
      try {
        setIsLoading(true);
        const result = await cartService.isProductInCart(productId);
        setData(result);
      } catch (err) {
        console.error('Failed to check product in cart:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkProduct();

    // Listen for cart updates
    const unsubscribe = cartService.addEventListener('*', () => {
      checkProduct();
    });

    return unsubscribe;
  }, [productId]);

  return { ...data, isLoading };
}
