/**
 * EasyParcel Dropdown Value Mappings
 * Official dropdown values from EasyParcel platform
 */

// EasyParcel Category Options
export const EASYPARCEL_CATEGORIES = [
  'Automotive Accessories',
  'Bags & Luggages',
  'Bird\'s Nest',
  'Board Games',
  'Books',
  'Cameras',
  'Computers And Parts / Telecommunication Parts And Equipments',
  'Cosmetic And Beauty Product',
  'Document',
  'Fashion And Accessories',
  'Food Enhancers/Stabilizers/Supplements',
  'Gaming',
  'Health Supplements',
  'Home Appliances',
  'Home Decor',
  'Jewelry',
  'Non Perishable Food',
  'Perishable Food',
  'Pesticides',
  'Pet Accessory',
  'Plant',
  'Sport & Leisure',
  'Toys',
  'Watches'
] as const;

// EasyParcel Courier Company Options
export const EASYPARCEL_COURIERS = [
  'Skynet',
  'Poslaju',
  'DHL eCommerce',
  'Aramex',
  'UTS',
  'Qxpress',
  'J&T Express',
  'Flash Express',
  'Ninja Van',
  'J&T Cargo',
  'CityLink',
  'Best Express',
  'KEX Express'
] as const;

// EasyParcel Boolean Options
export const EASYPARCEL_BOOLEAN_OPTIONS = ['Yes', 'No'] as const;

// Type definitions
export type EasyParcelCategory = typeof EASYPARCEL_CATEGORIES[number];
export type EasyParcelCourier = typeof EASYPARCEL_COURIERS[number];
export type EasyParcelBooleanOption = typeof EASYPARCEL_BOOLEAN_OPTIONS[number];

/**
 * Product Category Mapping
 * Maps internal product categories to EasyParcel categories
 */
export const PRODUCT_CATEGORY_MAPPING: Record<string, EasyParcelCategory> = {
  // Fashion & Clothing
  'clothing': 'Fashion And Accessories',
  'apparel': 'Fashion And Accessories',
  'fashion': 'Fashion And Accessories',
  'shoes': 'Fashion And Accessories',
  'accessories': 'Fashion And Accessories',
  
  // Electronics
  'electronics': 'Computers And Parts / Telecommunication Parts And Equipments',
  'computers': 'Computers And Parts / Telecommunication Parts And Equipments',
  'phones': 'Computers And Parts / Telecommunication Parts And Equipments',
  'gadgets': 'Computers And Parts / Telecommunication Parts And Equipments',
  'cameras': 'Cameras',
  
  // Home & Living
  'home': 'Home Decor',
  'furniture': 'Home Decor',
  'appliances': 'Home Appliances',
  'kitchen': 'Home Appliances',
  
  // Health & Beauty
  'beauty': 'Cosmetic And Beauty Product',
  'cosmetics': 'Cosmetic And Beauty Product',
  'skincare': 'Cosmetic And Beauty Product',
  'health': 'Health Supplements',
  'supplements': 'Health Supplements',
  
  // Sports & Recreation
  'sports': 'Sport & Leisure',
  'fitness': 'Sport & Leisure',
  'outdoor': 'Sport & Leisure',
  'recreation': 'Sport & Leisure',
  
  // Food & Beverages
  'food': 'Non Perishable Food',
  'snacks': 'Non Perishable Food',
  'beverages': 'Non Perishable Food',
  'fresh': 'Perishable Food',
  'organic': 'Perishable Food',
  
  // Books & Media
  'books': 'Books',
  'literature': 'Books',
  'educational': 'Books',
  
  // Toys & Games
  'toys': 'Toys',
  'games': 'Gaming',
  'boardgames': 'Board Games',
  
  // Bags & Travel
  'bags': 'Bags & Luggages',
  'luggage': 'Bags & Luggages',
  'travel': 'Bags & Luggages',
  
  // Jewelry & Watches
  'jewelry': 'Jewelry',
  'watches': 'Watches',
  'accessories': 'Fashion And Accessories',
  
  // Automotive
  'automotive': 'Automotive Accessories',
  'car': 'Automotive Accessories',
  'vehicle': 'Automotive Accessories',
  
  // Pets
  'pets': 'Pet Accessory',
  'pet': 'Pet Accessory',
  'animals': 'Pet Accessory',
  
  // Documents & Business
  'documents': 'Document',
  'business': 'Document',
  'office': 'Document'
};

/**
 * Courier Code Mapping
 * Maps internal courier codes to EasyParcel courier names
 */
