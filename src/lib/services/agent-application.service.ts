/**
 * Agent Application Service Layer
 * Centralized business logic for agent application operations
 * Following CLAUDE.md principles: Single source of truth, systematic implementation
 */

import { AgentApplicationStatus, ApplicationDecision, User } from '@prisma/client';
import {
  AgentApplicationFormData,
  AgentApplicationWithRelations,
  ApplicationFilters,
  CreateApplicationRequest,
  CreateApplicationResponse,
  UpdateApplicationStatusRequest,
  ApplicationListResponse
} from '@/types/agent-application';
import { agentApplicationSchema, applicationFiltersSchema } from '@/lib/validation/agent-application';
import { emailService } from '@/lib/email/email-service';
import { sanitizeString } from '@/lib/security/input-validation';
import { prisma } from '@/lib/prisma';

export class AgentApplicationService {
  /**
   * Sanitize string fields in form data
   */
  private static sanitizeFormData(formData: AgentApplicationFormData): AgentApplicationFormData {
    return {
      ...formData,
      fullName: sanitizeString(formData.fullName),
      address: sanitizeString(formData.address),
      businessLocation: formData.businessLocation ? sanitizeString(formData.businessLocation) : undefined,
      instagramHandle: formData.instagramHandle ? sanitizeString(formData.instagramHandle) : undefined,
      facebookHandle: formData.facebookHandle ? sanitizeString(formData.facebookHandle) : undefined,
      tiktokHandle: formData.tiktokHandle ? sanitizeString(formData.tiktokHandle) : undefined,
      jrmProducts: formData.jrmProducts ? sanitizeString(formData.jrmProducts) : undefined,
      reasonToJoin: sanitizeString(formData.reasonToJoin),
      expectations: sanitizeString(formData.expectations),
    };
  }

  /**
   * Create a new agent application
   */
  static async createApplication(data: CreateApplicationRequest): Promise<CreateApplicationResponse> {
    try {
      // Sanitize input data
      const sanitizedFormData = this.sanitizeFormData(data.formData);

      // Validate form data
      const validatedData = agentApplicationSchema.parse(sanitizedFormData);

      // Check if user already has a pending application
      if (data.userId) {
        const existingApplication = await prisma.agentApplication.findFirst({
          where: {
            userId: data.userId,
            status: {
              in: [AgentApplicationStatus.DRAFT, AgentApplicationStatus.SUBMITTED, AgentApplicationStatus.UNDER_REVIEW]
            }
          }
        });

        if (existingApplication) {
          throw new Error('Anda sudah mempunyai permohonan yang sedang diproses');
        }
      }

      // Check for duplicate email
      const existingEmail = await prisma.agentApplication.findFirst({
        where: {
          email: validatedData.email,
          status: {
            in: [AgentApplicationStatus.SUBMITTED, AgentApplicationStatus.UNDER_REVIEW, AgentApplicationStatus.APPROVED]
          }
        }
      });

      if (existingEmail) {
        throw new Error('Email ini telah digunakan untuk permohonan lain');
      }

      // Create the application
      const application = await prisma.agentApplication.create({
        data: {
          userId: data.userId || null,
          email: validatedData.email,
          status: AgentApplicationStatus.SUBMITTED,

          // Terms
          acceptTerms: validatedData.acceptTerms,

          // Basic Information
          fullName: validatedData.fullName,
          icNumber: validatedData.icNumber,
          phoneNumber: validatedData.phoneNumber,
          address: validatedData.address,
          age: validatedData.age,

          // Business Experience
          hasBusinessExp: validatedData.hasBusinessExp,
          businessLocation: validatedData.businessLocation || null,
          hasTeamLeadExp: validatedData.hasTeamLeadExp,
          isRegistered: validatedData.isRegistered,
          jenis: validatedData.jenis,

          // Social Media
          instagramHandle: validatedData.instagramHandle || null,
          facebookHandle: validatedData.facebookHandle || null,
          tiktokHandle: validatedData.tiktokHandle || null,
          instagramLevel: validatedData.instagramLevel,
          facebookLevel: validatedData.facebookLevel,
          tiktokLevel: validatedData.tiktokLevel,

          // Additional Information
          hasJrmExp: validatedData.hasJrmExp,
          jrmProducts: validatedData.jrmProducts || null,
          reasonToJoin: validatedData.reasonToJoin,
          expectations: validatedData.expectations,

          // System fields
          submittedAt: new Date()
        }
      });

      // Send confirmation email
      await this.sendConfirmationEmail(application);

      // Notify admins
      await this.notifyAdminsOfNewApplication(application);

      return {
        id: application.id,
        status: application.status,
        submittedAt: application.submittedAt!,
        message: 'Permohonan anda telah berjaya dihantar. Kami akan menghubungi anda tidak lama lagi.'
      };

    } catch (error) {
      console.error('Error creating agent application:', error);
      throw new Error(error instanceof Error ? error.message : 'Ralat sistem berlaku');
    }
  }

