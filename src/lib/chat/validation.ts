import { z } from 'zod';

// Chat Session Schemas
export const CreateSessionSchema = z.object({
  userId: z.string().optional(),
  guestEmail: z.string().email().optional(), // Keep for backward compatibility during transition
  guestPhone: z.string().regex(/^[+]?[\d\s\-()]{10,15}$/, 'Invalid phone number format').optional(), // New field for contact number
  metadata: z.record(z.any()).optional(),
});

export const GetSessionSchema = z.object({
  sessionId: z.string().cuid(),
});

// Chat Message Schemas
export const SendMessageSchema = z.object({
  sessionId: z.string().cuid(),
  content: z.string().min(1).max(1000),
  messageType: z.enum(['text', 'quick_reply']).default('text'),
  metadata: z.record(z.any()).optional(),
});

export const GetMessagesSchema = z.object({
  sessionId: z.string().cuid(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

// Webhook Schemas
export const WebhookResponseSchema = z.object({
  sessionId: z.string().cuid(),
  response: z.object({
    content: z.string().min(1),
    type: z.enum(['text', 'quick_reply', 'rich_content']).default('text'),
    quickReplies: z.array(z.string()).optional(),
    attachments: z.array(z.object({
      type: z.enum(['image', 'file', 'link']),
      url: z.string().url(),
      title: z.string().optional(),
    })).optional(),
  }),
  metadata: z.object({
    intent: z.string().optional(),
    confidence: z.number().optional(),
    context: z.record(z.any()).optional(),
  }).optional(),
});

// Chat Configuration Constants
export const CHAT_CONFIG = {
  SESSION_TIMEOUT: {
    GUEST: 30 * 60 * 1000, // 30 minutes - industry standard for customer support
    AUTHENTICATED: 2 * 60 * 60 * 1000, // 2 hours - reasonable for authenticated support users
  },
  MESSAGE_LIMITS: {
    MAX_LENGTH: 1000,
    MAX_HISTORY: 100,
  },
  WEBHOOK_LIMITS: {
    MAX_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // milliseconds
    TIMEOUT: 30000, // 30 seconds
  },
  RATE_LIMITS: {
    WINDOW: 60 * 1000, // 1 minute
    MAX_MESSAGES: 100, // Increased for testing
  },
} as const;

// Type exports
export type CreateSessionRequest = z.infer<typeof CreateSessionSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageSchema>;
export type GetMessagesRequest = z.infer<typeof GetMessagesSchema>;
export type WebhookResponse = z.infer<typeof WebhookResponseSchema>;