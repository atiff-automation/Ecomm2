import { z } from 'zod';

/**
 * Validation Schemas for Settings
 * Following @CLAUDE.md principles - centralized validation, no hardcoding
 */

// Malaysian state codes enum
export const MalaysianStates = [
  'JOH',
  'KDH',
  'KTN',
  'MLK',
  'NSN',
  'PHG',
  'PRK',
  'PLS',
  'PNG',
  'KUL',
  'TRG',
  'SEL',
  'SBH',
  'SWK',
  'LBN',
] as const;

// Alias for backward compatibility
export const MALAYSIAN_STATES = MalaysianStates;

export type MalaysianState = (typeof MalaysianStates)[number];

// Malaysian phone number regex
const MALAYSIAN_PHONE_REGEX = /^(\+?6?01)[02-46-9]\d{7,8}$/;
const MALAYSIAN_LANDLINE_REGEX = /^(\+?6?0)[1-9]\d{8,9}$/;
const MALAYSIAN_POSTCODE_REGEX = /^\d{5}$/;

// SSM registration number regex (e.g., 123456-X)
const SSM_REGEX = /^\d{6,8}-[A-Z]$/;

// GST number regex (e.g., C12345678901)
const GST_REGEX = /^[A-Z]\d{11}$/;

/**
 * Personal Information Schema
 */
export const personalInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),

  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters'),

  phone: z
    .string()
    .regex(
      MALAYSIAN_PHONE_REGEX,
      'Invalid Malaysian mobile phone number (e.g., 012-3456789)'
    )
    .optional()
    .or(z.literal('')),

  dateOfBirth: z
    .string()
    .optional()
    .refine(date => {
      if (!date) {
        return true;
      }
      const parsedDate = new Date(date);
      const now = new Date();
      const age = now.getFullYear() - parsedDate.getFullYear();
      return age >= 13 && age <= 120;
    }, 'Age must be between 13 and 120 years'),
});

/**
 * Address Schema
 */
export const addressSchema = z.object({
  type: z.enum(['billing', 'shipping']),

  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),

  company: z
    .string()
    .max(100, 'Company name must be less than 100 characters')
    .optional(),

  addressLine1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(100, 'Address line 1 must be less than 100 characters'),

  addressLine2: z
    .string()
    .max(100, 'Address line 2 must be less than 100 characters')
    .optional(),

  city: z
    .string()
    .min(1, 'City is required')
    .max(50, 'City must be less than 50 characters'),

  state: z.enum(MalaysianStates, {
    errorMap: () => ({ message: 'Please select a valid Malaysian state' }),
  }),

  postalCode: z
    .string()
    .regex(
      MALAYSIAN_POSTCODE_REGEX,
      'Invalid Malaysian postal code (5 digits)'
    ),

  country: z.literal('Malaysia'),

  phone: z
    .string()
    .regex(MALAYSIAN_PHONE_REGEX, 'Invalid Malaysian phone number')
    .optional()
    .or(z.literal('')),

  isDefault: z.boolean(),
});

/**
 * Password Change Schema
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),

    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      ),

    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Notification Preferences Schema
 */
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.object({
    orderConfirmation: z.boolean(),
    orderStatusUpdate: z.boolean(),
    shippingUpdate: z.boolean(),
    deliveryUpdate: z.boolean(),
    paymentConfirmation: z.boolean(),
    promotionalOffers: z.boolean(),
    memberBenefits: z.boolean(),
    newsletter: z.boolean(),
  }),

  smsNotifications: z.object({
    orderConfirmation: z.boolean(),
    shippingUpdate: z.boolean(),
    deliveryUpdate: z.boolean(),
  }),

  marketingCommunications: z.boolean(),
  language: z.enum(['en', 'ms']),
});

/**
 * Business Profile Schema (Admin)
 */
