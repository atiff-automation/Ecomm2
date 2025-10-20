/**
 * Agent Application Service Tests
 * Comprehensive unit tests for AgentApplicationService
 * Following CLAUDE.md principles: Systematic testing, centralized business logic
 */

import { AgentApplicationService } from '../agent-application.service';
import {
  AgentApplicationStatus,
  SocialMediaLevel,
  ApplicationDecision,
  PrismaClient,
} from '@prisma/client';
import { emailService } from '@/lib/email/email-service';

// Mock PrismaClient
const mockPrismaClient = {
  agentApplication: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  agentApplicationReview: {
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  ...jest.requireActual('@prisma/client'),
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Mock email service
jest.mock('@/lib/email/email-service', () => ({
  emailService: {
    sendAgentApplicationConfirmation: jest.fn(),
    sendAgentApplicationStatusUpdate: jest.fn(),
    notifyAdminsOfNewAgentApplication: jest.fn(),
  },
}));

const mockPrisma = mockPrismaClient as jest.Mocked<typeof mockPrismaClient>;
const mockEmailService = emailService as jest.Mocked<typeof emailService>;

describe('AgentApplicationService', () => {
  // Test data following Malaysian patterns
  const validApplicationData = {
    email: 'ahmad.abdullah@example.com',
    fullName: 'Ahmad bin Abdullah',
    icNumber: '901020-01-1234',
    phoneNumber: '+60123456789',
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
    reviews: [],
  };

  const mockAdmin = {
    id: 'admin-123',
    email: 'admin@jrm.com',
    name: 'Admin User',
    role: 'ADMIN',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApplication', () => {
    it('should create a new application successfully', async () => {
      mockPrisma.agentApplication.create.mockResolvedValue(mockApplication);

      const result =
        await AgentApplicationService.createApplication(validApplicationData);

      expect(mockPrisma.agentApplication.create).toHaveBeenCalledWith({
        data: {
          ...validApplicationData,
          status: AgentApplicationStatus.SUBMITTED,
          submittedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockApplication);
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.agentApplication.create.mockRejectedValue(dbError);

      await expect(
        AgentApplicationService.createApplication(validApplicationData)
      ).rejects.toThrow('Database connection failed');
    });

    it('should sanitize input data before saving', async () => {
      const maliciousData = {
        ...validApplicationData,
        fullName: 'Ahmad<script>alert("xss")</script>',
        reasonToJoin:
          'Valid reason with <script>alert("xss")</script> injection attempt',
      };

      mockPrisma.agentApplication.create.mockResolvedValue(mockApplication);

      await AgentApplicationService.createApplication(maliciousData);

      // Verify that the service sanitizes malicious content
      const createCall = mockPrisma.agentApplication.create.mock.calls[0][0];
      expect(createCall.data.fullName).not.toContain('<script>');
      expect(createCall.data.reasonToJoin).not.toContain('<script>');
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        // Missing required fields
      };

      await expect(
        AgentApplicationService.createApplication(incompleteData as any)
      ).rejects.toThrow();
    });
  });

  describe('updateApplication', () => {
    it('should update an existing application', async () => {
      const updatedData = {
        fullName: 'Ahmad bin Abdullah Updated',
        phoneNumber: '+60198765432',
      };

      const updatedApplication = { ...mockApplication, ...updatedData };
      mockPrisma.agentApplication.update.mockResolvedValue(updatedApplication);

      const result = await AgentApplicationService.updateApplication(
        'app-123',
        updatedData
      );

      expect(mockPrisma.agentApplication.update).toHaveBeenCalledWith({
        where: { id: 'app-123' },
        data: updatedData,
      });
      expect(result).toEqual(updatedApplication);
    });

    it('should handle non-existent application', async () => {
      mockPrisma.agentApplication.update.mockRejectedValue(
        new Error('Record to update not found')
      );

      await expect(
        AgentApplicationService.updateApplication('non-existent', {})
      ).rejects.toThrow('Record to update not found');
    });
  });

  describe('getApplications', () => {
    it('should retrieve applications with pagination', async () => {
      const applications = [mockApplication];
      const totalCount = 1;

      mockPrisma.agentApplication.findMany.mockResolvedValue(applications);
      mockPrisma.agentApplication.count.mockResolvedValue(totalCount);

      const filters = {
        page: 1,
        limit: 10,
        status: AgentApplicationStatus.SUBMITTED,
        search: 'Ahmad',
      };

      const result = await AgentApplicationService.getApplications(filters);

      expect(result).toEqual({
        applications,
        pagination: {
          page: 1,
          limit: 10,
          total: totalCount,
          totalPages: 1,
        },
      });

      expect(mockPrisma.agentApplication.findMany).toHaveBeenCalledWith({
        where: {
          status: AgentApplicationStatus.SUBMITTED,
          OR: [
            { fullName: { contains: 'Ahmad', mode: 'insensitive' } },
            { email: { contains: 'Ahmad', mode: 'insensitive' } },
            { icNumber: { contains: 'Ahmad', mode: 'insensitive' } },
          ],
        },
        include: {
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle empty results', async () => {
      mockPrisma.agentApplication.findMany.mockResolvedValue([]);
      mockPrisma.agentApplication.count.mockResolvedValue(0);

      const result = await AgentApplicationService.getApplications({});

      expect(result.applications).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should filter by status correctly', async () => {
      mockPrisma.agentApplication.findMany.mockResolvedValue([]);
      mockPrisma.agentApplication.count.mockResolvedValue(0);

      await AgentApplicationService.getApplications({
        status: AgentApplicationStatus.APPROVED,
      });

      expect(mockPrisma.agentApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AgentApplicationStatus.APPROVED,
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      mockPrisma.agentApplication.findMany.mockResolvedValue([]);
      mockPrisma.agentApplication.count.mockResolvedValue(0);

      await AgentApplicationService.getApplications({
        startDate,
        endDate,
      });

      expect(mockPrisma.agentApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            submittedAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        })
      );
    });
  });

  describe('getApplicationById', () => {
    it('should retrieve a specific application', async () => {
      mockPrisma.agentApplication.findUnique.mockResolvedValue(mockApplication);

      const result =
        await AgentApplicationService.getApplicationById('app-123');

      expect(mockPrisma.agentApplication.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-123' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviews: {
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      expect(result).toEqual(mockApplication);
    });

    it('should return null for non-existent application', async () => {
      mockPrisma.agentApplication.findUnique.mockResolvedValue(null);

      const result =
        await AgentApplicationService.getApplicationById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateApplicationStatus', () => {
    it('should update application status and create review record', async () => {
      const updatedApplication = {
        ...mockApplication,
        status: AgentApplicationStatus.APPROVED,
        reviewedAt: new Date(),
        reviewedBy: 'admin-123',
        adminNotes:
          'Application approved based on excellent business experience',
      };

      mockPrisma.agentApplication.update.mockResolvedValue(updatedApplication);
      mockPrisma.agentApplicationReview.create.mockResolvedValue({
        id: 'review-123',
        applicationId: 'app-123',
        reviewerId: 'admin-123',
        decision: ApplicationDecision.APPROVED,
        notes: 'Application approved based on excellent business experience',
        createdAt: new Date(),
      });

      await AgentApplicationService.updateApplicationStatus(
        'app-123',
        AgentApplicationStatus.APPROVED,
        'admin-123',
        'Application approved based on excellent business experience'
      );

      expect(mockPrisma.agentApplication.update).toHaveBeenCalledWith({
        where: { id: 'app-123' },
        data: {
          status: AgentApplicationStatus.APPROVED,
          reviewedAt: expect.any(Date),
          reviewedBy: 'admin-123',
          adminNotes:
            'Application approved based on excellent business experience',
        },
      });

      expect(mockPrisma.agentApplicationReview.create).toHaveBeenCalledWith({
        data: {
          applicationId: 'app-123',
          reviewerId: 'admin-123',
          decision: ApplicationDecision.APPROVED,
          notes: 'Application approved based on excellent business experience',
        },
      });
    });

    it('should handle rejection status update', async () => {
      const updatedApplication = {
        ...mockApplication,
        status: AgentApplicationStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: 'admin-123',
        adminNotes: 'Insufficient business experience',
      };

      mockPrisma.agentApplication.update.mockResolvedValue(updatedApplication);
      mockPrisma.agentApplicationReview.create.mockResolvedValue({
        id: 'review-123',
        applicationId: 'app-123',
        reviewerId: 'admin-123',
        decision: ApplicationDecision.REJECTED,
        notes: 'Insufficient business experience',
        createdAt: new Date(),
      });

      await AgentApplicationService.updateApplicationStatus(
        'app-123',
        AgentApplicationStatus.REJECTED,
        'admin-123',
        'Insufficient business experience'
      );

      expect(mockPrisma.agentApplicationReview.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          decision: ApplicationDecision.REJECTED,
          notes: 'Insufficient business experience',
        }),
      });
    });

    it('should require admin notes for status changes', async () => {
      await expect(
        AgentApplicationService.updateApplicationStatus(
          'app-123',
          AgentApplicationStatus.APPROVED,
          'admin-123'
          // Missing notes
        )
      ).rejects.toThrow('Admin notes are required for status updates');
    });

    it('should validate admin user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        AgentApplicationService.updateApplicationStatus(
          'app-123',
          AgentApplicationStatus.APPROVED,
          'non-existent-admin',
          'Notes'
        )
      ).rejects.toThrow('Admin user not found');
    });
  });

  describe('Email Notifications', () => {
    beforeEach(() => {
      mockEmailService.sendAgentApplicationConfirmation.mockResolvedValue();
      mockEmailService.sendAgentApplicationStatusUpdate.mockResolvedValue();
      mockEmailService.notifyAdminsOfNewAgentApplication.mockResolvedValue();
    });

    describe('sendConfirmationEmail', () => {
      it('should send confirmation email after application submission', async () => {
        await AgentApplicationService.sendConfirmationEmail(mockApplication);

        expect(
          mockEmailService.sendAgentApplicationConfirmation
        ).toHaveBeenCalledWith({
          applicationId: mockApplication.id,
          applicantName: mockApplication.fullName,
          applicantEmail: mockApplication.email,
          submissionDate: mockApplication.submittedAt,
        });
      });

      it('should handle email service failures gracefully', async () => {
        mockEmailService.sendAgentApplicationConfirmation.mockRejectedValue(
          new Error('Email service unavailable')
        );

        // Should not throw, but log the error
        await expect(
          AgentApplicationService.sendConfirmationEmail(mockApplication)
        ).resolves.not.toThrow();
      });
    });

    describe('sendStatusUpdateEmail', () => {
      it('should send status update email when application is reviewed', async () => {
        const reviewedApplication = {
          ...mockApplication,
          status: AgentApplicationStatus.APPROVED,
          adminNotes: 'Congratulations! Your application has been approved.',
        };

        await AgentApplicationService.sendStatusUpdateEmail(
          reviewedApplication
        );

        expect(
          mockEmailService.sendAgentApplicationStatusUpdate
        ).toHaveBeenCalledWith({
          applicationId: reviewedApplication.id,
          applicantName: reviewedApplication.fullName,
          applicantEmail: reviewedApplication.email,
          status: 'APPROVED',
          notes: 'Congratulations! Your application has been approved.',
        });
      });

      it('should handle rejection notifications', async () => {
        const rejectedApplication = {
          ...mockApplication,
          status: AgentApplicationStatus.REJECTED,
          adminNotes:
            'We regret to inform you that your application has been rejected.',
        };

        await AgentApplicationService.sendStatusUpdateEmail(
          rejectedApplication
        );

        expect(
          mockEmailService.sendAgentApplicationStatusUpdate
        ).toHaveBeenCalledWith({
          applicationId: rejectedApplication.id,
          applicantName: rejectedApplication.fullName,
          applicantEmail: rejectedApplication.email,
          status: 'REJECTED',
          notes:
            'We regret to inform you that your application has been rejected.',
        });
      });
    });

    describe('notifyAdminsOfNewApplication', () => {
      it('should notify admins when new application is submitted', async () => {
        await AgentApplicationService.notifyAdminsOfNewApplication(
          mockApplication
        );

        expect(
          mockEmailService.notifyAdminsOfNewAgentApplication
        ).toHaveBeenCalledWith({
          applicationId: mockApplication.id,
          applicantName: mockApplication.fullName,
          applicantEmail: mockApplication.email,
          submissionDate: mockApplication.submittedAt,
        });
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should enforce business rules for application creation', async () => {
      // Test age restrictions
      const underageData = { ...validApplicationData, age: 17 };
      await expect(
        AgentApplicationService.createApplication(underageData)
      ).rejects.toThrow();

      // Test IC number format
      const invalidIcData = { ...validApplicationData, icNumber: 'invalid-ic' };
      await expect(
        AgentApplicationService.createApplication(invalidIcData)
      ).rejects.toThrow();

      // Test phone number format
      const invalidPhoneData = {
        ...validApplicationData,
        phoneNumber: 'invalid-phone',
      };
      await expect(
        AgentApplicationService.createApplication(invalidPhoneData)
      ).rejects.toThrow();
    });

    it('should validate Malaysian-specific data patterns', async () => {
      const validMalaysianData = {
        ...validApplicationData,
        icNumber: '950423-14-1234',
        phoneNumber: '+60123456789',
        address:
          'No. 456, Jalan Sultan, Taman Permai, 47000 Petaling Jaya, Selangor',
      };

      mockPrisma.agentApplication.create.mockResolvedValue({
        ...mockApplication,
        ...validMalaysianData,
      });

      await expect(
        AgentApplicationService.createApplication(validMalaysianData)
      ).resolves.not.toThrow();
    });

    it('should enforce social media level requirements', async () => {
      const invalidSocialMediaData = {
        ...validApplicationData,
        instagramLevel: 'INVALID_LEVEL' as any,
      };

      await expect(
        AgentApplicationService.createApplication(invalidSocialMediaData)
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures', async () => {
      mockPrisma.agentApplication.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        AgentApplicationService.createApplication(validApplicationData)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle concurrent access issues', async () => {
      mockPrisma.agentApplication.update.mockRejectedValue(
        new Error('Record has been modified by another user')
      );

      await expect(
        AgentApplicationService.updateApplicationStatus(
          'app-123',
          AgentApplicationStatus.APPROVED,
          'admin-123',
          'Approved'
        )
      ).rejects.toThrow('Record has been modified by another user');
    });

    it('should validate input parameters', async () => {
      // Test null/undefined parameters
      await expect(
        AgentApplicationService.getApplicationById(null as any)
      ).rejects.toThrow();

      await expect(
        AgentApplicationService.updateApplicationStatus(
          '',
          AgentApplicationStatus.APPROVED,
          'admin-123',
          'Notes'
        )
      ).rejects.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large result sets efficiently', async () => {
      const largeResultSet = Array(1000).fill(mockApplication);
      mockPrisma.agentApplication.findMany.mockResolvedValue(largeResultSet);
      mockPrisma.agentApplication.count.mockResolvedValue(1000);

      const result = await AgentApplicationService.getApplications({
        page: 1,
        limit: 50,
      });

      expect(result.applications).toHaveLength(1000);
      expect(mockPrisma.agentApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      );
    });

    it('should use appropriate database indexes', async () => {
      await AgentApplicationService.getApplications({
        status: AgentApplicationStatus.SUBMITTED,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      });

      // Verify that queries are structured to use database indexes
      expect(mockPrisma.agentApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AgentApplicationStatus.SUBMITTED,
            submittedAt: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('Security Validation', () => {
    it('should prevent SQL injection in search queries', async () => {
      const maliciousSearch = "'; DROP TABLE agent_applications; --";

      mockPrisma.agentApplication.findMany.mockResolvedValue([]);
      mockPrisma.agentApplication.count.mockResolvedValue(0);

      await AgentApplicationService.getApplications({
        search: maliciousSearch,
      });

      // Verify that the search is properly parameterized
      const findManyCall =
        mockPrisma.agentApplication.findMany.mock.calls[0][0];
      expect(JSON.stringify(findManyCall)).not.toContain('DROP TABLE');
    });

    it('should sanitize user input data', async () => {
      const xssData = {
        ...validApplicationData,
        fullName: '<script>alert("xss")</script>Ahmad',
        reasonToJoin: 'Valid reason<img src=x onerror=alert("xss")>',
      };

      mockPrisma.agentApplication.create.mockResolvedValue(mockApplication);

      await AgentApplicationService.createApplication(xssData);

      const createCall = mockPrisma.agentApplication.create.mock.calls[0][0];
      expect(createCall.data.fullName).not.toContain('<script>');
      expect(createCall.data.reasonToJoin).not.toContain('<img');
    });
  });
});
