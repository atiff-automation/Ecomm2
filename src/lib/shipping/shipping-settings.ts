/**
 * Shipping Settings Management
 *
 * CRUD operations for shipping configuration stored in SystemConfig table.
 * Settings are stored as JSON in a single SystemConfig record with key "shipping_settings".
 *
 * @module shipping/shipping-settings
 */

import { PrismaClient } from '@prisma/client';
import type { ShippingSettings, ShippingSettingsUpdate } from './types';
import {
  COURIER_SELECTION_STRATEGIES,
  DEFAULT_FREE_SHIPPING_THRESHOLD,
} from './constants';
import { ShippingSettingsValidationSchema } from './validation';

const prisma = new PrismaClient();

const SETTINGS_KEY = 'shipping_settings';

/**
 * Get shipping settings from database
 *
 * @returns Current shipping settings or null if not configured
 * @throws Error if database query fails
 */
export async function getShippingSettings(): Promise<ShippingSettings | null> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (!config) {
      return null;
    }

    // Parse JSON value to ShippingSettings object
    const settings = JSON.parse(config.value) as ShippingSettings;

    // Convert ISO date strings back to Date objects
    return {
      ...settings,
      createdAt: new Date(settings.createdAt),
      updatedAt: new Date(settings.updatedAt),
    };
  } catch (error) {
    console.error('[ShippingSettings] Failed to get settings:', error);
    throw new Error('Failed to retrieve shipping settings');
  }
}

/**
 * Save shipping settings to database
 *
 * @param settings - Complete shipping settings object
 * @returns Saved settings
 * @throws Error if validation fails or database operation fails
 */
export async function saveShippingSettings(
  settings: Omit<ShippingSettings, 'createdAt' | 'updatedAt'>
): Promise<ShippingSettings> {
  try {
    // Validate settings before saving
    validateShippingSettings(settings);

    const now = new Date();
    const existingConfig = await prisma.systemConfig.findUnique({
      where: { key: SETTINGS_KEY },
    });

    const fullSettings: ShippingSettings = {
      ...settings,
      createdAt: existingConfig
        ? new Date(JSON.parse(existingConfig.value).createdAt)
        : now,
      updatedAt: now,
    };

    // Upsert to SystemConfig table
    await prisma.systemConfig.upsert({
      where: { key: SETTINGS_KEY },
      create: {
        key: SETTINGS_KEY,
        value: JSON.stringify(fullSettings),
        type: 'json',
      },
      update: {
        value: JSON.stringify(fullSettings),
        updatedAt: now,
      },
    });

    console.log('[ShippingSettings] Settings saved successfully');
    return fullSettings;
  } catch (error) {
    console.error('[ShippingSettings] Failed to save settings:', error);
    throw error;
  }
}

/**
 * Update shipping settings (partial update)
 *
 * @param updates - Partial settings to update
 * @returns Updated settings
 * @throws Error if settings don't exist or update fails
 */
export async function updateShippingSettings(
  updates: ShippingSettingsUpdate
): Promise<ShippingSettings> {
  try {
    const currentSettings = await getShippingSettings();

    if (!currentSettings) {
      throw new Error(
        'Shipping settings not found. Please create settings first.'
      );
    }

    // Merge updates with current settings
    const updatedSettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date(),
    };

    // Validate merged settings
    validateShippingSettings(updatedSettings);

    await prisma.systemConfig.update({
      where: { key: SETTINGS_KEY },
      data: {
        value: JSON.stringify(updatedSettings),
        updatedAt: new Date(),
      },
    });

    console.log('[ShippingSettings] Settings updated successfully');
    return updatedSettings;
  } catch (error) {
    console.error('[ShippingSettings] Failed to update settings:', error);
    throw error;
  }
}

/**
 * Delete shipping settings
 *
 * @returns True if deleted successfully
 * @throws Error if deletion fails
 */
export async function deleteShippingSettings(): Promise<boolean> {
  try {
    await prisma.systemConfig.delete({
      where: { key: SETTINGS_KEY },
    });

    console.log('[ShippingSettings] Settings deleted successfully');
    return true;
  } catch (error) {
    console.error('[ShippingSettings] Failed to delete settings:', error);
    throw new Error('Failed to delete shipping settings');
  }
}

/**
 * Check if shipping is configured
 *
 * @returns True if settings exist and are valid
 */
export async function isShippingConfigured(): Promise<boolean> {
  try {
    const settings = await getShippingSettings();
    return settings !== null && isValidConfiguration(settings);
  } catch (error) {
    console.error('[ShippingSettings] Failed to check configuration:', error);
    return false;
  }
}

/**
 * Get default shipping settings
 *
 * @returns Default settings object (for initialization)
 */
export function getDefaultShippingSettings(): Omit<
  ShippingSettings,
  'apiKey' | 'createdAt' | 'updatedAt'
> {
  return {
    environment: 'sandbox',
    courierSelectionMode: COURIER_SELECTION_STRATEGIES.CHEAPEST,
    selectedCouriers: undefined,
    freeShippingEnabled: true,
    freeShippingThreshold: DEFAULT_FREE_SHIPPING_THRESHOLD,
    autoUpdateOrderStatus: true,
    whatsappNotificationsEnabled: false,
  };
}

/**
 * Validate shipping settings
 *
 * NOTE: Pickup address validation removed - validated via BusinessProfile instead.
 * Use validatePickupAddress() from business-profile-integration.ts.
 *
 * @param settings - Settings to validate
 * @throws Error if validation fails
 * @private
 */
function validateShippingSettings(
  settings: Partial<ShippingSettings>
): asserts settings is ShippingSettings {
  const result = ShippingSettingsValidationSchema.safeParse(settings);

  if (!result.success) {
    const errors = result.error.errors.map(
      err => `${err.path.join('.')}: ${err.message}`
    );
    throw new Error(
      `Shipping settings validation failed:\n${errors.join('\n')}`
    );
  }
}

/**
 * Check if settings form a valid configuration
 *
 * @param settings - Settings to check
 * @returns True if configuration is valid
 * @private
 */
function isValidConfiguration(settings: ShippingSettings): boolean {
  try {
    validateShippingSettings(settings);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get shipping settings with fallback to defaults
 *
 * Used in API routes where settings are required.
 *
 * @returns Shipping settings
 * @throws Error if settings not configured
 */
export async function getShippingSettingsOrThrow(): Promise<ShippingSettings> {
  const settings = await getShippingSettings();

  if (!settings) {
    throw new Error(
      'Shipping is not configured. Please configure shipping settings in the admin panel.'
    );
  }

  return settings;
}
