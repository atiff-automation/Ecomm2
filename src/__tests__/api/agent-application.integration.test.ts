/**
 * Agent Application API Integration Tests
 * End-to-end testing of agent application API endpoints
 * Following CLAUDE.md principles: Systematic testing, comprehensive coverage
 */

import { createMocks } from 'node-mocks-http';
import { POST, GET, PATCH } from '@/app/api/agent-application/route';
import { AgentApplicationService } from '@/lib/services/agent-application.service';
import { agentApplicationSchema } from '@/lib/validation/agent-application';
import { AgentApplicationStatus, SocialMediaLevel } from '@prisma/client';

// Mock the service
jest.mock('@/lib/services/agent-application.service');
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('@/lib/utils/rate-limit', () => ({
  rateLimit: () => ({
    check: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

const mockAgentApplicationService = AgentApplicationService as jest.Mocked<
  typeof AgentApplicationService
>;
const { getServerSession } = require('next-auth');

describe('Agent Application API Integration Tests', () => {
  // Valid test data
  const validApplicationData = {
    acceptTerms: true,
    fullName: 'Ahmad bin Abdullah',
    icNumber: '901020-01-1234',
    phoneNumber: '+60123456789',
    email: 'ahmad.abdullah@example.com',
    address: 'No. 123, Jalan Utama, Taman Indah, 50100 Kuala Lumpur',
    age: 35,
    hasBusinessExp: true,
    businessLocation: 'Kuala Lumpur',
    hasTeamLeadExp: true,
    isRegistered: true,
    instagramHandle: 'ahmad_entrepreneur',
    facebookHandle: 'Ahmad Abdullah Business',
    tiktokHandle: 'ahmad_biz',
    instagramLevel: SocialMediaLevel.MAHIR,
    facebookLevel: SocialMediaLevel.SANGAT_MAHIR,
    tiktokLevel: SocialMediaLevel.TIDAK_MAHIR,
    hasJrmExp: true,
    jrmProducts: 'JRM Premium Skincare, JRM Supplements',
    reasonToJoin:
      'Ingin mengembangkan perniagaan dan membantu lebih ramai orang mendapat produk berkualiti JRM',
    expectations:
      'Mencapai tahap agent platinum dalam tempoh 2 tahun dan membina pasukan yang kuat',
    finalAgreement: true,
  };

  const mockApplication = {
    id: 'app-123',
    ...validApplicationData,
    status: AgentApplicationStatus.SUBMITTED,
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    reviewedAt: null,
    reviewedBy: null,
    adminNotes: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getServerSession.mockResolvedValue(null);
  });

  describe('POST /api/agent-application', () => {
    it('should successfully submit a valid application', async () => {
      // Mock service response
      mockAgentApplicationService.createApplication.mockResolvedValue(
        mockApplication
      );

      // Create request
      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: validApplicationData,
        },
      });

      // Execute request
      const response = await POST(req as any);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(data).toEqual(
        expect.objectContaining({
          id: mockApplication.id,
          status: mockApplication.status,
          message: expect.any(String),
        })
      );
      expect(
        mockAgentApplicationService.createApplication
      ).toHaveBeenCalledWith({
        formData: validApplicationData,
        userId: undefined,
      });
    });

    it('should return 400 for missing form data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {},
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Data permohonan diperlukan');
    });

    it('should return 400 for invalid form data', async () => {
      const invalidData = {
        ...validApplicationData,
        age: 15, // Too young
        icNumber: 'invalid-ic',
        phoneNumber: 'invalid-phone',
      };

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: invalidData,
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Data permohonan tidak sah');
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
    });

    it('should handle service errors gracefully', async () => {
      mockAgentApplicationService.createApplication.mockRejectedValue(
        new Error('Database connection failed')
      );

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: validApplicationData,
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('should handle rate limiting', async () => {
      mockAgentApplicationService.createApplication.mockRejectedValue(
        new Error('rate limit exceeded')
      );

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: validApplicationData,
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe(
        'Terlalu banyak permohonan. Sila cuba lagi kemudian.'
      );
    });

    it('should handle duplicate application conflicts', async () => {
      mockAgentApplicationService.createApplication.mockRejectedValue(
        new Error('Email ini sudah mempunyai permohonan aktif')
      );

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: validApplicationData,
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Email ini sudah mempunyai permohonan aktif');
    });

    it('should include user ID when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      };
      getServerSession.mockResolvedValue(mockSession);
      mockAgentApplicationService.createApplication.mockResolvedValue(
        mockApplication
      );

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: validApplicationData,
        },
      });

      await POST(req as any);

      expect(
        mockAgentApplicationService.createApplication
      ).toHaveBeenCalledWith({
        formData: validApplicationData,
        userId: 'user-123',
      });
    });
  });

  describe('GET /api/agent-application', () => {
    it('should return application data for valid ID', async () => {
      mockAgentApplicationService.getApplicationById.mockResolvedValue(
        mockApplication
      );

      const { req } = createMocks({
        method: 'GET',
        query: { id: 'app-123' },
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: mockApplication.id,
        status: mockApplication.status,
        submittedAt: mockApplication.submittedAt,
        reviewedAt: mockApplication.reviewedAt,
        createdAt: mockApplication.createdAt,
        fullName: mockApplication.fullName,
        email: mockApplication.email,
      });
    });

    it('should return 400 for missing ID', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: {},
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID permohonan diperlukan');
    });

    it('should return 404 for non-existent application', async () => {
      mockAgentApplicationService.getApplicationById.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'GET',
        query: { id: 'non-existent' },
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Permohonan tidak dijumpai');
    });

    it('should handle service errors', async () => {
      mockAgentApplicationService.getApplicationById.mockRejectedValue(
        new Error('Database error')
      );

      const { req } = createMocks({
        method: 'GET',
        query: { id: 'app-123' },
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database error');
    });
  });

  describe('PATCH /api/agent-application', () => {
    it('should update application when authenticated', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      };
      getServerSession.mockResolvedValue(mockSession);

      const updatedApplication = {
        ...mockApplication,
        fullName: 'Ahmad bin Abdullah Updated',
      };
      mockAgentApplicationService.updateApplication.mockResolvedValue(
        updatedApplication
      );

      const updateData = {
        fullName: 'Ahmad bin Abdullah Updated',
      };

      const { req } = createMocks({
        method: 'PATCH',
        body: {
          id: 'app-123',
          formData: updateData,
        },
      });

      const response = await PATCH(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        id: updatedApplication.id,
        status: updatedApplication.status,
        message: 'Permohonan telah dikemaskini',
      });
      expect(
        mockAgentApplicationService.updateApplication
      ).toHaveBeenCalledWith('app-123', updateData, 'user-123');
    });

    it('should return 401 when not authenticated', async () => {
      getServerSession.mockResolvedValue(null);

      const { req } = createMocks({
        method: 'PATCH',
        body: {
          id: 'app-123',
          formData: { fullName: 'Updated Name' },
        },
      });

      const response = await PATCH(req as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Pengesahan diperlukan');
    });

    it('should return 400 for missing required fields', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      };
      getServerSession.mockResolvedValue(mockSession);

      const { req } = createMocks({
        method: 'PATCH',
        body: {
          id: 'app-123',
          // Missing formData
        },
      });

      const response = await PATCH(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID permohonan dan data diperlukan');
    });

    it('should handle service errors', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
        },
      };
      getServerSession.mockResolvedValue(mockSession);
      mockAgentApplicationService.updateApplication.mockRejectedValue(
        new Error('Update failed')
      );

      const { req } = createMocks({
        method: 'PATCH',
        body: {
          id: 'app-123',
          formData: { fullName: 'Updated Name' },
        },
      });

      const response = await PATCH(req as any);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Update failed');
    });
  });

  describe('Validation Integration', () => {
    it('should validate Malaysian IC number format', async () => {
      const invalidIcData = {
        ...validApplicationData,
        icNumber: '12345-67-890', // Invalid format
      };

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: invalidIcData,
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toContainEqual(
        expect.objectContaining({
          field: 'icNumber',
          message: expect.stringContaining('format'),
        })
      );
    });

    it('should validate Malaysian phone number format', async () => {
      const invalidPhoneData = {
        ...validApplicationData,
        phoneNumber: '123-456-7890', // Invalid Malaysian format
      };

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: invalidPhoneData,
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toContainEqual(
        expect.objectContaining({
          field: 'phoneNumber',
          message: expect.stringContaining('format'),
        })
      );
    });

    it('should validate age requirements', async () => {
      const underageData = {
        ...validApplicationData,
        age: 16, // Under 18
      };

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: underageData,
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toContainEqual(
        expect.objectContaining({
          field: 'age',
          message: expect.stringContaining('18'),
        })
      );
    });

    it('should validate social media level enum values', async () => {
      const invalidSocialData = {
        ...validApplicationData,
        instagramLevel: 'INVALID_LEVEL' as any,
      };

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: invalidSocialData,
        },
      });

      const response = await POST(req as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details).toContainEqual(
        expect.objectContaining({
          field: 'instagramLevel',
        })
      );
    });
  });

  describe('Security Tests', () => {
    it('should prevent XSS in form data', async () => {
      const xssData = {
        ...validApplicationData,
        fullName: '<script>alert("xss")</script>Ahmad',
        reasonToJoin: 'Valid reason<img src=x onerror=alert("xss")>',
      };

      mockAgentApplicationService.createApplication.mockResolvedValue(
        mockApplication
      );

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: xssData,
        },
      });

      const response = await POST(req as any);

      expect(response.status).toBe(201);
      // Service should have sanitized the data
      expect(
        mockAgentApplicationService.createApplication
      ).toHaveBeenCalledWith({
        formData: expect.objectContaining({
          fullName: expect.not.stringContaining('<script>'),
          reasonToJoin: expect.not.stringContaining('<img'),
        }),
        userId: undefined,
      });
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionData = {
        ...validApplicationData,
        fullName: "'; DROP TABLE agent_applications; --",
      };

      mockAgentApplicationService.createApplication.mockResolvedValue(
        mockApplication
      );

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: sqlInjectionData,
        },
      });

      const response = await POST(req as any);

      expect(response.status).toBe(201);
      // Service should handle this safely
      expect(mockAgentApplicationService.createApplication).toHaveBeenCalled();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large form data efficiently', async () => {
      const largeData = {
        ...validApplicationData,
        reasonToJoin: 'A'.repeat(1000), // Maximum allowed length
        expectations: 'B'.repeat(1000),
      };

      mockAgentApplicationService.createApplication.mockResolvedValue(
        mockApplication
      );

      const { req } = createMocks({
        method: 'POST',
        body: {
          formData: largeData,
        },
      });

      const start = Date.now();
      const response = await POST(req as any);
      const duration = Date.now() - start;

      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent requests', async () => {
      mockAgentApplicationService.createApplication.mockResolvedValue(
        mockApplication
      );

      const requests = Array(10)
        .fill(null)
        .map(() => {
          const { req } = createMocks({
            method: 'POST',
            body: {
              formData: {
                ...validApplicationData,
                email: `test${Math.random()}@example.com`, // Unique emails
              },
            },
          });
          return POST(req as any);
        });

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });
  });
});