  /**
   * Update an existing application (for drafts)
   */
  static async updateApplication(
    id: string,
    data: Partial<AgentApplicationFormData>,
    userId?: string
  ): Promise<AgentApplicationWithRelations> {
    try {
      // Verify ownership
      const existingApplication = await prisma.agentApplication.findUnique({
        where: { id },
        include: { user: true, reviews: true }
      });

      if (!existingApplication) {
        throw new Error('Permohonan tidak dijumpai');
      }

      if (existingApplication.userId !== userId && userId) {
        throw new Error('Anda tidak mempunyai kebenaran untuk mengubah permohonan ini');
      }

      if (existingApplication.status !== AgentApplicationStatus.DRAFT) {
        throw new Error('Permohonan yang telah dihantar tidak boleh diubah');
      }

      // Sanitize update data
      const sanitizedData = data as Partial<AgentApplicationFormData>;
      if (data.fullName) sanitizedData.fullName = sanitizeString(data.fullName);
      if (data.address) sanitizedData.address = sanitizeString(data.address);
      if (data.businessLocation) sanitizedData.businessLocation = sanitizeString(data.businessLocation);
      if (data.instagramHandle) sanitizedData.instagramHandle = sanitizeString(data.instagramHandle);
      if (data.facebookHandle) sanitizedData.facebookHandle = sanitizeString(data.facebookHandle);
      if (data.tiktokHandle) sanitizedData.tiktokHandle = sanitizeString(data.tiktokHandle);
      if (data.jrmProducts) sanitizedData.jrmProducts = sanitizeString(data.jrmProducts);
      if (data.reasonToJoin) sanitizedData.reasonToJoin = sanitizeString(data.reasonToJoin);
      if (data.expectations) sanitizedData.expectations = sanitizeString(data.expectations);

      // Update the application
      const updatedApplication = await prisma.agentApplication.update({
        where: { id },
        data: {
          email: sanitizedData.email || existingApplication.email,
          fullName: sanitizedData.fullName || existingApplication.fullName,
          icNumber: data.icNumber || existingApplication.icNumber,
          phoneNumber: data.phoneNumber || existingApplication.phoneNumber,
          address: sanitizedData.address || existingApplication.address,
          age: data.age || existingApplication.age,
          hasBusinessExp: data.hasBusinessExp ?? existingApplication.hasBusinessExp,
          businessLocation: data.businessLocation ?? existingApplication.businessLocation,
          hasTeamLeadExp: data.hasTeamLeadExp ?? existingApplication.hasTeamLeadExp,
          isRegistered: data.isRegistered ?? existingApplication.isRegistered,
          instagramHandle: data.instagramHandle ?? existingApplication.instagramHandle,
          facebookHandle: data.facebookHandle ?? existingApplication.facebookHandle,
          tiktokHandle: data.tiktokHandle ?? existingApplication.tiktokHandle,
          instagramLevel: data.instagramLevel || existingApplication.instagramLevel,
          facebookLevel: data.facebookLevel || existingApplication.facebookLevel,
          tiktokLevel: data.tiktokLevel || existingApplication.tiktokLevel,
          hasJrmExp: data.hasJrmExp ?? existingApplication.hasJrmExp,
          jrmProducts: data.jrmProducts ?? existingApplication.jrmProducts,
          reasonToJoin: data.reasonToJoin || existingApplication.reasonToJoin,
          expectations: data.expectations || existingApplication.expectations,
          acceptTerms: data.acceptTerms ?? existingApplication.acceptTerms,

          // Update status if complete
          status: data.finalAgreement ? AgentApplicationStatus.SUBMITTED : AgentApplicationStatus.DRAFT,
          submittedAt: data.finalAgreement ? new Date() : null
        },
        include: {
          user: true,
          reviews: {
            include: { reviewer: true }
          }
        }
      });

      // Send emails if submitted
      if (data.finalAgreement) {
        await this.sendConfirmationEmail(updatedApplication);
        await this.notifyAdminsOfNewApplication(updatedApplication);
      }

      return updatedApplication;

    } catch (error) {
      console.error('Error updating agent application:', error);
      throw new Error(error instanceof Error ? error.message : 'Ralat sistem berlaku');
    }
  }