export const COURIER_CODE_MAPPING: Record<string, EasyParcelCourier> = {
  // Direct mappings
  'skynet': 'Skynet',
  'poslaju': 'Poslaju',
  'dhl': 'DHL eCommerce',
  'dhl_ecommerce': 'DHL eCommerce',
  'aramex': 'Aramex',
  'uts': 'UTS',
  'qxpress': 'Qxpress',
  'jnt': 'J&T Express',
  'j&t': 'J&T Express',
  'jt_express': 'J&T Express',
  'flash': 'Flash Express',
  'flash_express': 'Flash Express',
  'ninja': 'Ninja Van',
  'ninja_van': 'Ninja Van',
  'jnt_cargo': 'J&T Cargo',
  'citylink': 'CityLink',
  'city_link': 'CityLink',
  'best': 'Best Express',
  'best_express': 'Best Express',
  'kex': 'KEX Express',
  'kex_express': 'KEX Express',
  
  // Alternative names
  'pos': 'Poslaju',
  'pos_malaysia': 'Poslaju',
  'j_and_t': 'J&T Express',
  'flashexpress': 'Flash Express',
  'ninjavan': 'Ninja Van',
  'bestexpress': 'Best Express',
  'kexexpress': 'KEX Express'
};

/**
 * Get EasyParcel category from product data
 */
export function getEasyParcelCategory(
  productCategory?: string,
  productName?: string,
  fallback: EasyParcelCategory = 'Fashion And Accessories'
): EasyParcelCategory {
  // Try exact category mapping first
  if (productCategory) {
    const normalizedCategory = productCategory.toLowerCase().trim();
    const mappedCategory = PRODUCT_CATEGORY_MAPPING[normalizedCategory];
    if (mappedCategory) {
      return mappedCategory;
    }
  }
  
  // Try to infer from product name
  if (productName) {
    const normalizedName = productName.toLowerCase();
    
    // Check for keywords in product name
    for (const [keyword, category] of Object.entries(PRODUCT_CATEGORY_MAPPING)) {
      if (normalizedName.includes(keyword)) {
        return category;
      }
    }
  }
  
  return fallback;
}

/**
 * Get EasyParcel courier name from courier code
 */
export function getEasyParcelCourier(
  courierCode?: string,
  fallback: EasyParcelCourier = 'CityLink'
): EasyParcelCourier {
  if (!courierCode) return fallback;
  
  const normalizedCode = courierCode.toLowerCase().trim();
  const mappedCourier = COURIER_CODE_MAPPING[normalizedCode];
  
  return mappedCourier || fallback;
}

/**
 * Validate EasyParcel dropdown values
 */
export function validateEasyParcelValues(values: {
  category?: string;
  courier?: string;
  trackingSms?: string;
  dropOffAtBranch?: string;
  trackingWhatsapp?: string;
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (values.category && !EASYPARCEL_CATEGORIES.includes(values.category as EasyParcelCategory)) {
    errors.push(`Invalid category: ${values.category}`);
  }
  
  if (values.courier && !EASYPARCEL_COURIERS.includes(values.courier as EasyParcelCourier)) {
    errors.push(`Invalid courier: ${values.courier}`);
  }
  
  if (values.trackingSms && !EASYPARCEL_BOOLEAN_OPTIONS.includes(values.trackingSms as EasyParcelBooleanOption)) {
    errors.push(`Invalid tracking SMS option: ${values.trackingSms}`);
  }
  
  if (values.dropOffAtBranch && !EASYPARCEL_BOOLEAN_OPTIONS.includes(values.dropOffAtBranch as EasyParcelBooleanOption)) {
    errors.push(`Invalid drop off option: ${values.dropOffAtBranch}`);
  }
  
  if (values.trackingWhatsapp && !EASYPARCEL_BOOLEAN_OPTIONS.includes(values.trackingWhatsapp as EasyParcelBooleanOption)) {
    errors.push(`Invalid tracking WhatsApp option: ${values.trackingWhatsapp}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get default EasyParcel values for business
 */
export function getDefaultEasyParcelValues(): {
  category: EasyParcelCategory;
  courier: EasyParcelCourier;
  trackingSms: EasyParcelBooleanOption;
  dropOffAtBranch: EasyParcelBooleanOption;
  trackingWhatsapp: EasyParcelBooleanOption;
} {
  return {
    category: 'Fashion And Accessories', // Most general category
    courier: 'CityLink', // Popular and reliable
    trackingSms: 'Yes',
    dropOffAtBranch: 'No', // Prefer pickup service
    trackingWhatsapp: 'Yes'
  };
}