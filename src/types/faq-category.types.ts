/**
 * FAQ Category Type Definitions
 */

import { FAQCategory } from '@prisma/client';

export type { FAQCategory };

export interface FAQCategoryPublic {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface FAQCategoryFormData {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface FAQCategoryWithFAQCount extends FAQCategory {
  _count: {
    faqs: number;
  };
}
