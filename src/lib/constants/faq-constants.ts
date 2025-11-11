/**
 * FAQ Constants - Single Source of Truth
 * All FAQ-related constants and configurations
 */

export const FAQ_CONSTANTS = {
  // Categories with Bahasa Malaysia labels
  CATEGORIES: {
    ABOUT_US: {
      value: 'ABOUT_US',
      label: 'Tentang Kami',
      description: 'Soalan tentang syarikat dan jenama',
      icon: 'Info',
    },
    PRODUCTS: {
      value: 'PRODUCTS',
      label: 'Produk',
      description: 'Soalan tentang produk jamu',
      icon: 'Package',
    },
    SHIPPING: {
      value: 'SHIPPING',
      label: 'Penghantaran',
      description: 'Soalan tentang penghantaran dan pos',
      icon: 'Truck',
    },
    PAYMENT: {
      value: 'PAYMENT',
      label: 'Pembayaran',
      description: 'Soalan tentang kaedah pembayaran',
      icon: 'CreditCard',
    },
    MEMBERSHIP: {
      value: 'MEMBERSHIP',
      label: 'Keahlian',
      description: 'Soalan tentang program keahlian',
      icon: 'Users',
    },
    SAFETY: {
      value: 'SAFETY',
      label: 'Keselamatan',
      description: 'Soalan tentang keselamatan produk',
      icon: 'Shield',
    },
  },

  // Status options
  STATUS: {
    ACTIVE: {
      value: 'ACTIVE',
      label: 'Aktif',
      color: 'green',
      icon: 'CheckCircle',
    },
    INACTIVE: {
      value: 'INACTIVE',
      label: 'Tidak Aktif',
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

// Helper function to get category label
export function getFAQCategoryLabel(category: string): string {
  const categoryKey = category as FAQCategoryValue;
  return FAQ_CONSTANTS.CATEGORIES[categoryKey]?.label || category;
}

// Helper function to get all categories as array
export function getFAQCategories() {
  return Object.values(FAQ_CONSTANTS.CATEGORIES);
}

// Helper function to get all statuses as array
export function getFAQStatuses() {
  return Object.values(FAQ_CONSTANTS.STATUS);
}
