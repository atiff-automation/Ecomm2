/**
 * Demo Mode Configuration
 *
 * Single source of truth for demo mode settings.
 * Change `enabled: false` to disable all demo restrictions.
 */

export const DEMO_CONFIG = {
  // Master toggle - set to false to disable entire demo mode
  enabled: true,

  // Auto-trigger delay for checkout page (milliseconds)
  autoTriggerDelay: 5000, // 5 seconds

  // Context-specific messages
  messages: {
    checkout: "We're putting the finishing touches on our checkout system! Full shopping features will be available very soon. Thank you for your patience!",
    signup: "Account registration is coming soon! You can browse our products and experience the website without creating an account. Full features will be available shortly!"
  },

  // Home redirect path
  homeRedirectPath: "/",

  // Actions allowed during demo mode
  allowedDemoActions: [
    "browse_products",
    "view_product_details",
    "add_to_cart",
    "view_cart",
    "navigate_pages"
  ],

  // Actions blocked during demo mode
  blockedActions: [
    "place_order",
    "process_payment",
    "create_account",
    "user_registration"
  ]
} as const;

// Type definitions for better TypeScript support
export type DemoMessageType = keyof typeof DEMO_CONFIG.messages;
export type DemoAction = typeof DEMO_CONFIG.allowedDemoActions[number] | typeof DEMO_CONFIG.blockedActions[number];

// Helper functions
export const isDemoEnabled = () => DEMO_CONFIG.enabled;
export const getDemoMessage = (type: DemoMessageType) => DEMO_CONFIG.messages[type];
export const isActionBlocked = (action: DemoAction) =>
  DEMO_CONFIG.enabled && DEMO_CONFIG.blockedActions.includes(action as any);