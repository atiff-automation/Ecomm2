/**
 * Centralized Cart Service - Malaysian E-commerce Platform
 * Single source of truth for ALL cart-related operations
 *
 * This service consolidates all cart API calls and business logic
 * that were previously scattered across 15+ components.
 */

import { apiClient } from './api-client';
import {
  APIResponse,
  CartResponse,
  CartItem,
  AddToCartRequest,
  UpdateCartItemRequest,
} from '@/lib/types/api';
import config from '@/lib/config/app-config';

export interface CartSummary {
  totalItems: number;
  subtotal: number;
  memberDiscount: number;
  promotionalDiscount: number;
  total: number;
  qualifiesForMembership: boolean;
  membershipProgress: number;
}

export interface CartEventPayload {
  event:
    | 'ITEM_ADDED'
    | 'ITEM_UPDATED'
    | 'ITEM_REMOVED'
    | 'CART_CLEARED'
    | 'CART_REFRESHED';
  cartId?: string;
  productId?: string;
  quantity?: number;
  cart?: CartResponse;
  timestamp: Date;
}

export type CartEventListener = (payload: CartEventPayload) => void;

export class CartService {
  private static instance: CartService;
  private cart: CartResponse | null = null;
  private eventListeners = new Map<string, Set<CartEventListener>>();
  private isLoading = false;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = config.ui.loading.debounceMs * 100; // Cache based on UI debounce settings

