/**
 * Agent Application Test Data Factories
 * Provides mock data for development and testing
 * Following CLAUDE.md principles: Centralized test data generation
 */

import { AgentApplicationFormData, BusinessType } from '@/types/agent-application';
import { AgentApplicationStatus, SocialMediaLevel, ApplicationDecision } from '@prisma/client';

// Sample IC numbers (fake but valid format)
const SAMPLE_IC_NUMBERS = [
  '850312-14-5678',
  '920605-08-1234',
  '880925-12-9876',
  '791204-01-5432',
  '940717-05-2468'
];

// Sample phone numbers
const SAMPLE_PHONE_NUMBERS = [
  '012-3456789',
  '013-9876543',
  '017-2468135',
  '019-1357924',
  '011-8642097'
];

// Sample addresses
const SAMPLE_ADDRESSES = [
  'No. 123, Jalan Melati 3/2, Taman Seri Indah, 47100 Puchong, Selangor',
  'Lot 456, Jalan Mawar, Kampung Baru, 53100 Kuala Lumpur',
  'No. 789, Lorong Cempaka 1, Taman Desa Harmoni, 81300 Skudai, Johor',
  '234, Jalan Kenanga, Bandar Baru Bangi, 43650 Bangi, Selangor',
  'Unit 567, Jalan Orkid 2/3, Taman Bayu Puteri, 80150 Johor Bahru, Johor'
];

// Sample names
const SAMPLE_NAMES = [
  'Siti Nurhaliza Ahmad',
  'Ahmad Firdaus Rahman',
  'Nurul Aina Abdullah',
  'Mohammad Hafiz Ibrahim',
  'Fatimah Zahra Yusof',
  'Aminuddin Hakim',
  'Zarina Mohd Nasir',
  'Iskandar Shah Ali'
];

// Sample social media handles
const SAMPLE_SOCIAL_HANDLES = {
  instagram: [
    'sitinur_official',
    'ahmadfirdaus92',
    'nurulaina.style',
    'hafiz_entrepreneur',
    'fatimah_business'
  ],
  facebook: [
    'Siti Nurhaliza Official',
    'Ahmad Firdaus Business',
    'Nurul Aina Lifestyle',
    'Hafiz Trading',
    'Fatimah Enterprise'
  ],
  tiktok: [
    'sitinur2023',
    'firdausbiz',
    'ainastyle',
    'hafiztrader',
    'fatimahbiz'
  ]
};

// Sample business locations
const SAMPLE_BUSINESS_LOCATIONS = [
  'Pasar Malam Taman SEA, Petaling Jaya',
  'Kedai Runcit Seri Indah, Puchong',
  'Online sahaja - Facebook dan Instagram',
  'Bazar Ramadan Kampung Baru',
  'NA - Tidak berniaga lagi',
  'Kedai di Kompleks Karamunsing, Kota Kinabalu'
];

// Sample JRM products
const SAMPLE_JRM_PRODUCTS = [
  'Minyak Kelapa Dara JRM, Kopi Jantan JRM',
  'Set Herba JRM untuk kesihatan',
  'NA - Belum pernah guna',
  'Produk kecantikan JRM - facial wash dan moisturizer',
  'Vitamin C JRM dan suplemen kesihatan'
];

// Sample reasons to join
const SAMPLE_REASONS = [
  'Ingin mendapat pendapatan sampingan yang stabil dan berkualiti',
  'Tertarik dengan produk JRM yang berkualiti tinggi dan halal',
  'Mahu membantu orang lain mendapat produk kesihatan yang baik',
  'Sudah ada pengalaman berniaga, ingin tambah line produk baru',
  'Ingin belajar skill pemasaran digital sambil menjual produk bagus'
];

// Sample expectations
const SAMPLE_EXPECTATIONS = [
  'Harap dapat support marketing yang baik dari JRM dan training yang berkesan',
  'Ingin dapat profit margin yang munasabah dan target sales yang realistik',
  'Mengharapkan produk yang konsisten berkualiti dan delivery yang cepat',
  'Ingin dapat bimbingan untuk develop business online terutama di social media',
  'Harap dapat networking yang baik dengan pengedar lain untuk berkongsi tips'
];

/**
 * Generate a random agent application form data
 */