export const businessProfileSchema = z.object({
  // Company Information
  legalName: z
    .string()
    .min(1, 'Legal name is required')
    .max(200, 'Legal name must be less than 200 characters'),

  tradingName: z
    .string()
    .max(200, 'Trading name must be less than 200 characters')
    .optional(),

  registrationNumber: z
    .string()
    .regex(SSM_REGEX, 'Invalid SSM format (e.g., 123456-X)'),

  taxRegistrationNumber: z
    .string()
    .regex(GST_REGEX, 'Invalid GST format (e.g., C12345678901)')
    .optional()
    .or(z.literal('')),

  businessType: z.enum(['SDN_BHD', 'ENTERPRISE', 'SOLE_PROPRIETOR']),

  establishedDate: z
    .string()
    .optional()
    .refine(date => {
      if (!date) {
        return true;
      }
      const parsedDate = new Date(date);
      return parsedDate <= new Date();
    }, 'Established date cannot be in the future'),

  // Contact Information
  primaryPhone: z
    .string()
    .regex(MALAYSIAN_LANDLINE_REGEX, 'Invalid Malaysian phone number'),

  secondaryPhone: z
    .string()
    .regex(MALAYSIAN_LANDLINE_REGEX, 'Invalid Malaysian phone number')
    .optional()
    .or(z.literal('')),

  primaryEmail: z
    .string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),

  supportEmail: z
    .string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .optional()
    .or(z.literal('')),

  website: z.string().url('Invalid website URL').optional().or(z.literal('')),

  // Banking Information (optional)
  bankName: z
    .string()
    .max(100, 'Bank name must be less than 100 characters')
    .optional(),

  bankAccountNumber: z
    .string()
    .min(10, 'Account number must be at least 10 digits')
    .max(20, 'Account number must be less than 20 digits')
    .regex(/^\d+$/, 'Account number must contain only digits')
    .optional(),

  bankAccountHolder: z
    .string()
    .max(200, 'Account holder name must be less than 200 characters')
    .optional(),
});

/**
 * Tax Configuration Schema
 */
export const taxConfigurationSchema = z.object({
  gstRegistered: z.boolean(),

  gstNumber: z
    .string()
    .regex(GST_REGEX, 'Invalid GST number format')
    .optional()
    .or(z.literal('')),

  sstRegistered: z.boolean(),

  sstNumber: z
    .string()
    .max(50, 'SST number must be less than 50 characters')
    .optional()
    .or(z.literal('')),

  defaultGstRate: z
    .number()
    .min(0, 'GST rate cannot be negative')
    .max(100, 'GST rate cannot exceed 100%'),

  defaultSstRate: z
    .number()
    .min(0, 'SST rate cannot be negative')
    .max(100, 'SST rate cannot exceed 100%'),

  taxInclusivePricing: z.boolean(),
  autoCalculateTax: z.boolean(),
});

// Type exports
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type NotificationPreferencesData = z.infer<
  typeof notificationPreferencesSchema
>;
export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;
export type TaxConfigurationFormData = z.infer<typeof taxConfigurationSchema>;

/**
 * Malaysian states with display names
 */
export const malaysianStatesOptions = [
  { value: 'JOH', label: 'Johor' },
  { value: 'KDH', label: 'Kedah' },
  { value: 'KTN', label: 'Kelantan' },
  { value: 'MLK', label: 'Melaka' },
  { value: 'NSN', label: 'Negeri Sembilan' },
  { value: 'PHG', label: 'Pahang' },
  { value: 'PRK', label: 'Perak' },
  { value: 'PLS', label: 'Perlis' },
  { value: 'PNG', label: 'Pulau Pinang' },
  { value: 'KUL', label: 'Kuala Lumpur' },
  { value: 'TRG', label: 'Terengganu' },
  { value: 'SEL', label: 'Selangor' },
  { value: 'SBH', label: 'Sabah' },
  { value: 'SWK', label: 'Sarawak' },
  { value: 'LBN', label: 'Labuan' },
];
