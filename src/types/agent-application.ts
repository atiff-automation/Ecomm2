/**
 * Agent Application Type Definitions
 * Centralized type definitions for the agent application system
 * Following CLAUDE.md principles: Single source of truth for types
 */

import { AgentApplication, AgentApplicationReview, User, AgentApplicationStatus, ApplicationDecision } from '@prisma/client';

// Local type definition for SocialMediaLevel to avoid Prisma client-side issues
export type SocialMediaLevel = 'TIDAK_MAHIR' | 'MAHIR' | 'SANGAT_MAHIR';

// Core application types
export interface AgentApplicationWithRelations extends AgentApplication {
  user?: User | null;
  reviews: AgentApplicationReview[];
}

export interface AgentApplicationReviewWithUser extends AgentApplicationReview {
  reviewer: User;
  application: AgentApplication;
}

// Form data interfaces
export interface AgentApplicationFormData {
  // Step 1: Terms
  acceptTerms: boolean;

  // Step 2: Basic Information
  fullName: string;
  icNumber: string;
  phoneNumber: string;
  address: string;
  email: string;
  age: number;
  hasBusinessExp: boolean;
  businessLocation?: string;
  hasTeamLeadExp: boolean;
  isRegistered: boolean;
  jenis: BusinessType;

  // Step 3: Social Media
  instagramHandle?: string;
  facebookHandle?: string;
  tiktokHandle?: string;
  instagramLevel: SocialMediaLevel;
  facebookLevel: SocialMediaLevel;
  tiktokLevel: SocialMediaLevel;

  // Step 4: Additional Information
  hasJrmExp: boolean;
  jrmProducts?: string;
  reasonToJoin: string;
  expectations: string;

  // Step 5: Review
  finalAgreement: boolean;
}

// Step-specific data interfaces
export interface TermsStepData {
  acceptTerms: boolean;
}

export interface BasicInfoStepData {
  fullName: string;
  icNumber: string;
  phoneNumber: string;
  address: string;
  email: string;
  age: number;
  hasBusinessExp: boolean;
  businessLocation?: string;
  hasTeamLeadExp: boolean;
  isRegistered: boolean;
  jenis: BusinessType;
}

export interface SocialMediaStepData {
  instagramHandle?: string;
  facebookHandle?: string;
  tiktokHandle?: string;
  instagramLevel: SocialMediaLevel;
  facebookLevel: SocialMediaLevel;
  tiktokLevel: SocialMediaLevel;
}

export interface AdditionalInfoStepData {
  hasJrmExp: boolean;
  jrmProducts?: string;
  reasonToJoin: string;
  expectations: string;
}

export interface ReviewStepData {
  finalAgreement: boolean;
}

// API request/response interfaces
export interface CreateApplicationRequest {
  formData: AgentApplicationFormData;
  userId?: string;
}

export interface CreateApplicationResponse {
  id: string;
  status: AgentApplicationStatus;
  submittedAt: Date;
  message: string;
}

export interface UpdateApplicationStatusRequest {
  status: AgentApplicationStatus;
  adminNotes?: string;
  reviewerDecision?: ApplicationDecision;
}

export interface ApplicationListResponse {
  applications: AgentApplicationWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: ApplicationFilters;
}

export interface ApplicationFilters {
  status?: AgentApplicationStatus;
  search?: string;
  hasJrmExp?: boolean;
  socialMediaLevel?: SocialMediaLevel;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

// Email template data interfaces
export interface AgentApplicationEmailData {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  submissionDate: Date;
  status: AgentApplicationStatus;
  adminNotes?: string;
}

export interface ConfirmationEmailData extends AgentApplicationEmailData {
  trackingUrl: string;
}

export interface StatusUpdateEmailData extends AgentApplicationEmailData {
  previousStatus: AgentApplicationStatus;
  newStatus: AgentApplicationStatus;
  reviewerName: string;
  reviewDate: Date;
}

export interface AdminNotificationEmailData extends AgentApplicationEmailData {
  adminDashboardUrl: string;
  applicationSummary: {
    fullName: string;
    email: string;
    phoneNumber: string;
    hasBusinessExp: boolean;
    hasJrmExp: boolean;
  };
}

// Form state management interfaces
export interface FormState {
  currentStep: number;
  completedSteps: Set<number>;
  formData: Partial<AgentApplicationFormData>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDraft: boolean;
}

export interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  onStepChange: (step: number) => void;
  isStepValid: (step: number) => boolean;
}

