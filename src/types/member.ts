/**
 * Member Types and Interfaces - Malaysian E-commerce Platform
 * Type definitions for member profile and related data
 * Following @CLAUDE.md principles - explicit types, no 'any'
 */

import { LucideIcon } from 'lucide-react';

/**
 * Member statistics data from API
 */
export interface MemberStats {
  /** Total savings as a member (MYR) */
  totalSavings: number;
  /** Total number of orders placed */
  totalOrders: number;
  /** Date when user became a member (ISO 8601 format) */
  memberSince: string;
  /** Total amount spent (MYR) */
  totalSpent: number;
  /** Average order value (MYR) */
  averageOrderValue: number;
  /** User's most frequently purchased category */
  favoriteCategory: string | null;
}

/**
 * User profile data
 */
export interface UserProfile {
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's email address */
  email: string;
  /** User's phone number (optional) */
  phone: string | null;
  /** User's date of birth in ISO format (optional) */
  dateOfBirth: string | null;
  /** User's NRIC (National Registration Identity Card) - serves as Member ID */
  nric: string | null;
}

/**
 * Page header component props
 */
export interface PageHeaderProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Header title */
  title: string;
  /** Header description/subtitle */
  description: string;
  /** Optional badge configuration */
  badge?: {
    /** Badge text */
    text: string;
    /** Badge variant: member (qualified), regular (not qualified), or custom */
    variant: 'member' | 'regular' | 'custom';
    /** Custom className for badge (only used when variant is 'custom') */
    className?: string;
  };
  /** Additional info text (e.g., "Member since...") */
  additionalInfo?: string;
}

/**
 * Section card component props
 */
export interface SectionCardProps {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Card title */
  title: string;
  /** Optional card description */
  description?: string;
  /** Card content */
  children: React.ReactNode;
  /** Whether this card should be collapsible (using accordion) */
  collapsible?: boolean;
  /** Default open state for collapsible cards */
  defaultOpen?: boolean;
  /** Optional header action (e.g., Edit button) */
  headerAction?: React.ReactNode;
  /** Custom className for the card */
  className?: string;
}

/**
 * Individual stat item for stats summary
 */
export interface StatItem {
  /** Label for the stat */
  label: string;
  /** Value to display (can be number or formatted string) */
  value: string | number;
  /** Optional icon for the stat */
  icon?: LucideIcon;
  /** Optional custom color class for the value */
  valueColor?: string;
}

/**
 * Stats summary card component props
 * Note: This component is only shown for members (isMember = true)
 */
export interface StatsSummaryCardProps {
  /** Array of stat items to display */
  stats: StatItem[];
  /** Optional custom title */
  title?: string;
}

/**
 * Security section item (for accordion items)
 */
export interface SecuritySectionItem {
  /** Unique identifier for the accordion item */
  id: string;
  /** Icon component */
  icon: LucideIcon;
  /** Item title */
  title: string;
  /** Item description */
  description: string;
  /** Item content (form or other component) */
  content: React.ReactNode;
}

/**
 * Security section component props
 */
export interface SecuritySectionProps {
  /** Array of security items to display in accordion */
  items: SecuritySectionItem[];
  /** Default open item ID (optional) */
  defaultOpenItem?: string;
}

/**
 * Member benefit item
 */
export interface BenefitItem {
  /** Benefit icon */
  icon: LucideIcon;
  /** Benefit title */
  title: string;
  /** Benefit description */
  description: string;
  /** Background color class */
  backgroundColor: string;
  /** Text color class */
  textColor: string;
  /** Description text color class */
  descriptionColor: string;
}

/**
 * Member benefits card component props
 */
export interface MemberBenefitsCardProps {
  /** Array of benefits to display */
  benefits: BenefitItem[];
  /** Optional member stats for savings summary */
  memberStats?: MemberStats | null;
  /** Format price function */
  formatPrice: (amount: number) => string;
}

/**
 * Badge variant type
 */
export type BadgeVariant = 'member' | 'regular' | 'custom';

/**
 * Member status type
 */
export type MemberStatus = 'member' | 'regular';
