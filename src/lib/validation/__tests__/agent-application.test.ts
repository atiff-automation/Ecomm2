/**
 * Agent Application Validation Tests
 * Comprehensive unit tests for agent application validation schemas
 * Following CLAUDE.md principles: Systematic testing, centralized validation logic
 */

import {
  agentApplicationSchema,
  stepSchemas,
  AgentApplicationData,
} from '../agent-application';
import { SocialMediaLevel } from '@prisma/client';
import { BusinessType } from '@/types/agent-application';

describe('Agent Application Validation', () => {
  // Valid test data following Malaysian patterns
  const validData: AgentApplicationData = {
    // Step 1: Terms
    acceptTerms: true,

    // Step 2: Basic Information
    fullName: 'Ahmad bin Abdullah',
    icNumber: '901020-01-1234',
    phoneNumber: '+60123456789',
    email: 'ahmad.abdullah@example.com',
    address: 'No. 123, Jalan Utama, Taman Indah, 50100 Kuala Lumpur',
    age: 35,

    // Business Experience
    hasBusinessExp: true,
    businessLocation: 'Kuala Lumpur',
    hasTeamLeadExp: true,
    isRegistered: true,
    jenis: BusinessType.KEDAI,

    // Step 3: Social Media
    instagramHandle: 'ahmad_entrepreneur',
    facebookHandle: 'Ahmad Abdullah Business',
    tiktokHandle: 'ahmad_biz',
    instagramLevel: SocialMediaLevel.MAHIR,
    facebookLevel: SocialMediaLevel.SANGAT_MAHIR,
    tiktokLevel: SocialMediaLevel.TIDAK_MAHIR,

    // Step 4: Additional Information
    hasJrmExp: true,
    jrmProducts: 'JRM Premium Skincare, JRM Supplements',
    reasonToJoin:
      'Ingin mengembangkan perniagaan dan membantu lebih ramai orang mendapat produk berkualiti JRM',
    expectations:
      'Mencapai tahap agent platinum dalam tempoh 2 tahun dan membina pasukan yang kuat',

    // Step 5: Final Agreement
    finalAgreement: true,
  };

  describe('Complete Form Validation', () => {
    it('should accept valid complete application data', () => {
      const result = agentApplicationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should reject data with missing required fields', () => {
      const { fullName, ...incompleteData } = validData;
      const result = agentApplicationSchema.safeParse(incompleteData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            code: 'invalid_type',
            path: ['fullName'],
          })
        );
      }
    });
  });

  describe('Step 1: Terms Validation', () => {
    it('should accept when terms are accepted', () => {
      const data = { acceptTerms: true };
      const result = stepSchemas.terms.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject when terms are not accepted', () => {
      const data = { acceptTerms: false };
      const result = stepSchemas.terms.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Anda mesti bersetuju dengan syarat-syarat'
        );
      }
    });

    it('should reject when acceptTerms is missing', () => {
      const data = {};
      const result = stepSchemas.terms.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Step 2: Basic Information Validation', () => {
    describe('Full Name Validation', () => {
      it('should accept valid Malaysian names', () => {
        const validNames = [
          'Ahmad bin Abdullah',
          'Siti Nurhaliza binti Ahmad',
          'Tan Wei Ming',
          'K. Kumaran',
          'Lee Chong Wei',
          'Maria Fernandez',
        ];

        validNames.forEach(name => {
          const data = { ...validData, fullName: name };
          const result = stepSchemas['basic-info'].safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should reject names that are too short', () => {
        const data = { ...validData, fullName: 'A' };
        const result = stepSchemas['basic-info'].safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject names that are too long', () => {
        const data = { ...validData, fullName: 'A'.repeat(101) };
        const result = stepSchemas['basic-info'].safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    describe('IC Number Validation', () => {
      it('should accept valid Malaysian IC numbers', () => {
        const validICs = [
          '901020-01-1234',
          '850315-14-5678',
          '920707-02-9876',
          '880412-03-4567',
        ];

        validICs.forEach(ic => {
          const data = { ...validData, icNumber: ic };
          const result = stepSchemas['basic-info'].safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid IC number formats', () => {
        const invalidICs = [
          '90102-01-1234', // Wrong year format
          '901020-1-1234', // Wrong state format
          '901020-01-123', // Wrong sequence format
          '901020011234', // Missing dashes
          '12345678901234', // Too long
          'ABC123-01-1234', // Contains letters
        ];

        invalidICs.forEach(ic => {
          const data = { ...validData, icNumber: ic };
          const result = stepSchemas['basic-info'].safeParse(data);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('Phone Number Validation', () => {
      it('should accept valid Malaysian phone numbers', () => {
        const validPhones = [
          '+60123456789',
          '0123456789',
          '+60134567890',
          '0134567890',
          '+60195678901',
          '0195678901',
        ];

        validPhones.forEach(phone => {
          const data = { ...validData, phoneNumber: phone };
          const result = stepSchemas['basic-info'].safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid phone number formats', () => {
        const invalidPhones = [
          '123456789', // Too short
          '+60123456', // Too short
          '+60223456789', // Invalid prefix
          '012345678901', // Too long
          '+601234567890123', // Too long
          'abc123456789', // Contains letters
        ];

        invalidPhones.forEach(phone => {
          const data = { ...validData, phoneNumber: phone };
          const result = stepSchemas['basic-info'].safeParse(data);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('Age Validation', () => {
      it('should accept valid ages', () => {
        const validAges = [18, 25, 35, 45, 65];

        validAges.forEach(age => {
          const data = { ...validData, age };
          const result = stepSchemas['basic-info'].safeParse(data);
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid ages', () => {
        const invalidAges = [17, 0, -5, 101];

        invalidAges.forEach(age => {
          const data = { ...validData, age };
          const result = stepSchemas['basic-info'].safeParse(data);
          expect(result.success).toBe(false);
        });
      });
    });

    describe('Address Validation', () => {
      it('should accept valid Malaysian addresses', () => {
        const data = {
          ...validData,
          address: 'No. 123, Jalan Utama, Taman Indah, 50100 Kuala Lumpur',
        };
        const result = stepSchemas['basic-info'].safeParse(data);
        expect(result.success).toBe(true);
      });

      it('should reject addresses that are too short', () => {
        const data = { ...validData, address: 'KL' };
        const result = stepSchemas['basic-info'].safeParse(data);
        expect(result.success).toBe(false);
      });

      it('should reject addresses that are too long', () => {
        const data = { ...validData, address: 'A'.repeat(501) };
        const result = stepSchemas['basic-info'].safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Step 3: Social Media Validation', () => {
    it('should accept valid social media data', () => {
      const data = {
        instagramHandle: 'valid_handle',
        facebookHandle: 'Valid Facebook Name',
        tiktokHandle: 'valid_tiktok',
        instagramLevel: SocialMediaLevel.MAHIR,
        facebookLevel: SocialMediaLevel.SANGAT_MAHIR,
        tiktokLevel: SocialMediaLevel.TIDAK_MAHIR,
      };
      const result = stepSchemas['social-media'].safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept when social media handles are empty but levels are provided', () => {
      const data = {
        instagramHandle: '',
        facebookHandle: '',
        tiktokHandle: '',
        instagramLevel: SocialMediaLevel.TIDAK_MAHIR,
        facebookLevel: SocialMediaLevel.TIDAK_MAHIR,
        tiktokLevel: SocialMediaLevel.TIDAK_MAHIR,
      };
      const result = stepSchemas['social-media'].safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate Instagram handle format', () => {
      const invalidHandles = [
        'invalid handle with spaces',
        'invalid-handle-with-dashes-at-end-',
        '-invalid-handle-at-start',
        'invalid..double..dots',
        'a', // Too short
        'a'.repeat(31), // Too long
      ];

      invalidHandles.forEach(handle => {
        const data = { ...validData, instagramHandle: handle };
        const result = stepSchemas['social-media'].safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should validate TikTok handle format', () => {
      const invalidHandles = [
        'invalid handle with spaces',
        'invalid-handle-with-dashes-at-end-',
        '-invalid-handle-at-start',
        'invalid..double..dots',
        'a', // Too short
        'a'.repeat(26), // Too long
      ];

      invalidHandles.forEach(handle => {
        const data = { ...validData, tiktokHandle: handle };
        const result = stepSchemas['social-media'].safeParse(data);
        expect(result.success).toBe(false);
      });
    });

    it('should require social media levels', () => {
      const data = {
        instagramHandle: 'valid_handle',
        facebookHandle: 'Valid Facebook Name',
        tiktokHandle: 'valid_tiktok',
        // Missing levels
      };
      const result = stepSchemas['social-media'].safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Step 4: Additional Information Validation', () => {
    it('should accept valid additional information', () => {
      const data = {
        hasJrmExp: true,
        jrmProducts: 'JRM Premium Skincare',
        reasonToJoin: 'Valid reason to join with sufficient length',
        expectations: 'Valid expectations with sufficient detail',
      };
      const result = stepSchemas['additional-info'].safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should require jrmProducts when hasJrmExp is true', () => {
      const data = {
        hasJrmExp: true,
        jrmProducts: '', // Empty when hasJrmExp is true
        reasonToJoin: 'Valid reason to join',
        expectations: 'Valid expectations',
      };
      const result = stepSchemas['additional-info'].safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow empty jrmProducts when hasJrmExp is false', () => {
      const data = {
        hasJrmExp: false,
        jrmProducts: '',
        reasonToJoin: 'Valid reason to join',
        expectations: 'Valid expectations',
      };
      const result = stepSchemas['additional-info'].safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate minimum length for reasonToJoin', () => {
      const data = {
        hasJrmExp: false,
        reasonToJoin: 'Short', // Too short
        expectations: 'Valid expectations with sufficient detail',
      };
      const result = stepSchemas['additional-info'].safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate minimum length for expectations', () => {
      const data = {
        hasJrmExp: false,
        reasonToJoin: 'Valid reason to join with sufficient length',
        expectations: 'Short', // Too short
      };
      const result = stepSchemas['additional-info'].safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate maximum length for text fields', () => {
      const longText = 'A'.repeat(1001);
      const data = {
        hasJrmExp: false,
        reasonToJoin: longText, // Too long
        expectations: 'Valid expectations',
      };
      const result = stepSchemas['additional-info'].safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Business Experience Validation', () => {
    it('should require businessLocation when hasBusinessExp is true', () => {
      const data = {
        ...validData,
        hasBusinessExp: true,
        businessLocation: '', // Empty when hasBusinessExp is true
      };
      const result = stepSchemas['basic-info'].safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow empty businessLocation when hasBusinessExp is false', () => {
      const data = {
        ...validData,
        hasBusinessExp: false,
        businessLocation: '',
      };
      const result = stepSchemas['basic-info'].safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate business location length', () => {
      const data = {
        ...validData,
        hasBusinessExp: true,
        businessLocation: 'A'.repeat(101), // Too long
      };
      const result = stepSchemas['basic-info'].safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should sanitize and validate special characters in names', () => {
      const data = {
        ...validData,
        fullName: 'Ahmad bin Abdullah <script>alert("xss")</script>',
      };
      const result = agentApplicationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should handle unicode characters in names correctly', () => {
      const data = {
        ...validData,
        fullName: 'محمد بن عبدالله', // Arabic name
      };
      const result = agentApplicationSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate against extremely long inputs for security', () => {
      const maliciousData = {
        ...validData,
        address: 'A'.repeat(10000), // Extremely long input
      };
      const result = agentApplicationSchema.safeParse(maliciousData);
      expect(result.success).toBe(false);
    });

    it('should reject SQL injection attempts', () => {
      const maliciousData = {
        ...validData,
        fullName: "'; DROP TABLE users; --",
      };
      const result = agentApplicationSchema.safeParse(maliciousData);
      expect(result.success).toBe(false);
    });
  });

  describe('Localization and Malaysian Context', () => {
    it('should accept common Malaysian name patterns', () => {
      const malaysianNames = [
        'Ahmad bin Abdullah',
        'Siti Nurhaliza binti Ahmad',
        'Tan Wei Ming',
        'K. Kumaran',
        'Lee Chong Wei',
        'Maria Fernandez',
        'Nurul Aina binti Mohamed',
        'Rajesh s/o Krishnan',
        'Wong Li Hua',
      ];

      malaysianNames.forEach(name => {
        const data = { ...validData, fullName: name };
        const result = agentApplicationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should accept common Malaysian business locations', () => {
      const locations = [
        'Kuala Lumpur',
        'Selangor',
        'Johor Bahru',
        'George Town, Pulau Pinang',
        'Kota Kinabalu, Sabah',
        'Kuching, Sarawak',
      ];

      locations.forEach(location => {
        const data = {
          ...validData,
          hasBusinessExp: true,
          businessLocation: location,
        };
        const result = agentApplicationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });
  });
});
