/**
 * Product Tracking Utilities - Malaysian E-commerce Platform
 * Handles tracking of user interactions for personalization
 */

/**
 * Track product view for recently viewed feature
 */
export const trackProductView = async (productId: string) => {
  try {
    await fetch('/api/recently-viewed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    });
  } catch (error) {
    // Silently fail - tracking shouldn't break user experience
    console.debug('Failed to track product view:', error);
  }
};

/**
 * Track search query for analytics
 */
export const trackSearch = async (query: string, resultsCount: number) => {
  try {
    // This could be extended to send to analytics service
    console.debug('Search tracked:', { query, resultsCount });
  } catch (error) {
    console.debug('Failed to track search:', error);
  }
};

/**
 * Track cart events for analytics
 */
export const trackCartEvent = async (
  event: 'add' | 'remove' | 'update' | 'clear',
  productId?: string,
  quantity?: number
) => {
  try {
    // This could be extended to send to analytics service
    console.debug('Cart event tracked:', { event, productId, quantity });
  } catch (error) {
    console.debug('Failed to track cart event:', error);
  }
};

/**
 * Track wishlist events for analytics
 */
export const trackWishlistEvent = async (
  event: 'add' | 'remove',
  productId: string
) => {
  try {
    // This could be extended to send to analytics service
    console.debug('Wishlist event tracked:', { event, productId });
  } catch (error) {
    console.debug('Failed to track wishlist event:', error);
  }
};