  private constructor() {
    // Legacy global cart update listener - removed refreshCart() call to prevent race conditions
    // The service layer events should handle updates instead
    if (typeof window !== 'undefined') {
      window.addEventListener('cartUpdated', () => {
        console.log('🌍 Global cartUpdated event received (legacy)');
        // Do nothing - service layer events handle updates now
      });
      
      // Listen for force refresh events (e.g., after payment success)
      window.addEventListener('forceCartRefresh', () => {
        console.log('🔄 Force cart refresh event received');
        this.refreshCart().then(() => {
          console.log('✅ Cart force refresh completed');
        }).catch(error => {
          console.error('❌ Cart force refresh failed:', error);
        });
      });
      
      // Listen for cart cleared events (after successful payment)
      window.addEventListener('cart_cleared', () => {
        console.log('🧹 Cart cleared event received - setting empty cart');
        this.cart = this.createEmptyCart();
        this.lastFetch = Date.now();
        this.emitEvent('CART_CLEARED', { cart: this.cart });
      });
    }
  }

  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  /**
   * Get current cart data with caching
   */
  async getCart(forceRefresh: boolean = false): Promise<CartResponse> {
    console.log('🔄 getCart called with forceRefresh:', forceRefresh);
    const now = Date.now();

    // Use cached cart if available and fresh
    if (!forceRefresh && this.cart && now - this.lastFetch < this.CACHE_TTL) {
      console.log('💾 Using cached cart:', { cartItems: this.cart.totalItems });
      return this.cart;
    }

    // Prevent concurrent fetches
    if (this.isLoading) {
      console.log('⏳ Cart already loading, waiting...');
      // Wait for current fetch to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.cart || this.createEmptyCart();
    }

    try {
      this.isLoading = true;
      console.log('🌐 Fetching cart from API...');
      const response = await apiClient.get<CartResponse>('/api/cart');

      if (response.success && response.data) {
        console.log('📥 Cart fetched successfully:', {
          cartItems: response.data.totalItems,
        });
        this.cart = response.data;
        this.lastFetch = now;
        this.emitEvent('CART_REFRESHED', { cart: this.cart });
        return this.cart;
      }

      throw new Error(response.error || 'Failed to fetch cart');
    } catch (error) {
      console.error('❌ CartService.getCart error:', error);
      // Return empty cart on error to prevent UI breaks
      const emptyCart = this.createEmptyCart();
      console.log('🚫 Setting empty cart due to error');
      this.cart = emptyCart;
      return emptyCart;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(
    productId: string,
    quantity: number = 1
  ): Promise<CartResponse> {
    console.log('🛒 CartService.addToCart called with:', {
      productId,
      quantity,
    });

    try {
      const requestData: AddToCartRequest = { productId, quantity };
      console.log('🌐 Making API call to /api/cart with:', requestData);

      const response = await apiClient.post<CartResponse>(
        '/api/cart',
        requestData
      );

      console.log('📡 API response received:', {
        success: response.success,
        hasData: !!response.data,
        cartItems: response.data?.totalItems,
      });

      if (response.success && response.data) {
        this.cart = response.data;
        this.lastFetch = Date.now();

        console.log('✅ Cart updated, emitting ITEM_ADDED event');
        console.log('🔍 Cart data before events:', {
          cartId: this.cart.id,
          totalItems: this.cart.totalItems,
        });

        // Emit events immediately after updating cart
        this.emitEvent('ITEM_ADDED', {
          productId,
          quantity,
          cart: this.cart,
        });
        this.triggerGlobalCartUpdate();

        // Force immediate update for UI components
        setTimeout(() => {
          console.log('⏰ setTimeout callback - cart status:', {
            hasCart: !!this.cart,
            cartItems: this.cart?.totalItems || 'NO CART',
          });
          this.emitEvent('CART_REFRESHED', { cart: this.cart });
        }, 0);

        return this.cart;
      }

      throw new Error(response.error || 'Failed to add item to cart');
    } catch (error) {
      console.error('❌ CartService.addToCart error:', error);
      throw error;
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    itemId: string,
    quantity: number
  ): Promise<CartResponse> {
    try {
      // Find the product ID from the current cart item
      const cartItem = this.cart?.items.find(item => item.id === itemId);
      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      const requestData = {
        productId: cartItem.productId,
        quantity,
      };

      console.log(
        '🔧 CartService.updateCartItem - using PUT /api/cart with:',
        requestData
      );

      const response = await apiClient.put<CartResponse>(
        '/api/cart',
        requestData
      );

      if (response.success && response.data) {
        this.cart = response.data;
        this.lastFetch = Date.now();
        this.emitEvent('ITEM_UPDATED', {
          quantity,
          cart: this.cart,
        });
        this.triggerGlobalCartUpdate();
        return this.cart;
      }

      throw new Error(response.error || 'Failed to update cart item');
    } catch (error) {
      console.error('CartService.updateCartItem error:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: string): Promise<CartResponse> {
    try {
      // Find the product ID from the current cart item
      const cartItem = this.cart?.items.find(item => item.id === itemId);
      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      const requestData = {
        productId: cartItem.productId,
        quantity: 0,
      };

      console.log(
        '🗑️ CartService.removeFromCart - using PUT /api/cart with:',
        requestData
      );

      const response = await apiClient.put<CartResponse>(
        '/api/cart',
        requestData
      );

      if (response.success && response.data) {
        this.cart = response.data;
        this.lastFetch = Date.now();
        this.emitEvent('ITEM_REMOVED', { cart: this.cart });
        this.triggerGlobalCartUpdate();
        return this.cart;
      }

      throw new Error(response.error || 'Failed to remove item from cart');
    } catch (error) {
      console.error('CartService.removeFromCart error:', error);
      throw error;
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    try {
      const response = await apiClient.delete<void>('/api/cart');

      if (response.success) {
        this.cart = this.createEmptyCart();
        this.lastFetch = Date.now();
        this.emitEvent('CART_CLEARED', { cart: this.cart });
        this.triggerGlobalCartUpdate();
      } else {
        throw new Error(response.error || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('CartService.clearCart error:', error);
      throw error;
    }
  }

  /**
   * Get cart item count (lightweight operation)
   */
  async getCartCount(): Promise<number> {
    try {
      const cart = await this.getCart();
      return cart.totalItems;
    } catch (error) {
      console.error('CartService.getCartCount error:', error);
      return 0;
    }
  }

  /**
   * Get cart summary (totals, discounts, etc.)
   */
  async getCartSummary(): Promise<CartSummary> {
    try {
      const cart = await this.getCart();
      const membershipThreshold = config.business.membership.threshold;

      return {
        totalItems: cart.totalItems,
        subtotal: cart.subtotal,
        memberDiscount: cart.memberDiscount,
        promotionalDiscount: cart.promotionalDiscount,
        total: cart.total,
        qualifiesForMembership: cart.subtotal >= membershipThreshold,
        membershipProgress: Math.min(
          (cart.subtotal / membershipThreshold) * 100,
          100
        ),
      };
    } catch (error) {
      console.error('CartService.getCartSummary error:', error);
      return {
        totalItems: 0,
        subtotal: 0,
        memberDiscount: 0,
        promotionalDiscount: 0,
        total: 0,
        qualifiesForMembership: false,
        membershipProgress: 0,
      };
    }
  }

  /**
   * Check if product is in cart
   */
  async isProductInCart(
    productId: string
  ): Promise<{ inCart: boolean; quantity: number; itemId?: string }> {
    try {
      const cart = await this.getCart();
      const cartItem = cart.items.find(item => item.productId === productId);

      return {
        inCart: !!cartItem,
        quantity: cartItem?.quantity || 0,
        itemId: cartItem?.id,
      };
    } catch (error) {
      console.error('CartService.isProductInCart error:', error);
      return { inCart: false, quantity: 0 };
    }
  }

  /**
   * Check membership eligibility based on cart
   */
  async checkMembershipEligibility(): Promise<{
    eligible: boolean;
    progress: number;
    remaining: number;
    threshold: number;
  }> {
    try {
      const response = await apiClient.get<{
        eligible: boolean;
        progress: number;
        remaining: number;
        threshold: number;
      }>('/api/cart/membership-check');

      if (response.success && response.data) {
        return response.data;
      }

      // Fallback calculation
      const cart = await this.getCart();
      const threshold = config.business.membership.threshold;
      const remaining = Math.max(0, threshold - cart.subtotal);

      return {
        eligible: cart.subtotal >= threshold,
        progress: Math.min((cart.subtotal / threshold) * 100, 100),
        remaining,
        threshold,
      };
    } catch (error) {
      console.error('CartService.checkMembershipEligibility error:', error);
      return {
        eligible: false,
        progress: 0,
        remaining: config.business.membership.threshold,
        threshold: config.business.membership.threshold,
      };
    }
  }

  /**
   * Transfer guest cart to user account (for registration/login)
   */
  async transferGuestCart(guestCartId?: string): Promise<CartResponse> {
    try {
      const requestData = guestCartId ? { guestCartId } : {};
      const response = await apiClient.post<CartResponse>(
        '/api/cart/transfer-guest-cart',
        requestData
      );

      if (response.success && response.data) {
        this.cart = response.data;
        this.lastFetch = Date.now();
        this.triggerGlobalCartUpdate();
        return this.cart;
      }

      throw new Error(response.error || 'Failed to transfer guest cart');
    } catch (error) {
      console.error('CartService.transferGuestCart error:', error);
      throw error;
    }
  }

  /**
   * Force refresh cart from server
   */
  async refreshCart(): Promise<CartResponse> {
    this.lastFetch = 0; // Reset cache
    return this.getCart(true);
  }

  /**
   * Get cached cart without API call (may be stale)
   */
  getCachedCart(): CartResponse | null {
    return this.cart;
  }

  /**
   * Event management
   */
  addEventListener(event: string, listener: CartEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);

    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  private emitEvent(
    event: CartEventPayload['event'],
    payload: Omit<CartEventPayload, 'event' | 'timestamp'>
  ): void {
    const eventPayload: CartEventPayload = {
      ...payload,
      event,
      timestamp: new Date(),
    };

    // Debug logging in development - force log to see what's happening
    console.log('🛒 CartService emitting event:', event, {
      cartItems: eventPayload.cart?.totalItems,
      listeners: {
        specific: this.eventListeners.get(event)?.size || 0,
        wildcard: this.eventListeners.get('*')?.size || 0,
      },
      timestamp: new Date().toISOString(),
    });

    // Emit to specific event listeners
    const listeners = this.eventListeners.get(event);
    if (listeners && listeners.size > 0) {
      listeners.forEach(listener => {
        try {
          listener(eventPayload);
        } catch (error) {
          console.error('Error in cart event listener:', error);
        }
      });
    }

    // Also emit to wildcard ('*') listeners
    const anyListeners = this.eventListeners.get('*');
    if (anyListeners && anyListeners.size > 0) {
      anyListeners.forEach(listener => {
        try {
          listener(eventPayload);
        } catch (error) {
          console.error('Error in wildcard cart event listener:', error);
        }
      });
    }
  }

  /**
   * Create empty cart structure
   */
  private createEmptyCart(): CartResponse {
    return {
      id: 'empty',
      items: [],
      totalItems: 0,
      subtotal: 0,
      memberDiscount: 0,
      promotionalDiscount: 0,
      total: 0,
      qualifyingTotal: 0,
      membershipThreshold: config.business.membership.threshold,
      qualifiesForMembership: false,
      membershipProgress: 0,
      membershipRemaining: config.business.membership.threshold,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Trigger global cart update event for legacy components
   */
  private triggerGlobalCartUpdate(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    }
  }

  /**
   * Clear cache (useful for logout)
   */
  clearCache(): void {
    this.cart = null;
    this.lastFetch = 0;
  }

  /**
   * Get cart statistics
   */
  getStats(): {
    cacheAge: number;
    isLoading: boolean;
    hasCache: boolean;
    itemCount: number;
  } {
    return {
      cacheAge: this.lastFetch ? Date.now() - this.lastFetch : 0,
      isLoading: this.isLoading,
      hasCache: !!this.cart,
      itemCount: this.cart?.totalItems || 0,
    };
  }
}

// Export singleton instance
export const cartService = CartService.getInstance();
