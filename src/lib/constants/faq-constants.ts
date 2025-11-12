/**
 * FAQ Constants - Single Source of Truth
 * All FAQ-related constants and configurations
 */

export const FAQ_CONSTANTS = {
  // Categories with English labels for admin
  CATEGORIES: {
    ABOUT_US: {
      value: 'ABOUT_US',
      label: 'About Us',
      labelMalay: 'Tentang Kami',
      description: 'Questions about company and brand',
      icon: 'Info',
    },
    PRODUCTS: {
      value: 'PRODUCTS',
      label: 'Products',
      labelMalay: 'Produk',
      description: 'Questions about products',
      icon: 'Package',
    },
    SHIPPING: {
      value: 'SHIPPING',
      label: 'Shipping',
      labelMalay: 'Penghantaran',
      description: 'Questions about shipping and delivery',
      icon: 'Truck',
    },
    PAYMENT: {
      value: 'PAYMENT',
      label: 'Payment',
      labelMalay: 'Pembayaran',
      description: 'Questions about payment methods',
      icon: 'CreditCard',
    },
    MEMBERSHIP: {
      value: 'MEMBERSHIP',
      label: 'Membership',
      labelMalay: 'Keahlian',
      description: 'Questions about membership program',
      icon: 'Users',
    },
    SAFETY: {
      value: 'SAFETY',
      label: 'Safety',
      labelMalay: 'Keselamatan',
      description: 'Questions about product safety',
      icon: 'Shield',
    },
  },

  // Status options with English labels for admin
  STATUS: {
    ACTIVE: {
      value: 'ACTIVE',
      label: 'Active',
      color: 'green',
      icon: 'CheckCircle',
    },
    INACTIVE: {
      value: 'INACTIVE',
      label: 'Inactive',
      color: 'gray',
      icon: 'XCircle',
    },
  },

  // Validation limits
  VALIDATION: {
    QUESTION_MIN_LENGTH: 10,
    QUESTION_MAX_LENGTH: 500,
    ANSWER_MIN_LENGTH: 20,
    ANSWER_MAX_LENGTH: 5000,
  },

  // API endpoints
  API_ROUTES: {
    ADMIN_BASE: '/api/admin/faqs',
    PUBLIC_BASE: '/api/public/faqs',
  },

  // UI Configuration
  UI: {
    ITEMS_PER_PAGE: 20,
    SEARCH_DEBOUNCE_MS: 300,
  },
} as const;

// Type helpers
export type FAQCategoryValue = keyof typeof FAQ_CONSTANTS.CATEGORIES;
export type FAQStatusValue = keyof typeof FAQ_CONSTANTS.STATUS;

// Helper function to get category label (English - for admin)
export function getFAQCategoryLabel(category: string): string {
  const categoryKey = category as FAQCategoryValue;
  return FAQ_CONSTANTS.CATEGORIES[categoryKey]?.label || category;
}

// Helper function to get Malay category label (for public display)
export function getFAQCategoryLabelMalay(category: string): string {
  const categoryKey = category as FAQCategoryValue;
  return FAQ_CONSTANTS.CATEGORIES[categoryKey]?.labelMalay || category;
}

// Helper function to get all categories as array
export function getFAQCategories() {
  return Object.values(FAQ_CONSTANTS.CATEGORIES);
}

// Helper function to get all statuses as array
export function getFAQStatuses() {
  return Object.values(FAQ_CONSTANTS.STATUS);
}
