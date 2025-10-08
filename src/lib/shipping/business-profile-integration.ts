/**
 * Business Profile Integration for Shipping
 *
 * Provides pickup address from BusinessProfile as single source of truth.
 * This module bridges shipping requirements with centralized business data.
 *
 * @module shipping/business-profile-integration
 */

import { PrismaClient } from '@prisma/client';
import type { MalaysianStateCode } from './constants';
import { DEFAULT_COUNTRY } from './constants';

const prisma = new PrismaClient();

/**
 * Pickup address derived from BusinessProfile
 * This is the address used as sender information for EasyParcel shipments
 */
export interface PickupAddress {
  businessName: string; // tradingName || legalName
  phone: string; // primaryPhone
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: MalaysianStateCode;
  postalCode: string;
  country: 'MY';
}

/**
 * Validation result for pickup address
 */
export interface PickupAddressValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Get pickup address from BusinessProfile
 *
 * Reads shippingAddress from BusinessProfile and maps to PickupAddress format.
 * Uses tradingName if available, falls back to legalName for business name.
 *
 * @returns Pickup address or null if BusinessProfile not configured
 * @throws Error if database query fails
 */
export async function getPickupAddressFromBusinessProfile(): Promise<PickupAddress | null> {
  try {
    const businessProfile = await prisma.businessProfile.findFirst({
      where: { isActive: true },
      select: {
        legalName: true,
        tradingName: true,
        primaryPhone: true,
        shippingAddress: true,
      },
    });

    if (!businessProfile) {
      console.log('[PickupAddress] No active BusinessProfile found');
      return null;
    }

    // BusinessProfile.shippingAddress is JSON field
    const shippingAddress = businessProfile.shippingAddress as {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    } | null;

    // If shippingAddress not configured, return null
    if (!shippingAddress?.addressLine1) {
      console.log('[PickupAddress] BusinessProfile exists but shippingAddress not configured');
      return null;
    }

    // Map BusinessProfile fields to PickupAddress
    const pickupAddress: PickupAddress = {
      businessName: businessProfile.tradingName || businessProfile.legalName,
      phone: businessProfile.primaryPhone,
      addressLine1: shippingAddress.addressLine1,
      addressLine2: shippingAddress.addressLine2 || undefined,
      city: shippingAddress.city || '',
      // Convert state to lowercase for EasyParcel API compatibility (Business Profile uses uppercase)
      state: (shippingAddress.state?.toLowerCase() as MalaysianStateCode) || 'sgr',
      postalCode: shippingAddress.postalCode || '',
      country: shippingAddress.country || DEFAULT_COUNTRY.CODE,
    };

    console.log('[PickupAddress] Successfully retrieved pickup address from BusinessProfile');
    return pickupAddress;
  } catch (error) {
    console.error('[PickupAddress] Failed to get pickup address:', error);
    throw new Error('Failed to retrieve pickup address from BusinessProfile');
  }
}

/**
 * Validate pickup address from BusinessProfile
 *
 * Checks if BusinessProfile shippingAddress meets EasyParcel requirements.
 * Used to show validation status in shipping settings UI.
 *
 * @returns Validation result with errors and warnings
 */
export async function validatePickupAddress(): Promise<PickupAddressValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const businessProfile = await prisma.businessProfile.findFirst({
      where: { isActive: true },
      select: {
        legalName: true,
        tradingName: true,
        primaryPhone: true,
        shippingAddress: true,
      },
    });

    // Check if BusinessProfile exists
    if (!businessProfile) {
      errors.push('Business profile not configured. Please set up your business profile first.');
      return { isValid: false, errors, warnings };
    }

    // Check if shippingAddress configured
    const shippingAddress = businessProfile.shippingAddress as {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    } | null;

    if (!shippingAddress) {
      errors.push('Shipping address not configured in business profile.');
      return { isValid: false, errors, warnings };
    }

    // Validate required address fields
    if (!shippingAddress.addressLine1 || shippingAddress.addressLine1.trim().length === 0) {
      errors.push('Address line 1 is required in business profile shipping address.');
    }

    if (!shippingAddress.city || shippingAddress.city.trim().length === 0) {
      errors.push('City is required in business profile shipping address.');
    }

    if (!shippingAddress.state) {
      errors.push('State is required in business profile shipping address.');
    }

    if (!shippingAddress.postalCode || !/^\d{5}$/.test(shippingAddress.postalCode)) {
      errors.push('Valid 5-digit postal code is required in business profile shipping address.');
    }

    // Validate phone format
    if (!businessProfile.primaryPhone || !/^\+60[0-9]{8,10}$/.test(businessProfile.primaryPhone)) {
      errors.push(
        'Valid Malaysian phone number (+60XXXXXXXXX) is required in business profile.'
      );
    }

    // Warnings for optional but recommended fields
    if (!businessProfile.tradingName) {
      warnings.push(
        'Trading name not set. Legal name will be used as sender name on shipping labels.'
      );
    }

    if (!shippingAddress.addressLine2) {
      warnings.push('Address line 2 not set. Consider adding unit/building details.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    console.error('[PickupAddress] Validation failed:', error);
    errors.push('Failed to validate pickup address. Please try again.');
    return { isValid: false, errors, warnings };
  }
}

/**
 * Check if pickup address is configured and valid
 *
 * Quick check used in shipping configuration validation.
 *
 * @returns True if pickup address is ready for use
 */
export async function isPickupAddressConfigured(): Promise<boolean> {
  const validation = await validatePickupAddress();
  return validation.isValid;
}

/**
 * Get pickup address with validation
 *
 * Returns pickup address only if it passes validation.
 * Used in API routes where valid address is required.
 *
 * @returns Pickup address
 * @throws Error if address not configured or invalid
 */
export async function getPickupAddressOrThrow(): Promise<PickupAddress> {
  const validation = await validatePickupAddress();

  if (!validation.isValid) {
    throw new Error(
      `Pickup address validation failed:\n${validation.errors.join('\n')}\n\n` +
        'Please configure your shipping address in Business Profile settings.'
    );
  }

  const address = await getPickupAddressFromBusinessProfile();

  if (!address) {
    throw new Error('Failed to retrieve pickup address from BusinessProfile');
  }

  return address;
}
