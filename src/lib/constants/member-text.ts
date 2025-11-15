/**
 * Member Panel Text Content - Malaysian E-commerce Platform
 * Single source of truth for all member-facing text content
 * Following @CLAUDE.md principles - centralized content, no hardcoding
 */

/**
 * Member profile page content
 */
export const MEMBER_PAGE_TEXT = {
  /** Profile page header */
  PROFILE: {
    /** Page title */
    TITLE: 'Member Profile',
    /** Page description */
    DESCRIPTION: 'Manage your account settings and view member benefits',
    /** Welcome message function */
    WELCOME: (firstName: string) => `Welcome back, ${firstName}!`,
  },

  /** Section titles and descriptions */
  SECTIONS: {
    /** Profile information section */
    PROFILE_INFO: {
      TITLE: 'Profile Information',
      DESCRIPTION: 'Update your personal information',
    },
    /** Security settings section */
    SECURITY: {
      TITLE: 'Security Settings',
      DESCRIPTION: 'Manage your password and security preferences',
    },
    /** Member benefits section */
    BENEFITS: {
      TITLE: 'Your Member Benefits',
      DESCRIPTION: 'Exclusive perks and savings for premium members',
    },
    /** Member summary section */
    SUMMARY: {
      TITLE: 'Member Summary',
      DESCRIPTION: 'Your membership overview and statistics',
    },
  },

  /** Form field labels */
  FIELDS: {
    FIRST_NAME: 'First Name',
    LAST_NAME: 'Last Name',
    EMAIL: 'Email Address',
    PHONE: 'Phone Number',
    DATE_OF_BIRTH: 'Date of Birth',
    MEMBER_STATUS: 'Member Status',
    MEMBER_ID: 'Member ID',
  },

  /** Placeholders */
  PLACEHOLDERS: {
    PHONE: '+60 12-345-6789',
  },

  /** Member stats labels */
  STATS: {
    TOTAL_SAVINGS: 'Total Savings',
    TOTAL_ORDERS: 'Total Orders',
    TOTAL_SPENT: 'Total Spent',
    AVG_ORDER: 'Avg Order',
    FAVORITE_CATEGORY: 'Favorite Category',
  },

  /** Member status badges */
  STATUS: {
    MEMBER: 'Member',
    REGULAR: 'Regular',
    MEMBER_SINCE: (date: string) => `Member since ${date}`,
    ACTIVE_SINCE: (date: string) => `Active since ${date}`,
    NRIC_LABEL: 'NRIC Number',
  },

  /** Buttons and actions */
  ACTIONS: {
    EDIT_PROFILE: 'Edit Profile',
    SAVE_CHANGES: 'Save Changes',
    CANCEL: 'Cancel',
    SAVING: 'Saving...',
  },

  /** Password change section */
  PASSWORD: {
    SECTION_TITLE: 'Change Password',
    SECTION_DESCRIPTION: 'Update your account password securely',
  },

  /** Member benefits content */
  BENEFITS_CONTENT: {
    EXCLUSIVE_PRICING: {
      TITLE: 'Member Pricing',
      DESCRIPTION: 'Save up to 15% on all products',
    },
    PRIORITY_SUPPORT: {
      TITLE: 'Priority Support',
      DESCRIPTION: 'Dedicated support and faster response times',
    },
    EARLY_ACCESS: {
      TITLE: 'Early Access',
      DESCRIPTION: 'First access to sales and new products',
    },
  },

  /** Member savings summary */
  SAVINGS_SUMMARY: {
    TITLE: 'Member Savings Summary',
    TOTAL_SAVINGS_LABEL: 'Total Savings as a Member',
  },
} as const;

/**
 * Error and success messages
 */
export const MEMBER_MESSAGES = {
  SUCCESS: {
    PROFILE_UPDATED: 'Profile updated successfully!',
    PASSWORD_CHANGED: 'Password changed successfully!',
  },
  ERROR: {
    PROFILE_UPDATE_FAILED: 'Failed to update profile. Please try again.',
    GENERIC_ERROR: 'An error occurred. Please try again.',
  },
} as const;
