/**
 * Clipboard Utilities
 * Enhanced copy-to-clipboard functionality for customer tracking
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

import { toast } from 'sonner';

/**
 * Copy text to clipboard with fallback for older browsers
 */
export const copyToClipboard = async (
  text: string, 
  label: string = 'Text',
  showToast: boolean = true
): Promise<boolean> => {
  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      if (showToast) {
        toast.success(`${label} copied to clipboard`);
      }
      return true;
    }
    
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (successful && showToast) {
      toast.success(`${label} copied to clipboard`);
    } else if (!successful && showToast) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
    
    return successful;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    if (showToast) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
    return false;
  }
};

/**
 * Copy tracking number with formatted output
 */
export const copyTrackingNumber = async (trackingNumber: string): Promise<boolean> => {
  return copyToClipboard(trackingNumber, 'Tracking number');
};

/**
 * Copy order number with formatted output
 */
export const copyOrderNumber = async (orderNumber: string): Promise<boolean> => {
  return copyToClipboard(orderNumber, 'Order number');
};

/**
 * Copy order summary (multiple fields)
 */
export const copyOrderSummary = async (order: {
  orderNumber: string;
  trackingNumber?: string;
  status: string;
  courierName?: string;
}): Promise<boolean> => {
  let summary = `Order: ${order.orderNumber}`;
  summary += `\nStatus: ${order.status}`;
  
  if (order.trackingNumber) {
    summary += `\nTracking: ${order.trackingNumber}`;
  }
  
  if (order.courierName) {
    summary += `\nCourier: ${order.courierName}`;
  }
  
  return copyToClipboard(summary, 'Order summary');
};

/**
 * Check if clipboard API is available
 */
export const isClipboardSupported = (): boolean => {
  return !!(navigator.clipboard || document.execCommand);
};