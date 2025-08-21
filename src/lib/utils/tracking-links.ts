/**
 * Tracking Links Utilities
 * Generate external tracking URLs for Malaysian couriers
 * Based on CUSTOMER_TRACKING_IMPLEMENTATION_PLAN.md
 */

/**
 * Malaysian courier tracking URL mappings
 */
export const COURIER_TRACKING_URLS = {
  // Malaysia Post / Pos Laju
  pos_laju: 'https://www.pos.com.my/postal-services/quick-access?track-trace=',
  poslaju: 'https://www.pos.com.my/postal-services/quick-access?track-trace=',
  
  // GDEX
  gdex: 'https://www.gdexpress.com/home/tracking_details/',
  
  // City-Link Express
  citylink: 'https://www.citylinkexpress.com/tracking?consignmentNo=',
  'city-link': 'https://www.citylinkexpress.com/tracking?consignmentNo=',
  
  // J&T Express
  jnt: 'https://www.jtexpress.my/trajectoryQuery?billCode=',
  'j&t': 'https://www.jtexpress.my/trajectoryQuery?billCode=',
  
  // Ninja Van
  ninjavan: 'https://www.ninjavan.co/en-my/tracking?id=',
  ninja: 'https://www.ninjavan.co/en-my/tracking?id=',
  
  // DHL
  dhl: 'https://www.dhl.com/my-en/home/tracking/tracking-express.html?submit=1&tracking-id=',
  
  // FedEx
  fedex: 'https://www.fedex.com/fedextrack/?trknbr=',
  
  // Aramex
  aramex: 'https://www.aramex.com/us/en/track/shipments?ShipmentNumber=',
  
  // Skynet Worldwide Express
  skynet: 'https://tracking.skynet.my/?awb=',
  
  // ABX Express
  abx: 'https://www.abxexpress.com.my/index.php/shipment/consignment',
  
  // Nationwide Express
  nationwide: 'https://www.nwe.com.my/track-trace/',
  
  // TA-Q-BIN (Yamato)
  yamato: 'https://www.ta-q-bin.com.my/en/track-trace.html',
  taqbin: 'https://www.ta-q-bin.com.my/en/track-trace.html',
} as const;

/**
 * Generate external tracking URL based on courier name
 */
export const generateTrackingUrl = (courierName: string, trackingNumber: string): string => {
  const normalizedCourier = courierName.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z&]/g, '');
  
  // Try to find exact match first
  if (normalizedCourier in COURIER_TRACKING_URLS) {
    const baseUrl = COURIER_TRACKING_URLS[normalizedCourier as keyof typeof COURIER_TRACKING_URLS];
    return `${baseUrl}${encodeURIComponent(trackingNumber)}`;
  }
  
  // Try partial matching for common variations
  for (const [key, url] of Object.entries(COURIER_TRACKING_URLS)) {
    if (normalizedCourier.includes(key) || key.includes(normalizedCourier)) {
      return `${url}${encodeURIComponent(trackingNumber)}`;
    }
  }
  
  // Fallback: Google search
  const searchQuery = `${courierName} tracking ${trackingNumber} Malaysia`;
  return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
};

/**
 * Get courier display name and branding info
 */
export const getCourierInfo = (courierName: string) => {
  const normalized = courierName.toLowerCase();
  
  if (normalized.includes('pos') || normalized.includes('laju')) {
    return {
      displayName: 'Pos Laju',
      color: 'yellow',
      category: 'postal'
    };
  } else if (normalized.includes('gdex')) {
    return {
      displayName: 'GDEX',
      color: 'red',
      category: 'express'
    };
  } else if (normalized.includes('city') || normalized.includes('link')) {
    return {
      displayName: 'City-Link Express',
      color: 'blue',
      category: 'express'
    };
  } else if (normalized.includes('j&t') || normalized.includes('jnt')) {
    return {
      displayName: 'J&T Express',
      color: 'red',
      category: 'express'
    };
  } else if (normalized.includes('ninja')) {
    return {
      displayName: 'Ninja Van',
      color: 'purple',
      category: 'express'
    };
  } else if (normalized.includes('dhl')) {
    return {
      displayName: 'DHL',
      color: 'yellow',
      category: 'international'
    };
  } else if (normalized.includes('fedex')) {
    return {
      displayName: 'FedEx',
      color: 'purple',
      category: 'international'
    };
  } else if (normalized.includes('aramex')) {
    return {
      displayName: 'Aramex',
      color: 'orange',
      category: 'international'
    };
  } else if (normalized.includes('skynet')) {
    return {
      displayName: 'Skynet',
      color: 'blue',
      category: 'express'
    };
  } else if (normalized.includes('abx')) {
    return {
      displayName: 'ABX Express',
      color: 'green',
      category: 'express'
    };
  } else if (normalized.includes('nationwide')) {
    return {
      displayName: 'Nationwide Express',
      color: 'blue',
      category: 'express'
    };
  } else if (normalized.includes('yamato') || normalized.includes('taqbin')) {
    return {
      displayName: 'TA-Q-BIN',
      color: 'green',
      category: 'express'
    };
  }
  
  return {
    displayName: courierName,
    color: 'gray',
    category: 'other'
  };
};

/**
 * Check if courier supports real-time tracking
 */
export const supportsRealTimeTracking = (courierName: string): boolean => {
  const normalized = courierName.toLowerCase();
  
  // Couriers known to have good real-time tracking APIs
  const realTimeSupported = [
    'dhl', 'fedex', 'pos', 'laju', 'gdex', 
    'citylink', 'city-link', 'j&t', 'jnt', 
    'ninja', 'aramex'
  ];
  
  return realTimeSupported.some(courier => normalized.includes(courier));
};

/**
 * Get estimated delivery time based on courier and service type
 */
export const getEstimatedDeliveryDays = (courierName: string, serviceType?: string): { min: number; max: number } => {
  const normalized = courierName.toLowerCase();
  const service = serviceType?.toLowerCase() || '';
  
  // Express services
  if (service.includes('express') || service.includes('priority')) {
    return { min: 1, max: 2 };
  }
  
  // Standard delivery estimates by courier
  if (normalized.includes('pos') || normalized.includes('laju')) {
    return { min: 2, max: 5 };
  } else if (normalized.includes('gdex') || normalized.includes('city') || normalized.includes('j&t')) {
    return { min: 1, max: 3 };
  } else if (normalized.includes('ninja')) {
    return { min: 1, max: 4 };
  } else if (normalized.includes('dhl') || normalized.includes('fedex')) {
    return { min: 1, max: 3 };
  }
  
  // Default estimate
  return { min: 2, max: 7 };
};