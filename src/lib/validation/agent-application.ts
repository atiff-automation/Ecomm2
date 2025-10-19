/**
 * Agent Application Validation Schemas
 * Centralized validation using Zod for all form steps
 * Following CLAUDE.md principles: Single source of truth, comprehensive validation
 */

import { z } from 'zod';
import { AgentApplicationStatus, ApplicationDecision } from '@prisma/client';

// IC Number validation for Malaysian format
const icNumberRegex = /^\d{6}-\d{2}-\d{4}$/;

// Malaysian phone number validation
const phoneRegex = /^(\+?6?01)[0-46-9]-?[0-9]{7,8}$/;

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Social Media Level enum as string literals
const SocialMediaLevelEnum = z.enum(['TIDAK_MAHIR', 'MAHIR', 'SANGAT_MAHIR']);

// Step 1: Terms validation
export const termsSchema = z.object({
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Anda mesti bersetuju dengan syarat-syarat untuk meneruskan',
  }),
});

// Step 2: Basic Information validation
export const basicInfoSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Nama penuh mestilah sekurang-kurangnya 2 aksara')
      .max(100, 'Nama penuh tidak boleh melebihi 100 aksara')
      .regex(
        /^[\p{L}\p{M}\s'./()-]+$/u,
        'Nama penuh hanya boleh mengandungi huruf, ruang, tanda petik, titik, dan tanda khas'
      ),

    icNumber: z
      .string()
      .regex(
        icNumberRegex,
        'Format No Kad Pengenalan tidak sah. Gunakan format: 123456-12-1234'
      ),

    phoneNumber: z
      .string()
      .regex(
        phoneRegex,
        'Format No Telefon tidak sah. Contoh: 012-3456789 atau +6012-3456789'
      ),

    address: z
      .string()
      .min(10, 'Alamat mestilah sekurang-kurangnya 10 aksara')
      .max(500, 'Alamat tidak boleh melebihi 500 aksara'),

    email: z
      .string()
      .regex(emailRegex, 'Format email tidak sah')
      .max(100, 'Email tidak boleh melebihi 100 aksara'),

    age: z
      .number()
      .min(18, 'Umur mestilah sekurang-kurangnya 18 tahun')
      .max(80, 'Umur tidak boleh melebihi 80 tahun'),

    hasBusinessExp: z.boolean(),

    businessLocation: z.string().max(100, 'Tidak boleh melebihi 100 aksara'),

    hasTeamLeadExp: z.boolean(),

    isRegistered: z.boolean(),

    jenis: z.enum(['KEDAI', 'MUDAH', 'TIDAK_BERKAITAN', 'LAIN_LAIN'], {
      errorMap: () => ({ message: 'Sila pilih jenis kedai' }),
    }),
  })
  .superRefine((data, ctx) => {
    // Validate businessLocation when hasBusinessExp is true
    if (
      data.hasBusinessExp &&
      (!data.businessLocation || data.businessLocation.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['businessLocation'],
        message:
          'Lokasi perniagaan diperlukan jika anda mempunyai pengalaman perniagaan',
      });
    }
  });

// Social media handle validation regex
const instagramHandleRegex =
  /^[a-zA-Z0-9][a-zA-Z0-9._]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
const tiktokHandleRegex =
  /^[a-zA-Z0-9][a-zA-Z0-9._]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;

// Step 3: Social Media validation
export const socialMediaSchema = z.object({
  instagramHandle: z
    .string()
    .max(30, 'Nama Instagram tidak boleh melebihi 30 aksara')
    .refine(
      val => {
        if (val === '') {
          return true;
        }
        if (val.length < 2) {
          return false;
        }
        if (
          val.includes('..') ||
          val.includes('__') ||
          val.includes('.-') ||
          val.includes('-.')
        ) {
          return false;
        }
        if (val.startsWith('.') || val.startsWith('_') || val.startsWith('-')) {
          return false;
        }
        if (val.endsWith('.') || val.endsWith('_') || val.endsWith('-')) {
          return false;
        }
        return /^[a-zA-Z0-9._]{2,30}$/.test(val);
      },
      {
        message:
          'Format nama Instagram tidak sah. Gunakan hanya huruf, angka, titik dan garis bawah',
      }
    )
    .optional()
    .or(z.literal('')),

  facebookHandle: z
    .string()
    .max(50, 'Nama Facebook tidak boleh melebihi 50 aksara')
    .optional()
    .or(z.literal('')),

  tiktokHandle: z
    .string()
    .max(25, 'Nama TikTok tidak boleh melebihi 25 aksara')
    .refine(
      val => {
        if (val === '') {
          return true;
        }
        if (val.length < 2) {
          return false;
        }
        if (
          val.includes('..') ||
          val.includes('__') ||
          val.includes('.-') ||
          val.includes('-.')
        ) {
          return false;
        }
        if (val.startsWith('.') || val.startsWith('_') || val.startsWith('-')) {
          return false;
        }
        if (val.endsWith('.') || val.endsWith('_') || val.endsWith('-')) {
          return false;
        }
        return /^[a-zA-Z0-9._]{2,25}$/.test(val);
      },
      {
        message:
          'Format nama TikTok tidak sah. Gunakan hanya huruf, angka, titik dan garis bawah',
      }
    )
    .optional()
    .or(z.literal('')),

  instagramLevel: SocialMediaLevelEnum.refine(() => true, {
    message: 'Sila pilih tahap kemahiran Instagram',
  }),

  facebookLevel: SocialMediaLevelEnum.refine(() => true, {
    message: 'Sila pilih tahap kemahiran Facebook',
  }),

  tiktokLevel: SocialMediaLevelEnum.refine(() => true, {
    message: 'Sila pilih tahap kemahiran TikTok',
  }),
});

