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
  UpdateCartItemRequest
} from '@/lib/types/api';

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
  event: 'ITEM_ADDED' | 'ITEM_UPDATED' | 'ITEM_REMOVED' | 'CART_CLEARED' | 'CART_REFRESHED';
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
  private readonly CACHE_TTL = 30 * 1000; // 30 seconds cache for cart data

  private constructor() {
    // Set up cart refresh listener for global cart updates
    if (typeof window !== 'undefined') {
      window.addEventListener('cartUpdated', () => {
        this.refreshCart();
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
    const now = Date.now();
    
    // Use cached cart if available and fresh
    if (!forceRefresh && this.cart && (now - this.lastFetch) < this.CACHE_TTL) {
      return this.cart;
    }

    // Prevent concurrent fetches
    if (this.isLoading) {
      // Wait for current fetch to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return this.cart || this.createEmptyCart();
    }

    try {
      this.isLoading = true;
      const response = await apiClient.get<CartResponse>('/api/cart');

      if (response.success && response.data) {
        this.cart = response.data;
        this.lastFetch = now;
        this.emitEvent('CART_REFRESHED', { cart: this.cart });
        return this.cart;
      }

      throw new Error(response.error || 'Failed to fetch cart');
    } catch (error) {
      console.error('CartService.getCart error:', error);
      // Return empty cart on error to prevent UI breaks
      const emptyCart = this.createEmptyCart();
      this.cart = emptyCart;
      return emptyCart;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(productId: string, quantity: number = 1): Promise<CartResponse> {
    try {
      const requestData: AddToCartRequest = { productId, quantity };
      const response = await apiClient.post<CartResponse>('/api/cart', requestData);

      if (response.success && response.data) {
        this.cart = response.data;
        this.lastFetch = Date.now();
        this.emitEvent('ITEM_ADDED', { 
          productId, 
          quantity, 
          cart: this.cart 
        });
        this.triggerGlobalCartUpdate();
        return this.cart;
      }

      throw new Error(response.error || 'Failed to add item to cart');
    } catch (error) {
      console.error('CartService.addToCart error:', error);
      throw error;
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(itemId: string, quantity: number): Promise<CartResponse> {
    try {
      const requestData: UpdateCartItemRequest = { quantity };
      const response = await apiClient.patch<CartResponse>(`/api/cart/items/${itemId}`, requestData);

      if (response.success && response.data) {
        this.cart = response.data;
        this.lastFetch = Date.now();
        this.emitEvent('ITEM_UPDATED', { 
          quantity, 
          cart: this.cart 
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
      const response = await apiClient.delete<CartResponse>(`/api/cart/items/${itemId}`);

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
      const membershipThreshold = 80; // RM 80 for membership
      
      return {
        totalItems: cart.totalItems,
        subtotal: cart.subtotal,
        memberDiscount: cart.memberDiscount,
        promotionalDiscount: cart.promotionalDiscount,
        total: cart.total,
        qualifiesForMembership: cart.subtotal >= membershipThreshold,
        membershipProgress: Math.min((cart.subtotal / membershipThreshold) * 100, 100)
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
        membershipProgress: 0
      };
    }
  }

  /**
   * Check if product is in cart
   */
  async isProductInCart(productId: string): Promise<{ inCart: boolean; quantity: number; itemId?: string }> {
    try {
      const cart = await this.getCart();
      const cartItem = cart.items.find(item => item.productId === productId);
      
      return {
        inCart: !!cartItem,
        quantity: cartItem?.quantity || 0,
        itemId: cartItem?.id
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
      const threshold = 80;
      const remaining = Math.max(0, threshold - cart.subtotal);
      
      return {
        eligible: cart.subtotal >= threshold,
        progress: Math.min((cart.subtotal / threshold) * 100, 100),
        remaining,
        threshold
      };
    } catch (error) {
      console.error('CartService.checkMembershipEligibility error:', error);
      return {
        eligible: false,
        progress: 0,
        remaining: 80,
        threshold: 80
      };
    }
  }

  /**
   * Transfer guest cart to user account (for registration/login)
   */
  async transferGuestCart(guestCartId?: string): Promise<CartResponse> {
    try {
      const requestData = guestCartId ? { guestCartId } : {};
      const response = await apiClient.post<CartResponse>('/api/cart/transfer-guest-cart', requestData);

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

  private emitEvent(event: CartEventPayload['event'], payload: Omit<CartEventPayload, 'event' | 'timestamp'>): void {
    const eventPayload: CartEventPayload = {
      ...payload,
      event,
      timestamp: new Date()
    };

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(eventPayload));
    }

    // Also emit to 'any' listeners
    const anyListeners = this.eventListeners.get('*');
    if (anyListeners) {
      anyListeners.forEach(listener => listener(eventPayload));
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
      updatedAt: new Date().toISOString()
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
      itemCount: this.cart?.totalItems || 0
    };
  }
}

// Export singleton instance
export const cartService = CartService.getInstance();