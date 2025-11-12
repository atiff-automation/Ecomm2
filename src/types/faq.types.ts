/**
 * FAQ Type Definitions
 * Centralized TypeScript types for FAQ feature
 */

import { FAQ as PrismaFAQ, FAQCategory as PrismaFAQCategory, FAQStatus } from '@prisma/client';

// Base FAQ type from Prisma
export type FAQ = PrismaFAQ;

// FAQ Category type
export type FAQCategory = PrismaFAQCategory;

// FAQ with relations
export interface FAQWithRelations extends FAQ {
  category?: {
    id: string;
    name: string;
  };
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  updatedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

// FAQ for display (public)
export interface FAQPublic {
  id: string;
  question: string;
  answer: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  sortOrder: number;
}

// FAQ create input
export interface FAQCreateInput {
  question: string;
  answer: string;
  categoryId: string;
  sortOrder?: number;
  status?: FAQStatus;
}

// FAQ update input
export interface FAQUpdateInput {
  question?: string;
  answer?: string;
  categoryId?: string;
  sortOrder?: number;
  status?: FAQStatus;
}

// FAQ filter options
export interface FAQFilter {
  categoryId?: string | 'ALL';
  status?: FAQStatus | 'ALL';
  search?: string;
}

// FAQ reorder input
export interface FAQReorderInput {
  id: string;
  sortOrder: number;
}

// API Response types
export interface FAQListResponse {
  faqs: FAQWithRelations[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface FAQResponse {
  faq: FAQWithRelations;
}

export interface FAQPublicListResponse {
  faqs: FAQPublic[];
}

// Form types for admin
export interface FAQFormData {
  question: string;
  answer: string;
  categoryId: string;
  sortOrder: number;
  status: FAQStatus;
}