// Admin dashboard interfaces
export interface ApplicationStats {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  thisMonth: number;
  lastMonth: number;
  growth: number;
}

export interface AdminDashboardData {
  stats: ApplicationStats;
  recentApplications: AgentApplicationWithRelations[];
  pendingReviews: AgentApplicationWithRelations[];
}

// Component prop interfaces
export interface AgentApplicationFormProps {
  initialData?: Partial<AgentApplicationFormData>;
  onSubmit: (data: AgentApplicationFormData) => Promise<void>;
  onSaveDraft?: (data: Partial<AgentApplicationFormData>) => Promise<void>;
  isSubmitting?: boolean;
  userId?: string;
}

export interface FormStepProps {
  data: Partial<AgentApplicationFormData>;
  errors: Record<string, string>;
  onChange: (data: Partial<AgentApplicationFormData>) => void;
  onNext: () => void;
  onPrevious?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isSubmitting?: boolean;
}

export interface AdminApplicationCardProps {
  application: AgentApplicationWithRelations;
  onStatusUpdate: (id: string, status: AgentApplicationStatus, notes?: string) => Promise<void>;
  onView: (id: string) => void;
}

// Business logic enums and constants
export enum BusinessType {
  KEDAI = 'KEDAI',
  MUDAH = 'MUDAH',
  TIDAK_BERKAITAN = 'TIDAK_BERKAITAN',
  LAIN_LAIN = 'LAIN_LAIN'
}

export const APPLICATION_STATUS_LABELS: Record<AgentApplicationStatus, string> = {
  DRAFT: 'Draf',
  SUBMITTED: 'Dihantar',
  UNDER_REVIEW: 'Dalam Semakan',
  APPROVED: 'Diluluskan',
  REJECTED: 'Ditolak'
};

export const SOCIAL_MEDIA_LEVEL_LABELS: Record<SocialMediaLevel, string> = {
  TIDAK_MAHIR: 'Tidak mahir',
  MAHIR: 'Mahir',
  SANGAT_MAHIR: 'Sangat mahir'
};

export const APPLICATION_DECISION_LABELS: Record<ApplicationDecision, string> = {
  APPROVED: 'Diluluskan',
  REJECTED: 'Ditolak',
  NEEDS_MORE_INFO: 'Memerlukan Maklumat Tambahan'
};

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  KEDAI: 'Kedai',
  MUDAH: 'Mudah',
  TIDAK_BERKAITAN: 'Tidak berkaitan',
  LAIN_LAIN: 'Lain-lain'
};

// Utility type guards
export const isValidAgentApplication = (data: any): data is AgentApplicationFormData => {
  return (
    typeof data === 'object' &&
    typeof data.acceptTerms === 'boolean' &&
    typeof data.fullName === 'string' &&
    typeof data.icNumber === 'string' &&
    typeof data.phoneNumber === 'string' &&
    typeof data.address === 'string' &&
    typeof data.email === 'string' &&
    typeof data.age === 'number' &&
    typeof data.hasBusinessExp === 'boolean' &&
    typeof data.hasTeamLeadExp === 'boolean' &&
    typeof data.isRegistered === 'boolean' &&
    typeof data.hasJrmExp === 'boolean' &&
    typeof data.reasonToJoin === 'string' &&
    typeof data.expectations === 'string' &&
    typeof data.finalAgreement === 'boolean'
  );
};

export const isCompletedApplication = (data: Partial<AgentApplicationFormData>): data is AgentApplicationFormData => {
  return isValidAgentApplication(data) && data.finalAgreement === true;
};