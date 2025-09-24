/**
 * Centralized Configuration for Airway Bill System
 * Single Source of Truth for all airway bill related settings
 */

export const AirwayBillConfig = {

  // File storage settings
  storage: {
    uploadPath: process.env.AIRWAY_BILL_STORAGE_PATH || "/tmp/airway-bills",
    maxFileSize: parseInt(process.env.AIRWAY_BILL_MAX_FILE_SIZE || "10485760", 10), // 10MB
    allowedFormats: ["pdf"],
    retention: {
      days: parseInt(process.env.AIRWAY_BILL_RETENTION_DAYS || "90", 10),
    },
  },

  // Generation settings
  generation: {
    timeout: parseInt(process.env.AIRWAY_BILL_GENERATION_TIMEOUT || "60000", 10), // 60 seconds
    retryAttempts: parseInt(process.env.AIRWAY_BILL_RETRY_ATTEMPTS || "3", 10),
    retryDelay: parseInt(process.env.AIRWAY_BILL_RETRY_DELAY || "5000", 10), // 5 seconds
  },

  // Validation settings
  validation: {
    requiredOrderStatus: ["CONFIRMED", "PROCESSING", "PAID"] as const,
    requiredPaymentStatus: ["PAID"] as const,
  },

  // Error handling
  errors: {
    codes: {
      INVALID_ORDER: "INVALID_ORDER",
      PAYMENT_NOT_CONFIRMED: "PAYMENT_NOT_CONFIRMED",
      API_ERROR: "API_ERROR",
      STORAGE_ERROR: "STORAGE_ERROR",
      GENERATION_TIMEOUT: "GENERATION_TIMEOUT",
      ALREADY_GENERATED: "ALREADY_GENERATED",
    } as const,
  },
} as const;

export type AirwayBillConfig = typeof AirwayBillConfig;
export type AirwayBillErrorCode = keyof typeof AirwayBillConfig.errors.codes;

// Configuration validation helper
export function validateAirwayBillConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Note: EasyParcel credentials are now validated at runtime from database
  // This function validates only static configuration values

  if (AirwayBillConfig.generation.timeout <= 0) {
    errors.push("Generation timeout must be greater than 0");
  }

  if (AirwayBillConfig.generation.retryAttempts < 0) {
    errors.push("Retry attempts must be 0 or greater");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}