// Step 4: Additional Information validation
export const additionalInfoSchema = z
  .object({
    hasJrmExp: z.boolean(),

    jrmProducts: z.string().max(500, 'Tidak boleh melebihi 500 aksara'),

    reasonToJoin: z
      .string()
      .min(10, 'Sila nyatakan sekurang-kurangnya 10 aksara')
      .max(1000, 'Tidak boleh melebihi 1000 aksara'),

    expectations: z
      .string()
      .min(10, 'Sila nyatakan sekurang-kurangnya 10 aksara')
      .max(1000, 'Tidak boleh melebihi 1000 aksara'),
  })
  .superRefine((data, ctx) => {
    // Validate jrmProducts when hasJrmExp is true
    if (
      data.hasJrmExp &&
      (!data.jrmProducts || data.jrmProducts.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['jrmProducts'],
        message: 'Sila nyatakan produk JRM yang pernah anda gunakan',
      });
    }
  });

// Step 5: Final Agreement validation
export const reviewSchema = z.object({
  finalAgreement: z.boolean().refine(val => val === true, {
    message:
      'Anda mesti bersetuju dengan pengakuan ini untuk menghantar permohonan',
  }),
});

// Complete application schema (all steps combined)
export const agentApplicationSchema = z
  .object({
    // Step 1: Terms
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'Anda mesti bersetuju dengan syarat-syarat untuk meneruskan',
    }),

    // Step 2: Basic Information
    fullName: z
      .string()
      .min(2, 'Nama penuh mestilah sekurang-kurangnya 2 aksara')
      .max(100, 'Nama penuh tidak boleh melebihi 100 aksara')
      .regex(
        /^[\p{L}\p{M}\s'./()-]+$/u,
        'Nama penuh hanya boleh mengandungi huruf, ruang, tanda petik, titik, dan tanda khas'
      ),

    icNumber: z
      .string()
      .regex(
        icNumberRegex,
        'Format No Kad Pengenalan tidak sah. Gunakan format: 123456-12-1234'
      ),

    phoneNumber: z
      .string()
      .regex(
        phoneRegex,
        'Format No Telefon tidak sah. Contoh: 012-3456789 atau +6012-3456789'
      ),

    address: z
      .string()
      .min(10, 'Alamat mestilah sekurang-kurangnya 10 aksara')
      .max(500, 'Alamat tidak boleh melebihi 500 aksara'),

    email: z
      .string()
      .regex(emailRegex, 'Format email tidak sah')
      .max(100, 'Email tidak boleh melebihi 100 aksara'),

    age: z
      .number()
      .min(18, 'Umur mestilah sekurang-kurangnya 18 tahun')
      .max(80, 'Umur tidak boleh melebihi 80 tahun'),

    hasBusinessExp: z.boolean(),

    businessLocation: z.string().max(100, 'Tidak boleh melebihi 100 aksara'),

    hasTeamLeadExp: z.boolean(),

    isRegistered: z.boolean(),

    jenis: z.enum(['KEDAI', 'MUDAH', 'TIDAK_BERKAITAN', 'LAIN_LAIN'], {
      errorMap: () => ({ message: 'Sila pilih jenis kedai' }),
    }),

    // Step 3: Social Media
    instagramHandle: z
      .string()
      .max(30, 'Nama Instagram tidak boleh melebihi 30 aksara')
      .refine(
        val => {
          if (val === '') {
            return true;
          }
          if (val.length < 2) {
            return false;
          }
          if (
            val.includes('..') ||
            val.includes('__') ||
            val.includes('.-') ||
            val.includes('-.')
          ) {
            return false;
          }
          if (
            val.startsWith('.') ||
            val.startsWith('_') ||
            val.startsWith('-')
          ) {
            return false;
          }
          if (val.endsWith('.') || val.endsWith('_') || val.endsWith('-')) {
            return false;
          }
          return /^[a-zA-Z0-9._]{2,30}$/.test(val);
        },
        {
          message:
            'Format nama Instagram tidak sah. Gunakan hanya huruf, angka, titik dan garis bawah',
        }
      )
      .optional()
      .or(z.literal('')),

    facebookHandle: z
      .string()
      .max(50, 'Nama Facebook tidak boleh melebihi 50 aksara')
      .optional()
      .or(z.literal('')),

    tiktokHandle: z
      .string()
      .max(25, 'Nama TikTok tidak boleh melebihi 25 aksara')
      .refine(
        val => {
          if (val === '') {
            return true;
          }
          if (val.length < 2) {
            return false;
          }
          if (
            val.includes('..') ||
            val.includes('__') ||
            val.includes('.-') ||
            val.includes('-.')
          ) {
            return false;
          }
          if (
            val.startsWith('.') ||
            val.startsWith('_') ||
            val.startsWith('-')
          ) {
            return false;
          }
          if (val.endsWith('.') || val.endsWith('_') || val.endsWith('-')) {
            return false;
          }
          return /^[a-zA-Z0-9._]{2,25}$/.test(val);
        },
        {
          message:
            'Format nama TikTok tidak sah. Gunakan hanya huruf, angka, titik dan garis bawah',
        }
      )
      .optional()
      .or(z.literal('')),

    instagramLevel: SocialMediaLevelEnum.refine(() => true, {
      message: 'Sila pilih tahap kemahiran Instagram',
    }),

    facebookLevel: SocialMediaLevelEnum.refine(() => true, {
      message: 'Sila pilih tahap kemahiran Facebook',
    }),

    tiktokLevel: SocialMediaLevelEnum.refine(() => true, {
      message: 'Sila pilih tahap kemahiran TikTok',
    }),

    // Step 4: Additional Information
    hasJrmExp: z.boolean(),

    jrmProducts: z.string().max(500, 'Tidak boleh melebihi 500 aksara'),

    reasonToJoin: z
      .string()
      .min(10, 'Sila nyatakan sekurang-kurangnya 10 aksara')
      .max(1000, 'Tidak boleh melebihi 1000 aksara'),

    expectations: z
      .string()
      .min(10, 'Sila nyatakan sekurang-kurangnya 10 aksara')
      .max(1000, 'Tidak boleh melebihi 1000 aksara'),

    // Step 5: Final Agreement
    finalAgreement: z.boolean().refine(val => val === true, {
      message:
        'Anda mesti bersetuju dengan pengakuan ini untuk menghantar permohonan',
    }),
  })
  .superRefine((data, ctx) => {
    // Validate businessLocation when hasBusinessExp is true
    if (
      data.hasBusinessExp &&
      (!data.businessLocation || data.businessLocation.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['businessLocation'],
        message:
          'Lokasi perniagaan diperlukan jika anda mempunyai pengalaman perniagaan',
      });
    }

    // Validate jrmProducts when hasJrmExp is true
    if (
      data.hasJrmExp &&
      (!data.jrmProducts || data.jrmProducts.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['jrmProducts'],
        message: 'Sila nyatakan produk JRM yang pernah anda gunakan',
      });
    }
  });