  /**
   * Get applications with filtering and pagination (Admin)
   */
  static async getApplications(filters: ApplicationFilters): Promise<ApplicationListResponse> {
    try {
      const validatedFilters = applicationFiltersSchema.parse(filters);

      const where: any = {};

      // Apply filters
      if (validatedFilters.status) {
        where.status = validatedFilters.status;
      }

      if (validatedFilters.search) {
        where.OR = [
          { fullName: { contains: validatedFilters.search, mode: 'insensitive' } },
          { email: { contains: validatedFilters.search, mode: 'insensitive' } },
          { icNumber: { contains: validatedFilters.search, mode: 'insensitive' } },
          { phoneNumber: { contains: validatedFilters.search, mode: 'insensitive' } }
        ];
      }

      if (validatedFilters.hasJrmExp !== undefined) {
        where.hasJrmExp = validatedFilters.hasJrmExp;
      }

      if (validatedFilters.dateFrom || validatedFilters.dateTo) {
        where.submittedAt = {};
        if (validatedFilters.dateFrom) {
          where.submittedAt.gte = new Date(validatedFilters.dateFrom);
        }
        if (validatedFilters.dateTo) {
          where.submittedAt.lte = new Date(validatedFilters.dateTo);
        }
      }

      // Get total count
      const total = await prisma.agentApplication.count({ where });

      // Get applications with pagination
      const applications = await prisma.agentApplication.findMany({
        where,
        include: {
          user: true,
          reviews: {
            include: { reviewer: true },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip: (validatedFilters.page - 1) * validatedFilters.limit,
        take: validatedFilters.limit
      });

      const totalPages = Math.ceil(total / validatedFilters.limit);

      return {
        applications,
        pagination: {
          page: validatedFilters.page,
          limit: validatedFilters.limit,
          total,
          totalPages
        },
        filters: validatedFilters
      };

    } catch (error) {
      console.error('Error getting applications:', error);
      throw new Error('Ralat mengambil senarai permohonan');
    }
  }

  /**
   * Get application by ID
   */
  static async getApplicationById(id: string): Promise<AgentApplicationWithRelations | null> {
    try {
      const application = await prisma.agentApplication.findUnique({
        where: { id },
        include: {
          user: true,
          reviews: {
            include: { reviewer: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return application;

    } catch (error) {
      console.error('Error getting application by ID:', error);
      throw new Error('Ralat mengambil maklumat permohonan');
    }
  }

  /**
   * Update application status (Admin)
   */
  static async updateApplicationStatus(
    id: string,
    statusData: UpdateApplicationStatusRequest,
    adminId: string
  ): Promise<void> {
    try {
      const application = await prisma.agentApplication.findUnique({
        where: { id },
        include: { user: true, reviews: true }
      });

      if (!application) {
        throw new Error('Permohonan tidak dijumpai');
      }

      // Update application status
      const updatedApplication = await prisma.agentApplication.update({
        where: { id },
        data: {
          status: statusData.status,
          reviewedAt: new Date(),
          reviewedBy: adminId,
          adminNotes: statusData.adminNotes || null
        }
      });

      // Create review record
      if (statusData.reviewerDecision) {
        await prisma.agentApplicationReview.create({
          data: {
            applicationId: id,
            reviewerId: adminId,
            decision: statusData.reviewerDecision,
            notes: statusData.adminNotes || null
          }
        });
      }

      // Send status update email
      await this.sendStatusUpdateEmail(updatedApplication);

    } catch (error) {
      console.error('Error updating application status:', error);
      throw new Error('Ralat mengubah status permohonan');
    }
  }

  /**
   * Send confirmation email to applicant
   */
  private static async sendConfirmationEmail(application: any): Promise<void> {
    try {
      await emailService.sendAgentApplicationConfirmation({
        applicationId: application.id,
        applicantName: application.fullName,
        applicantEmail: application.email,
        submissionDate: application.submittedAt || new Date()
      });

    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Don't throw error as this shouldn't block application creation
    }
  }

  /**
   * Send status update email to applicant
   */
  private static async sendStatusUpdateEmail(application: any): Promise<void> {
    try {
      await emailService.sendAgentApplicationStatusUpdate({
        applicationId: application.id,
        applicantName: application.fullName,
        applicantEmail: application.email,
        status: application.status,
        adminNotes: application.adminNotes,
        reviewDate: application.reviewedAt || new Date()
      });

    } catch (error) {
      console.error('Error sending status update email:', error);
    }
  }

  /**
   * Notify admins of new application
   */
  private static async notifyAdminsOfNewApplication(application: any): Promise<void> {
    try {
      // Get admin emails from database
      const adminUsers = await prisma.user.findMany({
        where: {
          role: {
            in: ['ADMIN', 'SUPERADMIN']
          },
          status: 'ACTIVE'
        },
        select: {
          email: true
        }
      });

      const adminEmails = adminUsers.map(admin => admin.email);

      if (adminEmails.length > 0) {
        await emailService.notifyAdminsOfNewAgentApplication({
          applicationId: application.id,
          applicantName: application.fullName,
          applicantEmail: application.email,
          submissionDate: application.submittedAt || new Date(),
          adminEmails
        });
      }

    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }

  /**
   * Get application statistics for admin dashboard
   */
  static async getApplicationStats(): Promise<any> {
    try {
      const [
        total,
        draft,
        submitted,
        underReview,
        approved,
        rejected,
        thisMonth,
        lastMonth
      ] = await Promise.all([
        prisma.agentApplication.count(),
        prisma.agentApplication.count({ where: { status: AgentApplicationStatus.DRAFT } }),
        prisma.agentApplication.count({ where: { status: AgentApplicationStatus.SUBMITTED } }),
        prisma.agentApplication.count({ where: { status: AgentApplicationStatus.UNDER_REVIEW } }),
        prisma.agentApplication.count({ where: { status: AgentApplicationStatus.APPROVED } }),
        prisma.agentApplication.count({ where: { status: AgentApplicationStatus.REJECTED } }),
        prisma.agentApplication.count({
          where: {
            submittedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        prisma.agentApplication.count({
          where: {
            submittedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
              lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ]);

      const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

      return {
        total,
        draft,
        submitted,
        underReview,
        approved,
        rejected,
        thisMonth,
        lastMonth,
        growth: Math.round(growth * 100) / 100
      };

    } catch (error) {
      console.error('Error getting application stats:', error);
      throw new Error('Ralat mengambil statistik permohonan');
    }
  }
}