export const createMockAgentApplication = (overrides: Partial<AgentApplicationFormData> = {}): AgentApplicationFormData => {
  const randomIndex = Math.floor(Math.random() * 5);

  return {
    // Step 1: Terms
    acceptTerms: true,

    // Step 2: Basic Information
    fullName: SAMPLE_NAMES[randomIndex],
    icNumber: SAMPLE_IC_NUMBERS[randomIndex],
    phoneNumber: SAMPLE_PHONE_NUMBERS[randomIndex],
    address: SAMPLE_ADDRESSES[randomIndex],
    email: `${SAMPLE_NAMES[randomIndex].toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
    age: Math.floor(Math.random() * 30) + 25, // Age between 25-55
    hasBusinessExp: Math.random() > 0.4, // 60% have business experience
    businessLocation: Math.random() > 0.3 ? SAMPLE_BUSINESS_LOCATIONS[randomIndex] : undefined,
    hasTeamLeadExp: Math.random() > 0.5, // 50% have team lead experience
    isRegistered: Math.random() > 0.6, // 40% are registered
    jenis: Math.random() > 0.5 ? BusinessType.KEDAI : BusinessType.MUDAH,

    // Step 3: Social Media
    instagramHandle: Math.random() > 0.2 ? SAMPLE_SOCIAL_HANDLES.instagram[randomIndex] : undefined,
    facebookHandle: Math.random() > 0.1 ? SAMPLE_SOCIAL_HANDLES.facebook[randomIndex] : undefined,
    tiktokHandle: Math.random() > 0.4 ? SAMPLE_SOCIAL_HANDLES.tiktok[randomIndex] : undefined,
    instagramLevel: getRandomSocialMediaLevel(),
    facebookLevel: getRandomSocialMediaLevel(),
    tiktokLevel: getRandomSocialMediaLevel(),

    // Step 4: Additional Information
    hasJrmExp: Math.random() > 0.6, // 40% have JRM experience
    jrmProducts: Math.random() > 0.4 ? SAMPLE_JRM_PRODUCTS[randomIndex] : 'NA',
    reasonToJoin: SAMPLE_REASONS[randomIndex],
    expectations: SAMPLE_EXPECTATIONS[randomIndex],

    // Step 5: Review
    finalAgreement: true,

    // Apply any overrides
    ...overrides
  };
};

/**
 * Generate partial form data for specific step
 */
export const createMockStepData = (step: string): Partial<AgentApplicationFormData> => {
  const mockData = createMockAgentApplication();

  switch (step) {
    case 'terms':
      return { acceptTerms: mockData.acceptTerms };

    case 'basic-info':
      return {
        fullName: mockData.fullName,
        icNumber: mockData.icNumber,
        phoneNumber: mockData.phoneNumber,
        address: mockData.address,
        email: mockData.email,
        age: mockData.age,
        hasBusinessExp: mockData.hasBusinessExp,
        businessLocation: mockData.businessLocation,
        hasTeamLeadExp: mockData.hasTeamLeadExp,
        isRegistered: mockData.isRegistered,
        jenis: mockData.jenis
      };

    case 'social-media':
      return {
        instagramHandle: mockData.instagramHandle,
        facebookHandle: mockData.facebookHandle,
        tiktokHandle: mockData.tiktokHandle,
        instagramLevel: mockData.instagramLevel,
        facebookLevel: mockData.facebookLevel,
        tiktokLevel: mockData.tiktokLevel
      };

    case 'additional-info':
      return {
        hasJrmExp: mockData.hasJrmExp,
        jrmProducts: mockData.jrmProducts,
        reasonToJoin: mockData.reasonToJoin,
        expectations: mockData.expectations
      };

    case 'review':
      return { finalAgreement: mockData.finalAgreement };

    default:
      return {};
  }
};

/**
 * Generate multiple mock applications
 */
export const createMockApplicationsList = (count: number = 10): AgentApplicationFormData[] => {
  return Array.from({ length: count }, () => createMockAgentApplication());
};

/**
 * Generate mock application with specific status
 */
export const createMockApplicationWithStatus = (status: AgentApplicationStatus): AgentApplicationFormData => {
  const baseData = createMockAgentApplication();

  switch (status) {
    case AgentApplicationStatus.DRAFT:
      return {
        ...baseData,
        acceptTerms: Math.random() > 0.5,
        finalAgreement: false
      };

    case AgentApplicationStatus.SUBMITTED:
    case AgentApplicationStatus.UNDER_REVIEW:
    case AgentApplicationStatus.APPROVED:
    case AgentApplicationStatus.REJECTED:
      return {
        ...baseData,
        acceptTerms: true,
        finalAgreement: true
      };

    default:
      return baseData;
  }
};

// Helper functions
function getRandomSocialMediaLevel(): SocialMediaLevel {
  const levels = [SocialMediaLevel.TIDAK_MAHIR, SocialMediaLevel.MAHIR, SocialMediaLevel.SANGAT_MAHIR];
  return levels[Math.floor(Math.random() * levels.length)];
}

/**
 * Create invalid form data for testing validation
 */
export const createInvalidAgentApplication = (): Partial<AgentApplicationFormData> => {
  return {
    fullName: 'A', // Too short
    icNumber: '123456', // Invalid format
    phoneNumber: '123', // Invalid format
    address: 'Short', // Too short
    email: 'invalid-email', // Invalid email
    age: 15, // Too young
    reasonToJoin: 'Too short', // Too short
    expectations: 'Short' // Too short
  };
};

/**
 * Create mock application for specific business type
 */
export const createMockApplicationByBusinessType = (businessType: BusinessType): AgentApplicationFormData => {
  return createMockAgentApplication({
    jenis: businessType,
    hasBusinessExp: businessType !== BusinessType.TIDAK_BERKAITAN,
    isRegistered: businessType === BusinessType.KEDAI,
    businessLocation: businessType === BusinessType.TIDAK_BERKAITAN ? 'NA' : SAMPLE_BUSINESS_LOCATIONS[0]
  });
};