// Individual step schemas for validation
export const stepSchemas = {
  terms: termsSchema,
  'basic-info': basicInfoSchema,
  'social-media': socialMediaSchema,
  'additional-info': additionalInfoSchema,
  review: reviewSchema,
} as const;

// Type definitions
export type AgentApplicationData = z.infer<typeof agentApplicationSchema>;
export type TermsData = z.infer<typeof termsSchema>;
export type BasicInfoData = z.infer<typeof basicInfoSchema>;
export type SocialMediaData = z.infer<typeof socialMediaSchema>;
export type AdditionalInfoData = z.infer<typeof additionalInfoSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;

// Admin validation schemas
export const updateApplicationStatusSchema = z.object({
  status: z.nativeEnum(AgentApplicationStatus),
  adminNotes: z.string().max(1000).optional(),
  reviewerDecision: z.nativeEnum(ApplicationDecision).optional(),
});

export const applicationFiltersSchema = z.object({
  status: z.nativeEnum(AgentApplicationStatus).optional(),
  search: z.string().max(100).optional(),
  hasJrmExp: z.boolean().optional(),
  socialMediaLevel: SocialMediaLevelEnum.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type UpdateApplicationStatusData = z.infer<
  typeof updateApplicationStatusSchema
>;
export type ApplicationFiltersData = z.infer<typeof applicationFiltersSchema>;

// Utility validation functions
export const validateMalaysianIC = (icNumber: string): boolean => {
  return icNumberRegex.test(icNumber);
};

export const validateMalaysianPhone = (phoneNumber: string): boolean => {
  return phoneRegex.test(phoneNumber);
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');

  // Add Malaysian country code if not present
  if (cleaned.startsWith('01')) {
    return `+6${cleaned}`;
  }

  if (cleaned.startsWith('601')) {
    return `+${cleaned}`;
  }

  return phoneNumber;
};

export const formatICNumber = (icNumber: string): string => {
  // Remove all non-digits
  const cleaned = icNumber.replace(/\D/g, '');

  // Format as 123456-12-1234
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 12)}`;
  }

  return icNumber;
};
