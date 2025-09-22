/**
 * Centralized Typography System for Chat Components
 * Following @CLAUDE.md DRY principles - Single source of truth
 */

// Modern font stack - Single source of truth
export const CHAT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Text", "Roboto", "Helvetica Neue", Arial, sans-serif';

// Base typography properties
const baseTypography = {
  fontFamily: CHAT_FONT_FAMILY,
  fontFeatureSettings: '"kern" 1',
  WebkitFontSmoothing: 'antialiased' as const,
  MozOsxFontSmoothing: 'grayscale' as const,
};

// Typography mixins - Centralized approach
export const typographyMixins = {
  // Base typography
  base: baseTypography,

  // Message content
  messageText: {
    ...baseTypography,
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '-0.008em',
  },

  // Input text
  inputText: {
    ...baseTypography,
    fontSize: '15px',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '-0.008em',
  },

  // Timestamp
  timestamp: {
    ...baseTypography,
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.015em',
  },

  // Header title
  headerTitle: {
    ...baseTypography,
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '-0.008em',
    lineHeight: 1.2,
  },

  // Header subtitle
  headerSubtitle: {
    ...baseTypography,
    fontSize: '13px',
    fontWeight: 400,
    letterSpacing: '-0.004em',
    lineHeight: 1,
  },

  // Status text
  statusText: {
    ...baseTypography,
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '-0.004em',
  },

  // Quick reply buttons
  quickReplyButton: {
    ...baseTypography,
    fontSize: '13px',
    fontWeight: 500,
    letterSpacing: '-0.004em',
    lineHeight: 1.2,
  },

  // Rich content titles
  richContentTitle: {
    ...baseTypography,
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '-0.008em',
    lineHeight: 1.4,
  },

  // Rich content subtitle
  richContentSubtitle: {
    ...baseTypography,
    fontSize: '14px',
    fontWeight: 500,
    letterSpacing: '-0.006em',
    lineHeight: 1.3,
  },

  // Rich content description
  richContentDescription: {
    ...baseTypography,
    fontSize: '13px',
    fontWeight: 400,
    letterSpacing: '-0.004em',
    lineHeight: 1.4,
  },

  // Error messages
  errorText: {
    ...baseTypography,
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '-0.004em',
    lineHeight: 1.4,
  },

  // Counter text
  counterText: {
    ...baseTypography,
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.01em',
  },

  // Attachment labels
  attachmentText: {
    ...baseTypography,
    fontSize: '12px',
    fontWeight: 400,
    letterSpacing: '-0.004em',
  },

  // Session info
  sessionInfo: {
    ...baseTypography,
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '-0.004em',
  },
};

// CSS-in-JS helper for styled-jsx
export const getTypographyCSS = (variant: keyof typeof typographyMixins): string => {
  const styles = typographyMixins[variant];
  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssKey}: ${value};`;
    })
    .join('\n          ');
};

// CSS classes for global styles (if needed)
export const generateGlobalTypographyCSS = (): string => {
  return `
    .chat-typography-message-text {
      ${getTypographyCSS('messageText')}
    }

    .chat-typography-input-text {
      ${getTypographyCSS('inputText')}
    }

    .chat-typography-timestamp {
      ${getTypographyCSS('timestamp')}
    }

    .chat-typography-header-title {
      ${getTypographyCSS('headerTitle')}
    }

    .chat-typography-header-subtitle {
      ${getTypographyCSS('headerSubtitle')}
    }

    .chat-typography-status-text {
      ${getTypographyCSS('statusText')}
    }

    .chat-typography-quick-reply-button {
      ${getTypographyCSS('quickReplyButton')}
    }

    .chat-typography-rich-content-title {
      ${getTypographyCSS('richContentTitle')}
    }

    .chat-typography-rich-content-subtitle {
      ${getTypographyCSS('richContentSubtitle')}
    }

    .chat-typography-rich-content-description {
      ${getTypographyCSS('richContentDescription')}
    }

    .chat-typography-error-text {
      ${getTypographyCSS('errorText')}
    }

    .chat-typography-counter-text {
      ${getTypographyCSS('counterText')}
    }

    .chat-typography-attachment-text {
      ${getTypographyCSS('attachmentText')}
    }

    .chat-typography-session-info {
      ${getTypographyCSS('sessionInfo')}
    }
  `;
};